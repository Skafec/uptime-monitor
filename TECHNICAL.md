# UptimeWatch — Technical Overview

## What it is

UptimeWatch is a SaaS uptime monitoring tool. Users add URLs, the app pings them every 5 minutes via a Vercel Cron job, and sends email alerts when a site goes down or recovers. Every user gets a public status page at `/status/[slug]` — these pages link back to UptimeWatch automatically, providing organic SEO backlinks.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for status pages (SEO), API routes for backend |
| Database + Auth | Supabase | Postgres + Row Level Security + Auth in one free-tier service |
| Email | Resend | 3,000 emails/month free, reliable deliverability |
| Payments | Stripe | No monthly fee, 2.9% per transaction, webhooks for plan sync |
| Deployment | Vercel | Free tier + native cron job support |
| Styling | Tailwind CSS | Utility-first, no design system needed |

---

## Project Structure

```
uptime-monitor/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Email/password login via Supabase Auth
│   │   └── signup/page.tsx         # Registration + auto profile creation
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth-protected layout — nav: Dashboard, Settings, Status Page ↗
│   │   ├── dashboard/page.tsx      # Monitor list, add form, upgrade banner
│   │   ├── monitors/[id]/page.tsx  # Single monitor: history, response times, incidents
│   │   └── settings/page.tsx       # Slug form, plan info, billing portal link
│   ├── status/[slug]/page.tsx      # PUBLIC status page — server-rendered, SEO-optimised
│   ├── privacy/page.tsx            # Privacy Policy (static, publicly accessible)
│   ├── terms/page.tsx              # Terms of Service (static, publicly accessible)
│   ├── api/
│   │   ├── auth/callback/          # Supabase OAuth callback handler
│   │   ├── cron/check/route.ts     # Core cron job — pings all monitors
│   │   ├── monitors/route.ts       # GET all / POST new monitor
│   │   ├── monitors/[id]/route.ts  # PATCH (toggle) / DELETE monitor
│   │   ├── settings/slug/route.ts  # PATCH — validates and saves status_page_slug
│   │   ├── stripe/checkout/        # Creates Stripe Checkout session (or redirects to portal if already Pro)
│   │   ├── stripe/portal/          # GET — creates Stripe Billing Portal session and redirects
│   │   └── stripe/webhook/         # Handles Stripe events, syncs plan to DB
│   └── page.tsx                    # Landing page
├── components/
│   ├── AddMonitorForm.tsx          # Client form — posts to /api/monitors
│   ├── MonitorCard.tsx             # Dashboard card with status badge + last check time
│   ├── SlugForm.tsx                # Client form — PATCH /api/settings/slug, inline URL preview
│   ├── StatusBadge.tsx             # Green/red/grey pill component
│   ├── UptimeChart.tsx             # 90-day bar chart (coloured by daily uptime %)
│   ├── DeleteMonitorButton.tsx     # Client button — DELETE /api/monitors/[id]
│   ├── SignOutButton.tsx           # Calls supabase.auth.signOut()
│   └── ToggleMonitorButton.tsx     # Pause/resume a monitor
├── lib/
│   ├── supabase.ts                 # Server-side Supabase client (SSR, cookies)
│   ├── supabase-browser.ts         # Browser-side Supabase client
│   ├── resend.ts                   # sendDownAlert() and sendRecoveryAlert()
│   ├── stripe.ts                   # Stripe client + helpers
│   └── monitor.ts                  # pingUrl(), calculateUptimePercentage(), groupChecksByDay()
├── supabase/
│   └── schema.sql                  # Full DB schema with RLS policies
├── proxy.ts                        # Auth middleware (protects /dashboard routes)
└── vercel.json                     # Cron schedule: every 5 minutes
```

---

## Database Schema

