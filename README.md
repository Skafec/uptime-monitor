# UptimeWatch

Website uptime monitoring SaaS. Users add URLs, the app pings them every 5 minutes, and sends email alerts when a site goes down or recovers. Every user gets a public status page at `/status/[slug]`.

## Stack

- **Next.js** (App Router) — framework
- **Supabase** — Postgres database + auth
- **Resend** — transactional email alerts
- **Stripe** — billing ($9/mo Pro plan)
- **Vercel** — deployment (Hobby tier)
- **cron-job.org** — external cron trigger (Vercel Hobby does not support sub-daily crons)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables are managed in Vercel — see `DEPLOYMENT.md` for the full list and setup guide.

## Docs

- `DEPLOYMENT.md` — step-by-step setup and deployment guide
- `TECHNICAL.md` — architecture, data model, and core logic
- `ROADMAP.md` — go-live checklist, feature backlog, known issues
