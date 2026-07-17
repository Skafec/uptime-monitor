# UptimeWatch

Website uptime monitoring SaaS. Users add URLs, the app pings them every 5 minutes, and sends email alerts when a site goes down or recovers. Every user gets a public status page at `/status/[slug]` that links back to UptimeWatch — an organic SEO backlink.

This README is the single source of truth for the project: architecture, data model, deployment, and the go-live plan. (Agent/tooling instructions live separately in `AGENTS.md` / `CLAUDE.md`.)

---

## Table of contents

1. [Stack](#stack)
2. [Local development](#local-development)
3. [Project structure](#project-structure)
4. [Data model](#data-model)
5. [Core logic](#core-logic)
6. [Authentication flow](#authentication-flow)
7. [Stripe billing flow](#stripe-billing-flow)
8. [Public status page](#public-status-page)
9. [Environment variables](#environment-variables)
10. [Deployment guide](#deployment-guide)
11. [Database migrations](#database-migrations)
12. [Go-live checklist](#go-live-checklist)
13. [Domain migration checklist](#domain-migration-checklist)
14. [Engineering backlog](#engineering-backlog)
15. [Product roadmap](#product-roadmap)
16. [Known issues & tech debt](#known-issues--tech-debt)

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19) | SSR for status pages (SEO) + API routes for the backend |
| Database + Auth | **Supabase** | Postgres + Row Level Security + Auth on one free tier |
| Email | **Resend** | Transactional down/recovery alerts |
| Payments | **Stripe** | $9/mo Pro plan, webhooks sync plan state to the DB |
| Deployment | **Vercel** (Hobby) | Free hosting |
| Cron | **cron-job.org** | Triggers the check endpoint every 5 min (Vercel Hobby has no sub-daily crons) |
| Styling | **Tailwind CSS** | Utility-first, no design system needed |

> **Middleware note:** the auth middleware file is `proxy.ts` (Next.js 16 naming), not `middleware.ts`.

---

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

Environment variables are managed in Vercel for production; copy `.env.example` to `.env.local` for local work. See [Environment variables](#environment-variables).

> If `next`/`eslint` fail with `Cannot find module '../...'`, the local `node_modules` is corrupted (bin entries copied instead of symlinked). Fix with a clean reinstall: `npm ci`.

---

## Project structure

```
uptime-monitor/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # Email/password login via Supabase Auth
│   │   └── signup/page.tsx          # Registration + auto profile creation
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Auth-protected layout — nav: Dashboard, Settings, Status Page ↗
│   │   ├── dashboard/page.tsx       # Monitor list, add form, upgrade banner
│   │   ├── monitors/[id]/page.tsx   # Single monitor: history, response times, incidents
│   │   └── settings/page.tsx        # Slug form, plan info, billing portal link
│   ├── status/[slug]/page.tsx       # PUBLIC status page — server-rendered, SEO-optimised
│   ├── privacy/page.tsx             # Privacy Policy (static, public)
│   ├── terms/page.tsx               # Terms of Service (static, public)
│   ├── api/
│   │   ├── auth/callback/           # Supabase OAuth callback handler
│   │   ├── cron/check/route.ts      # Core cron job — pings all active monitors
│   │   ├── monitors/route.ts        # GET all / POST new monitor
│   │   ├── monitors/[id]/route.ts   # PATCH / DELETE monitor
│   │   ├── settings/slug/route.ts   # PATCH — validates and saves status_page_slug
│   │   ├── stripe/checkout/         # Creates Checkout session (or redirects to portal if already Pro)
│   │   ├── stripe/portal/           # GET — creates Billing Portal session and redirects
│   │   └── stripe/webhook/          # Handles Stripe events, syncs plan to DB (idempotent)
│   └── page.tsx                     # Landing page
├── components/
│   ├── AddMonitorForm.tsx           # Client form — posts to /api/monitors
│   ├── MonitorCard.tsx              # Dashboard card with status badge + last check time
│   ├── SlugForm.tsx                 # Client form — PATCH /api/settings/slug, inline URL preview
│   ├── StatusBadge.tsx              # Green/red/grey pill
│   ├── UptimeChart.tsx              # 90-day bar chart (coloured by daily uptime %)
│   ├── DeleteMonitorButton.tsx      # Client button — DELETE /api/monitors/[id]
│   ├── SignOutButton.tsx            # supabase.auth.signOut()
│   ├── ToggleMonitorButton.tsx      # Pause/resume a monitor
├── lib/
│   ├── supabase.ts                  # Server + service-role Supabase clients, Database types
│   ├── supabase-browser.ts          # Browser-side Supabase client
│   ├── resend.ts                    # sendDownAlert() and sendRecoveryAlert()
│   ├── stripe.ts                    # Stripe client + helpers
│   └── monitor.ts                   # pingUrl(), isPublicUrl(), calculateUptimePercentage(), groupChecksByDay()
├── supabase/
│   ├── schema.sql                   # Full DB schema with RLS policies (fresh-install source of truth)
│   └── migrations/                  # Incremental migrations — run manually in the Supabase SQL Editor
├── proxy.ts                         # Auth middleware (protects /dashboard routes)
└── vercel.json                      # Currently empty ({}); cron is external (cron-job.org)
```

---

## Data model

All tables have **Row Level Security** enabled. Users can only read/write their own data. The **service-role** key (used by the cron job and the public status page) bypasses RLS. Public reads are scoped to owners who have published a status page (`status_page_slug IS NOT NULL`).

### `profiles`
Extends Supabase Auth users. Created automatically on signup via the `handle_new_user()` Postgres trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → `auth.users` |
| `email` | text | Copied from auth on signup |
| `plan` | text | `'free'` or `'pro'` |
| `stripe_customer_id` | text | Set on first Stripe checkout |
| `status_page_slug` | text | Unique; when set, the public status page is live |

### `monitors`
One row per URL being watched.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `profiles` |
| `name` | text | Display name |
| `url` | text | The URL being pinged (validated + SSRF-checked on write) |
| `interval_minutes` | int | `5` (free) or `1` (Pro) — enforced server-side |
| `is_active` | boolean | Pause without deleting |
| `last_status` | text | `'up'`, `'down'`, or `'unknown'` |
| `last_checked_at` | timestamptz | When the cron last ran for this monitor |

### `monitor_checks`
Raw ping log. Every cron run writes one row per monitor.

| Column | Type | Notes |
|---|---|---|
| `monitor_id` | uuid | FK → `monitors` |
| `status` | text | `'up'` or `'down'` |
| `response_time_ms` | int | Round-trip time in ms |
| `status_code` | int | HTTP status (null if unreachable) |
| `checked_at` | timestamptz | When the ping was made |

### `incidents`
One row per downtime event. Created on `up → down`, resolved on `down → up`.

| Column | Type | Notes |
|---|---|---|
| `monitor_id` | uuid | FK → `monitors` |
| `started_at` | timestamptz | When the outage began |
| `resolved_at` | timestamptz | When the monitor recovered |
| `is_resolved` | boolean | False while ongoing |

### `stripe_events`
Idempotency ledger for Stripe webhooks. Primary key is the Stripe event id; reprocessing a known id is a no-op. RLS enabled with no policies — only the service role writes here.

| Column | Type | Notes |
|---|---|---|
| `id` | text | Stripe event id (primary key) |
| `received_at` | timestamptz | When first processed |

---

## Core logic

### Monitor check — `lib/monitor.ts` → `pingUrl()`
1. `fetch()` the URL with a 10-second timeout via `AbortController`.
2. Any HTTP response with status `< 500` is `up` (4xx still means the server responded).
3. Network errors, timeouts, and 5xx are `down`.
4. Before fetching, the URL is re-validated with `isPublicUrl()` (SSRF guard) — private/reserved IPs and non-http(s) schemes are rejected, so a monitor whose DNS later resolves to a private address is refused rather than pinged.
5. Returns `{ status, statusCode, responseTimeMs }`.

### Cron job — `app/api/cron/check/route.ts`
Triggered every 5 minutes by **cron-job.org** with `Authorization: Bearer <CRON_SECRET>` (direct browser hits return 401). Per monitor, batched 10 at a time:

```
Fetch all active monitors (join profile email)
  → pingUrl()
  → write monitor_checks row
  → update monitors.last_status + last_checked_at
  → up → down:  insert incident (is_resolved: false) + sendDownAlert()
  → down → up:  resolve incident + compute downtime + sendRecoveryAlert()
```

### Uptime % — `calculateUptimePercentage()`
`(up checks / total checks) × 100`, 2 decimals. Returns 100% when there are no checks yet.

### 90-day chart — `groupChecksByDay()`
For each of the last 90 days returns `{ date, uptime, total, up }`. Days with no checks get `uptime: -1` (rendered grey in `UptimeChart`).

---

## Authentication flow
1. Signup at `/signup` → Supabase Auth creates the user → `handle_new_user()` trigger inserts the `profiles` row.
2. Session stored in cookies via `@supabase/ssr`.
3. `proxy.ts` middleware checks the session on `/dashboard/*` and redirects to `/login` if missing.
4. Dashboard pages use `createServerSupabaseClient()` (server-side, cookie-aware) — never the browser client.

---

## Stripe billing flow
1. "Upgrade to Pro" → `GET /api/stripe/checkout` creates a Checkout session with the Pro price ID → redirects to Stripe.
2. User pays → Stripe fires `checkout.session.completed`.
3. `/api/stripe/webhook` validates the signature (`STRIPE_WEBHOOK_SECRET`), records the event id in `stripe_events` for idempotency, then sets `profiles.plan = 'pro'` and stores `stripe_customer_id`.
4. Cancellation → `customer.subscription.deleted` → webhook sets `plan = 'free'`.

**Billing portal** (`/api/stripe/portal`): Pro users open it from Settings; the route creates a portal session for their `stripe_customer_id` and returns to `/dashboard/settings`. Clicking "Upgrade" while already Pro redirects to the portal instead.

---

## Public status page — `app/status/[slug]/page.tsx`
- Fully server-rendered (no client JS) — good for SEO/Googlebot.
- Reads via the **service-role client** (bypasses RLS); the anon key cannot read this data.
- OG meta: `"[org] System Status | Powered by UptimeWatch"`, `robots: index, follow`.
- Footer "Powered by UptimeWatch" link → `NEXT_PUBLIC_APP_URL` (the organic backlink).

---

## Environment variables

Managed in **Vercel → Settings → Environment Variables** for production; `.env.local` for local.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (keep secret) |
| `RESEND_API_KEY` | resend.com → API Keys (blank until email is set up) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys (`sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys (`pk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → signing secret (`whsec_…`) |
| `STRIPE_PRO_PRICE_ID` | Stripe → Products → Pro price (`price_…`) |
| `CRON_SECRET` | `openssl rand -hex 32` — must match the cron-job.org header |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL |

---

## Deployment guide

> Vercel does **not** auto-redeploy when env vars change — trigger a manual redeploy after editing them.

### 1. Deploy to Vercel
Push to GitHub, import the repo at vercel.com, and Deploy (it builds without env vars, just won't function yet). Note the live URL.

### 2. Supabase
1. Create a project. In the **SQL Editor**, run the full `supabase/schema.sql`.
2. Grant service-role access:
   ```sql
   GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
   ```
3. **Settings → API**: copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` into Vercel.
4. **Authentication → URL Configuration**: set Site URL to your deployed URL.

### 3. Stripe (test mode first)
1. **Products → Add product** → `UptimeWatch Pro`, recurring $9/month → copy the Price ID.
2. **Developers → API Keys** → copy secret + publishable keys.
3. Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID` to Vercel.
4. **Settings → Billing → Customer portal**: enable it, set business name, set default redirect to `/dashboard/settings`.

### 4. Stripe webhook
1. **Developers → Webhooks → Add endpoint**: `https://<your-url>/api/stripe/webhook`.
2. Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`.
3. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel.

### 5. Remaining env vars
`CRON_SECRET` (`openssl rand -hex 32`), `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` (blank for now).

### 6. cron-job.org
Create a job hitting `https://<your-url>/api/cron/check` every 5 minutes, with header `Authorization: Bearer <CRON_SECRET>`. Do a test run — expect 200.

### 7. Redeploy
**Deployments → latest → ⋯ → Redeploy.**

### 8. Going live with real payments
Switch Stripe to **Live mode**, create live keys/product/webhook, update all four Stripe env vars in Vercel, redeploy.

### Email alerts (Resend) — requires a domain
1. resend.com → add your domain → add the DNS records at your registrar → wait for "Verified".
2. Get the API key → `RESEND_API_KEY` in Vercel.
3. Update the `from` address in `lib/resend.ts` to `alerts@yourdomain.com`.
4. Push → Vercel auto-deploys.

---

## Database migrations

**Migrations are not applied automatically** — there is no CI or Supabase CLI link. Each file in `supabase/migrations/` must be run **manually** in the Supabase SQL Editor. `schema.sql` is the fresh-install source of truth; migrations are the deltas to apply on an existing DB.

> ⚠️ **New tables need a service-role grant.** The setup-time `GRANT ALL ... TO service_role` only covers tables that existed then. A migration that creates a **new table** must also `grant all on table <name> to service_role;` — otherwise the service-role client (cron, webhook) gets "permission denied" at runtime (this caused a webhook 500 "Idempotency check failed" for `stripe_events`; see T-6).

| Migration | Purpose | Applied to prod |
|---|---|---|
| `20260528_tighten_public_rls.sql` | Scope public reads to slug owners (P0-1) | ✅ |
| `20260701_stripe_events.sql` | Webhook idempotency table + service-role grant (P0-5, T-6) | ✅ |
| `20260712_consecutive_failures.sql` | Flap-protection counter (P1-1) | ✅ |
| `20260714_next_check_at.sql` | Per-monitor scheduling + partial indexes (P1-2, P1-5) | ⬜ run in Supabase |

To verify a migration landed, e.g.:
```sql
select to_regclass('public.stripe_events');           -- table exists?
select polname, pg_get_expr(polqual, polrelid)         -- policy scoped, not `true`?
from pg_policy where polname like 'Public can view%';
```

---

## Go-live checklist

### Security hardening (P0) — ✅ complete
All shipped and (where applicable) migrated to prod:
- **P0-1** Public RLS scoped to slug owners.
- **P0-2** SSRF protection in `pingUrl` + URL validation on write.
- **P0-3** Server-side plan enforcement on `interval_minutes`.
- **P0-4** Authorised `generateMetadata` on the monitor detail page.
- **P0-5** Stripe webhook idempotency (`stripe_events`).

### Infrastructure
- [x] Supabase project + `schema.sql` run + service-role grants
- [x] Deployed to Vercel with env vars
- [x] cron-job.org triggering `/api/cron/check` every 5 min
- [ ] **Register a domain** (~$10/yr) — unblocks Resend and professional URLs
- [ ] **Resend**: verify sender domain, set `RESEND_API_KEY`, update `from` in `lib/resend.ts`
- [ ] **Stripe**: product + price, 4 env vars, webhook, billing portal config
- [ ] `NEXT_PUBLIC_APP_URL` set to the live URL

### Legal (required before taking payments)
- [x] Privacy Policy (`/privacy`) and Terms (`/terms`) written and linked
- [x] Replace placeholder contact emails with the real address (`support@uptimewatchhq.com`)
- [ ] Cookie consent banner if targeting EU users (GDPR)

### Pre-launch testing (none verified yet)
- [ ] Sign up as a real user; add a monitor; confirm a `monitor_checks` row appears
- [ ] Take a URL down → down alert email arrives (needs Resend)
- [ ] Bring it up → recovery email arrives
- [ ] Stripe test checkout (`4242 4242 4242 4242`) → plan flips to Pro
- [ ] Cancel subscription → plan flips back to Free
- [ ] Set a slug → `/status/<slug>` is publicly accessible

---

## Domain migration checklist

When a real domain is registered, update:

**Code**
- [ ] `lib/resend.ts` — `from:` → `alerts@yourdomain.com` (both `sendDownAlert` and `sendRecoveryAlert`)
- [ ] `app/privacy/page.tsx` — real contact email
- [ ] `app/terms/page.tsx` — real contact email

**Vercel env**
- [ ] `NEXT_PUBLIC_APP_URL` → `https://yourdomain.com`

**Third-party services**
- [ ] Resend — add + verify the domain (SPF, DKIM, DMARC), then update the `from` address
- [ ] Stripe webhook — endpoint → `https://yourdomain.com/api/stripe/webhook`
- [ ] cron-job.org — job URL → `https://yourdomain.com/api/cron/check`
- [ ] Supabase → Authentication → URL Configuration → Site URL → `https://yourdomain.com`

---

## Engineering backlog

Tasks are independent; one PR each. Run `npm run lint` and `npm run build` before opening a PR, and paste anon-key test queries in the description for RLS changes.

### P1 — Reliability & correctness
- **P1-1 Flap protection** — require N consecutive failures before alerting. Add `monitors.consecutive_failures int default 0`; alert only when it crosses `FAILURE_THRESHOLD = 2`. Prevents emailing on a single blip. *(migration + `lib/supabase.ts` type + cron logic)*
- ~~**P1-2 Respect `interval_minutes` in cron**~~ — ✅ done. `monitors.next_check_at` added; cron selects due monitors and reschedules by interval. Requires the cron-job.org schedule set to every 1 minute to deliver Pro 1-minute checks.
- **P1-3 N+1 on status page** — replace the per-monitor query loop with one `.in('monitor_id', ids)` query + `Object.groupBy`; add `revalidate = 60`.
- **P1-4 Timezone bucketing** — `groupChecksByDay()` buckets by UTC date prefix; add an optional `timeZone` arg using `Intl.DateTimeFormat('en-CA', …)`. Callers stay on UTC for now.
- ~~**P1-5 Indexes**~~ — ✅ done alongside P1-2 (partial indexes on `monitors(is_active)` and `monitors(next_check_at)`).

### P2 — Product / UX
- **P2-1 Response-time chart** on the monitor detail page (pure SVG, no chart lib; p50/p95/p99).
- **P2-2 Incident list on the public status page** (needs a public `incidents` RLS policy scoped like P0-1).
- **P2-3 Custom display name** for the status page (`profiles.display_name`) instead of the email prefix.
- ~~**P2-4 Replace `AccessGuard`**~~ — ✅ done: the client-side beta gate was **removed** for public launch (real Supabase auth already protects the app). Deleted `components/AccessGuard.tsx`, the layout wrapper, the empty `app/gate` + `app/api/gate` dirs, and the `NEXT_PUBLIC_ACCESS_PASSWORD` env var.
- **P2-5 Notification email** separate from login email (`profiles.notification_email`, preferred in the cron alert path).

### P3 — Tech debt
- **P3-1** Drop the lazy `Proxy` export in `lib/stripe.ts` (no direct importers).
- **P3-2** Replace `supabase: any` in the cron route with `SupabaseClient<Database>`.
- **P3-3** Pull the Resend `from` address from `RESEND_FROM` env (currently hardcoded `onboarding@resend.dev`, which only delivers to the account owner).
- **P3-4** Extract inline HTML email templates from `lib/resend.ts` into `lib/email-templates/`.
- **P3-5** Delete the empty `vercel.json` (or add real config).

### Guardrails (don't do without owner sign-off)
- No new Stripe plans / pricing changes. No chart or state-management libraries. No test infra as a task precondition. One PR per task — don't bundle. Don't regenerate `package-lock.json` unless a dependency actually changed.

---

## Product roadmap

### Phase 1 — MVP polish
Settings, Stripe portal, `/privacy` + `/terms` are done. Remaining: response-time graph, incident history, 24h/7d/30d averages (see P2-1/P2-2), notification email (P2-5).

### Phase 2 — Growth (first 30 days)
- **"Is your site down?" free tool** at `/check` — no-auth one-shot check using `pingUrl()`; SEO magnet + signup CTA.
- **Programmatic SEO pages** — `/monitor/[platform]`, `/alternatives/[competitor]`.
- **Email preferences** — alert frequency, daily digest, unsubscribe link (CAN-SPAM).
- **Status page customisation** — custom title/logo, custom domain, maintenance messages.

### Phase 3 — Retention & upsell (30–90 days)
Slack/webhook alerts, multi-region checks, response-time SLA alerts, teams/shared access, weekly digest email.

### Phase 4 — Monetisation
Annual pricing, lifetime deal (AppSumo/PH/HN), agency/team tier.

### Backlog (unordered)
SMS/phone alerts, keyword monitoring, port monitoring, SSL-expiry alerts, DNS monitoring, heartbeat/cron monitoring, mobile app, Zapier/Make, public REST API, public metrics page, dark-mode toggle, CSV bulk import, monitor tags/groups, incident notes, status-page subscribers, 2FA (Supabase MFA).

---

## Known issues & tech debt
- `proxy.ts` uses Next.js 16 middleware naming (not `middleware.ts`) — verified on Vercel; may need renaming across major Next versions.
- ~~`AccessGuard` beta gate is a client-side, bundle-exposed password~~ — removed for public launch (P2-4). Remember to delete `NEXT_PUBLIC_ACCESS_PASSWORD` from Vercel env vars.
- ~~Cron runs every monitor every 5 minutes regardless of `interval_minutes`~~ — **fixed (P1-2):** the cron now selects only monitors due per `next_check_at` and reschedules by `interval_minutes`. **To actually deliver Pro 1-minute checks, set the cron-job.org schedule to every 1 minute** (with 5-min cadence, free and Pro still both effectively run every 5 min).
- Email alerts are wired up but **silent until Resend is configured** (`RESEND_API_KEY` unset, and `from` is `onboarding@resend.dev` which only mails the account owner). Tracked as **P3-3** + domain setup.
- Settings can't yet set a notification email separate from the login email. Tracked as **P2-5**.

### Found during launch testing (2026-07-14)
- **T-1 — `isPublicUrl` false-positive on Vercel [FIXED].** The SSRF guard (from P0-2) rejected `https://example.com` in the deployed runtime (recorded as `down`, `0 ms`, `null` status_code — rejected before fetch), while `https://google.com` passed. **Root cause:** not the private-range logic (that correctly passes example.com's real addresses) — it was a **transient `dns.lookup` failure** in Vercel's serverless runtime; the guard's `catch → return false` turned a momentary DNS blip into a hard rejection of a valid URL (re-adding it later succeeded). **Fix:** `lookupAll()` retries the DNS lookup (3 attempts, small backoff) before failing, and logs the resolver error code on genuine failure. Private-range checks unchanged (no security loosening). Files: `lib/monitor.ts`.
- **T-2 — No edit-monitor UI [medium].** The dashboard only exposes pause/resume and delete; a user can't fix a typo'd URL or rename a monitor without deleting it (and losing its check history). The PATCH API + validation already exist — this just needs a small frontend form wired to `PATCH /api/monitors/[id]`. Files: `components/` (new form), monitor detail page.
- **T-3 — Auth emails need custom SMTP [go-live; code done, config pending].** Supabase's built-in auth email is rate-limited and didn't deliver the signup confirmation. **Decision: enable confirmation + route auth SMTP through Resend.** Code side is done — the signup page now branches on the `signUp` session: session present (confirmation off) → dashboard; no session (confirmation on) → "check your email" screen (previously it dead-ended on "Redirecting…"). **Remaining (dashboard, no code):** in Supabase → Auth → SMTP Settings, enable custom SMTP (`smtp.resend.com`, port 465, user `resend`, password = Resend API key, sender on `uptimewatchhq.com`), then turn **Confirm email** on.
- **T-4 — New failing monitor shows `unknown` until the 2nd failure [low, by design].** A consequence of flap protection (P1-1): the first failing check keeps the declared status at its previous value, so a brand-new monitor that fails once displays `unknown` rather than `down` until the second consecutive failure. Acceptable, but could be softened in the UI later.
- **T-5 — Settings page 404 [FIXED].** All links/redirects pointed at `/dashboard/settings`, but the route group `(dashboard)` is stripped from the URL so the real route is `/settings`. Fixed the nav link, the dashboard CTA, and both Stripe portal redirect URLs. Files: `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/api/stripe/portal/route.ts`.
- **T-6 — `stripe_events` migration missing service-role grant [FIXED].** The webhook returned 500 `Idempotency check failed` after a successful checkout, so the plan never flipped to Pro. The setup `GRANT ALL ... TO service_role` predated the `stripe_events` table, so the service-role insert hit "permission denied." Fixed in prod via `grant all on table stripe_events to service_role;`, and now added to the migration + `schema.sql` so fresh installs are covered. See the grant warning in [Database migrations](#database-migrations).