### `profiles`
Extends Supabase Auth users. Created automatically on signup via a Postgres trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → auth.users |
| `email` | text | Copied from auth on signup |
| `plan` | text | `'free'` or `'pro'` |
| `stripe_customer_id` | text | Set on first Stripe checkout |
| `status_page_slug` | text | Unique slug for public status page |

### `monitors`
One row per URL being watched.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → profiles |
| `name` | text | Display name |
| `url` | text | The URL being pinged |
| `interval_minutes` | int | 5 (free) or 1 (pro) |
| `is_active` | boolean | Pause without deleting |
| `last_status` | text | `'up'`, `'down'`, or `'unknown'` |
| `last_checked_at` | timestamptz | When the cron last ran for this monitor |

### `monitor_checks`
Raw ping log. Every cron run writes one row per monitor.

| Column | Type | Notes |
|---|---|---|
| `monitor_id` | uuid | FK → monitors |
| `status` | text | `'up'` or `'down'` |
| `response_time_ms` | int | Round-trip time in ms |
| `status_code` | int | HTTP status code (null if unreachable) |
| `checked_at` | timestamptz | When the ping was made |

### `incidents`
One row per downtime event. Created when a monitor transitions `up → down`, resolved on `down → up`.

| Column | Type | Notes |
|---|---|---|
| `monitor_id` | uuid | FK → monitors |
| `started_at` | timestamptz | When the outage began |
| `resolved_at` | timestamptz | When the monitor came back up |
| `is_resolved` | boolean | False while outage is ongoing |

### Row Level Security
All tables have RLS enabled. Users can only read/write their own data. The service role key (used by the cron job) bypasses RLS. Public status pages use a special policy that allows reading monitors by slug without authentication.

---

## Core Logic

### How a monitor check works (`lib/monitor.ts` → `pingUrl()`)

1. `fetch()` the URL with a 10-second timeout and `AbortController`
2. Any HTTP response with status < 500 is considered `up` (4xx are still up — the server responded)
3. Network errors, timeouts, and 5xx responses are `down`
4. Returns `{ status, statusCode, responseTimeMs }`

### How the cron job works (`app/api/cron/check/route.ts`)

Runs every 5 minutes via Vercel Cron. Flow per monitor:

```
Fetch all active monitors (with profile.email join)
  → For each monitor (batched 10 at a time):
      pingUrl()
      → Write row to monitor_checks
      → Update monitors.last_status + last_checked_at
      → If previous: up, current: down
          → Insert incident (is_resolved: false)
          → sendDownAlert() via Resend
      → If previous: down, current: up
          → Update incident (is_resolved: true, resolved_at: now)
          → Calculate downtime duration
          → sendRecoveryAlert() via Resend
```

The cron route requires `Authorization: Bearer <CRON_SECRET>` — Vercel injects this automatically; manually hitting the endpoint without it returns 401.

### How uptime percentage is calculated (`lib/monitor.ts` → `calculateUptimePercentage()`)

```
uptime % = (checks with status 'up' / total checks) × 100
```

Rounded to 2 decimal places. Returns 100% if no checks exist yet.

### How the 90-day chart works (`lib/monitor.ts` → `groupChecksByDay()`)

Iterates over the last 90 days. For each day:
- Groups checks by date prefix (`checked_at.startsWith(dateStr)`)
- Returns `{ date, uptime, total, up }` per day
- Days with no checks get `uptime: -1` (rendered as grey in `UptimeChart`)

---

## Authentication Flow

1. User signs up at `/signup` → Supabase Auth creates user → Postgres trigger fires `handle_new_user()` → inserts row into `profiles`
2. Session stored in cookies via `@supabase/ssr`
3. `proxy.ts` (Next.js middleware) checks for a valid session on all `/dashboard/*` routes — redirects to `/login` if missing
4. Dashboard pages use `createServerSupabaseClient()` (server-side, reads cookies) — never the browser client

---

## Stripe Billing Flow

