# UptimeWatch — Deployment Guide

No email notifications for initial launch. Add Resend later when you have a domain.
All secrets are managed directly in Vercel — no local `.env.local` needed for production.

---

## Step 1 — Push to GitHub and deploy to Vercel (no env vars yet)

1. Go to **github.com → New repository** → name it `uptime-monitor` → copy the two commands it gives you to push an existing repo
2. Run in your terminal:
   ```bash
   cd /Users/karlo/Desktop/dev/uptime-monitor
   git add -A
   git commit -m "initial deploy"
   ```
   Then paste the two GitHub commands
3. Go to **vercel.com → Add New Project → Import Git Repository** → select `uptime-monitor`
4. Click **Deploy** without adding any env vars — it builds fine, just won't function yet
5. Note your live URL (e.g. `https://uptime-monitor-karlo.vercel.app`) — you'll need it for every step below

---

## Step 2 — Supabase

1. Go to **supabase.com** → Sign up → **New project**
   - Set a database password and save it
   - Pick a region closest to you
   - Wait ~2 min for it to provision

2. Go to **SQL Editor** (left sidebar) → **New query** → paste the entire contents of `supabase/schema.sql` → click **Run**
   - You should see "Success. No rows returned"

3. Go to **Settings → API**, copy these 3 values:
   ```
   NEXT_PUBLIC_SUPABASE_URL        ← "Project URL"
   NEXT_PUBLIC_SUPABASE_ANON_KEY   ← "anon public" under Project API keys
   SUPABASE_SERVICE_ROLE_KEY       ← "service_role" under Project API keys
   ```

4. Go to **Authentication → URL Configuration** → set **Site URL** to your Vercel URL

5. Add all 3 keys to **Vercel → your project → Settings → Environment Variables**

---

## Step 3 — Stripe

1. Go to **stripe.com** → Sign up → stay in **Test mode** (toggle top-left)

2. Go to **Products → Add product**
   - Name: `UptimeWatch Pro`
   - Click **Add a price** → Recurring → $9.00 → Monthly → **Save product**
   - Click into the price → copy the **Price ID** (starts with `price_test_`)

3. Go to **Developers → API keys**, copy both keys

4. Add all 3 to **Vercel → Environment Variables**:
   ```
   STRIPE_SECRET_KEY               ← starts with sk_test_
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  ← starts with pk_test_
   STRIPE_PRO_PRICE_ID             ← starts with price_test_
   ```

5. Go to **Settings → Billing → Customer portal**
   - Toggle **"Enable customer portal"** on
   - Set **Business name** to `UptimeWatch`
   - Set **Default redirect link** to `https://your-vercel-url.vercel.app/dashboard/settings`
   - Click **Save**

---

## Step 4 — Stripe webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL**: `https://your-vercel-url.vercel.app/api/stripe/webhook`
3. Select these 3 events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Click **Add endpoint** → click into it → **Signing secret → Reveal** → copy it
5. Add to **Vercel → Environment Variables**:
   ```
   STRIPE_WEBHOOK_SECRET           ← starts with whsec_
   ```

---

## Step 5 — Remaining env vars

**Generate a cron secret** — run this in your terminal:
```bash
openssl rand -hex 32
```

Add these final 2 to **Vercel → Environment Variables**:
```
CRON_SECRET             ← the hex string you just generated
NEXT_PUBLIC_APP_URL     ← your full Vercel URL, e.g. https://uptime-monitor-karlo.vercel.app
RESEND_API_KEY          ← leave blank for now, add when email is set up
```

---

## Step 6 — Redeploy

Vercel does not auto-redeploy when env vars are added. You must trigger it manually:

**Vercel → your project → Deployments → latest deploy → the three-dot menu → Redeploy**

Wait ~1 min. The app is now fully live.

---

## Step 7 — Test everything

1. **Auth**: go to your live URL → sign up with a real email
2. **Monitors**: add a URL → wait 5 min → go to **Supabase → Table Editor → monitor_checks** → confirm a row appears
3. **Stripe checkout**: go to Settings → click Upgrade → use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
4. After checkout → check **Supabase → profiles** → your row should show `plan = pro`
5. **Billing portal**: go to Settings → click "Manage billing" → confirm Stripe portal opens
6. Cancel from portal → check Supabase again → `plan` should flip back to `free`
7. **Status page**: go to Settings → enter a slug → visit `/status/your-slug` → confirm it's publicly accessible
8. **Cron job**: go to **Vercel → your project → Settings → Cron Jobs** → confirm the job appears

All 8 pass = you're ready for real users.

---

## Step 8 — Go live with real payments

When you're ready to accept real money, switch Stripe from test to live mode:

1. Toggle **Live mode** in Stripe dashboard (top-left)
2. Get new live API keys (starts with `sk_live_` and `pk_live_`)
3. Create a new live product and price → copy new `price_live_` ID
4. Create a new live webhook → copy new `whsec_live_` signing secret
5. Update all 4 Stripe env vars in Vercel with the live values
6. Redeploy

---

## Adding email alerts later (Resend)

When you have a domain:

1. Go to **resend.com** → add your domain → paste the DNS records into your registrar
2. Wait for "Verified" status (usually under 10 min on Cloudflare)
3. Get your API key
4. Update the `from` address in `lib/resend.ts` from `alerts@uptimewatch.io` to `alerts@yourdomain.com`
5. Add `RESEND_API_KEY` to Vercel env vars
6. Push the `lib/resend.ts` change → Vercel auto-deploys

No domain and want a free option? Use **Nodemailer + Gmail SMTP** — create a Gmail account, generate an App Password, and send from that. 500 emails/day free.