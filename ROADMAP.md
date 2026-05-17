# UptimeWatch — Roadmap & Backlog

## Go-Live Checklist

Everything needed before the first paying customer.

### Infrastructure
- [x] ~~Create Supabase project (free tier) and run `supabase/schema.sql` in SQL Editor~~
- [x] ~~Grant service_role table access (`GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role`)~~
- [x] ~~Push repo to GitHub~~
- [x] ~~Deploy to Vercel (Hobby tier) — connected to GitHub, env vars set~~
- [x] ~~Set up cron-job.org to trigger `/api/cron/check` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`~~ (Vercel Hobby doesn't support sub-daily crons)
- [ ] Create Resend account, verify a sender domain, update `from` address in `lib/resend.ts`, add `RESEND_API_KEY` to Vercel
- [ ] Create Stripe account, add product "UptimeWatch Pro" at $9/month recurring
- [ ] Copy Stripe Price ID into `STRIPE_PRO_PRICE_ID` env var
- [ ] Add Stripe webhook: `https://your-vercel-url.vercel.app/api/stripe/webhook`, events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel env vars to the live deployment URL
- [ ] Register a domain — ~$10/year on Namecheap or Cloudflare Registrar

### Legal (required before taking payments)
- [x] ~~Write a Privacy Policy~~ — `app/privacy/page.tsx` written, covers data collection, third parties, retention, user rights, GDPR
- [x] ~~Write Terms of Service~~ — `app/terms/page.tsx` written, covers billing, acceptable use, limitation of liability
- [x] ~~Add `/privacy` and `/terms` pages~~ — both live and linked from landing page footer and Settings
- [ ] Update contact emails in `/privacy` and `/terms` from `privacy@uptimewatch.io` / `legal@uptimewatch.io` to your real address
- [ ] Add cookie consent banner if targeting EU users (GDPR)

### Pre-launch testing
- [x] ~~Verify cron job hits the endpoint and processes monitors (confirmed via cron-job.org test run)~~
- [ ] Sign up as a real user, add monitors, verify checks appear in Supabase `monitor_checks` table
- [ ] Take one monitored URL down and verify down alert email arrives (needs Resend set up first)
- [ ] Bring it back up and verify recovery email arrives
- [ ] Complete a Stripe test checkout (use card `4242 4242 4242 4242`) and verify plan updates to Pro
- [ ] Cancel the Stripe subscription and verify plan downgrades to Free
- [ ] Set a status page slug and verify the public page is accessible

---

## Phase 1 — Missing MVP Features (ship before marketing)

### ~~Settings page~~ ✅ Done
- [x] Slug form with inline URL preview, format validation, reserved-word check, and uniqueness enforcement
- [x] Plan info card with current limits
- [x] "Manage billing" link to Stripe portal (Pro) / upgrade CTA (Free)
- [ ] Allow updating notification email (separate from login email) — still pending

### ~~Stripe Customer Portal~~ ✅ Done
- [x] `GET /api/stripe/portal` creates a portal session and redirects to Stripe
- [x] Linked from Settings page for Pro users
- [ ] Create Stripe Billing Portal configuration in Stripe Dashboard (one-time setup step — required before going live)

### ~~`/privacy` and `/terms` pages~~ ✅ Done
- [x] `app/privacy/page.tsx` — full policy, data collection, third parties, user rights
- [x] `app/terms/page.tsx` — billing terms, acceptable use, limitation of liability
- [ ] Replace placeholder contact emails with your real address before launch

### Monitor detail page improvements
- [ ] Show response time graph over time (line chart)
- [ ] Show incident history list with start time, resolved time, and duration
- [ ] Show average response time for last 24h / 7 days / 30 days

---

## Phase 2 — Growth Features (first 30 days after launch)

These directly drive conversion, retention, and organic growth.

### "Is your site down?" free tool
A public tool at `/check` — paste a URL, click Check, see if it's reachable.
- Captures SEO traffic for queries like "is my site down" (high volume)
- Converts visitors to signups via "Monitor this URL for free" CTA
- No auth required — dead simple one-shot check using `pingUrl()`

### Programmatic SEO landing pages
Auto-generate pages targeting high-intent keywords with minimal content work:
- `/monitor/[platform]` — e.g. `/monitor/vercel`, `/monitor/netlify`, `/monitor/railway`
- `/alternatives/[competitor]` — e.g. `/alternatives/uptimerobot`, `/alternatives/freshping`
- Each page ~300 words + CTA. Low effort, high SEO value.

### Email notification preferences
- [ ] Allow users to choose alert frequency (every outage, or only after 2+ consecutive failures)
- [ ] Add digest option: daily summary email even when everything is up
- [ ] Unsubscribe link in all alert emails (required for CAN-SPAM compliance)