1. User clicks "Upgrade to Pro" → `GET /api/stripe/checkout` → creates a Stripe Checkout session with the Pro price ID → redirects user to Stripe
2. User pays on Stripe's hosted page → Stripe fires `checkout.session.completed` webhook
3. `/api/stripe/webhook` receives the event → updates `profiles.plan = 'pro'` and stores `stripe_customer_id`
4. On cancellation → Stripe fires `customer.subscription.deleted` → webhook sets `profiles.plan = 'free'`

Webhook validation uses `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` — requests without a valid signature are rejected.

### Billing portal (`app/api/stripe/portal/route.ts`)

Pro users access this via Settings → "Manage billing, invoices & cancellation". The route calls `createPortalSession()` with the user's `stripe_customer_id` and redirects to Stripe's hosted portal. The portal return URL is `/dashboard/settings`. If the user has no `stripe_customer_id` (e.g. manually granted Pro), they are redirected back to settings without error.

Note: if a Pro user clicks the "Upgrade to Pro" button in the nav, `/api/stripe/checkout` also detects `plan === 'pro'` and redirects to the portal automatically.

---

## Settings Page (`app/(dashboard)/settings/page.tsx`)

Server component. Fetches `plan`, `status_page_slug`, and `stripe_customer_id` from `profiles`.

**Slug section** — renders `SlugForm` (client component) with the current slug pre-filled. `SlugForm` calls `PATCH /api/settings/slug` on submit. The API validates:
- Format: `/^[a-z0-9-]{3,30}$/`
- Not in the reserved list (`dashboard`, `status`, `api`, `login`, `signup`, etc.)
- Unique across all profiles (Postgres unique constraint — returns 409 on collision)

Input sanitisation happens client-side (only allows `[a-z0-9-]` characters as you type) and is re-validated server-side.

**Billing section** — shows plan-specific content:
- Free: features comparison + upgrade CTA linking to `/api/stripe/checkout`
- Pro: current plan limits (Unlimited monitors, 1-min checks, 1-year history) + "Manage billing" link to `/api/stripe/portal`

---

## Public Status Page (`app/status/[slug]/page.tsx`)

- Fully server-rendered (no client JS required) — good for SEO and Googlebot
- Generates OG meta tags: `"[org] System Status | Powered by UptimeWatch"`
- `robots: { index: true, follow: true }` — intentionally indexed
- Footer contains a "Powered by UptimeWatch" link pointing to `NEXT_PUBLIC_APP_URL` — this is the organic backlink mechanism
- No authentication required — uses the service role client with public RLS policy

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in these values:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe Dashboard → Products → Pro plan → Price ID |
| `CRON_SECRET` | Any random string (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your deployed Vercel URL |

---

## How to Use the App

### As a user

1. **Sign up** at `/signup` — no credit card required
2. **Add a monitor** on the dashboard: enter a name and URL, click Add
3. The monitor will be checked within 5 minutes. Status shows as `up`, `down`, or `unknown` (not yet checked)
4. **Email alerts** fire automatically when your site goes down and again when it recovers
5. **View history** by clicking a monitor card — see 90 days of uptime bars and past incidents
6. **Set up your status page**: go to **Settings** in the nav → enter a slug (e.g. `mycompany`) → your public page is live at `/status/mycompany`. Once set, a "Status Page ↗" link appears in the nav
7. **Pause a monitor** with the toggle button — no checks run while paused, no alerts sent
8. **Upgrade to Pro** ($9/mo) for unlimited monitors, 1-minute check intervals, 1-year history, and a custom status page slug

### As the operator (you)

- **Cron job**: runs automatically on Vercel every 5 minutes. Check Vercel logs under Functions → `/api/cron/check` for run results
- **Monitor Stripe events**: Stripe Dashboard → Webhooks → recent deliveries
- **Database**: Supabase Dashboard → Table Editor to view monitors, checks, and incidents directly
- **Add a new user manually**: they just sign up — the trigger handles profile creation