### Status page customisation
- [ ] Allow users to set a custom title and logo on their status page (Pro feature)
- [ ] Allow users to add a custom domain for their status page (advanced Pro feature)
- [ ] Allow users to add a maintenance message / scheduled incident

---

## Phase 3 — Retention & Upsell Features (days 30–90)

Features that increase stickiness and move free users to Pro.

### Slack / webhook alerts
- [ ] Add a `notifications` table: `{ monitor_id, type ('email'|'slack'|'webhook'), config jsonb }`
- [ ] Allow users to paste a Slack webhook URL — send down/recovery alerts there
- [ ] Allow users to add a custom HTTP webhook endpoint — POST JSON payload on status change
- [ ] Gate Slack/webhook alerts behind Pro plan

### Multi-region checks (Pro)
Currently all checks run from a single Vercel region. Add multi-region to avoid false positives.
- [ ] Use Vercel Edge Functions or a secondary cron from a different region
- [ ] Only alert if the majority of regions report down
- [ ] Show per-region status on monitor detail page

### Response time SLA alerts
- [ ] Allow users to set a response time threshold (e.g. alert if > 2000ms)
- [ ] Track SLA breaches separately from outages
- [ ] Show SLA compliance % on status page

### Teams / shared access (Pro)
- [ ] Add `team_members` table: `{ team_id, user_id, role ('owner'|'member') }`
- [ ] Allow Pro users to invite teammates who can view (but not edit) monitors
- [ ] Shared status page for the whole team

### Weekly digest email
- [ ] Cron job every Monday: send each user a summary of the past week
- [ ] Include: total uptime %, any incidents, response time trends
- [ ] Keeps users engaged even when everything is working fine

---

## Phase 4 — Monetisation Expansion (3–6 months)

### Annual pricing
- [ ] Add an annual Pro plan ($7/mo billed yearly = $84/year) — 22% discount
- [ ] Stripe supports this natively with an annual price ID
- [ ] Show monthly vs annual toggle on landing page pricing section

### Lifetime deal (LTD)
- [ ] One-time payment of $99–149 for lifetime Pro access
- [ ] Great for AppSumo or direct launch (ProductHunt, Hacker News)
- [ ] Implement as a Stripe one-time payment that sets `plan = 'lifetime'` — skip subscription logic

### Agency / Team tier
- [ ] New plan at $29/mo: up to 5 team members, 50 monitors, white-label status pages
- [ ] Target: freelancers and agencies managing client sites

---

## Backlog (unordered)

Features worth building eventually — not time-sensitive.

| Item | Notes |
|---|---|
| SMS alerts | Twilio or Vonage — gate behind Pro. High-value for critical services |
| Phone call alerts | Twilio — highest urgency channel. Premium feature |
| HTTP keyword monitoring | Alert if a keyword appears/disappears in the response body |
| Port monitoring | Monitor non-HTTP services (databases, SMTP, etc.) by TCP port |
| SSL certificate expiry alerts | Warn 30/14/7 days before cert expires |
| DNS monitoring | Alert if DNS records change unexpectedly |
| Cron job monitoring (heartbeat) | User sends a ping every X minutes — alert if ping stops arriving |
| Mobile app | React Native — push notifications for incidents |
| Zapier / Make integration | Connect to thousands of other tools via webhooks |
| API access | Let Pro users query their monitor data via a REST API |
| Public metrics page | Show aggregate stats (total monitors, uptime SLA) — builds trust |
| Dark mode toggle | Currently follows system preference — add manual toggle |
| Bulk import via CSV | Let users import a list of URLs in one go |
| Monitor tags / groups | Organise monitors by project or environment (prod/staging) |
| Incident notes | Allow users to add a manual note to an incident (root cause, resolution) |
| Status page subscribers | Let visitors subscribe to email updates from a status page |
| Two-factor authentication | TOTP via Supabase Auth MFA — security-conscious users expect this |

---

## Known Issues & Tech Debt

- `proxy.ts` uses Next.js 16 API naming (`proxy.ts` instead of `middleware.ts`) — verified working on Vercel deployment; may need renaming if Next.js version changes
- Public RLS policy on `monitor_checks` is overly permissive (`using (true)`) — scope it to only checks belonging to monitors with a public slug
- `interval_minutes` column exists on monitors but the cron job runs all monitors every 5 minutes regardless — pro 1-minute checks are not yet differentiated at the cron level
- Settings page does not yet allow updating the notification email separately from the login email
- Email alerts (Resend) are not yet active — `RESEND_API_KEY` is not set; down/recovery alert code is wired up but emails will silently fail until Resend is configured
