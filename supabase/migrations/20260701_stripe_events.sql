-- Idempotency for Stripe webhooks.
-- Stripe retries on non-2xx and may deliver the same event more than once.
-- Recording each processed event id and skipping known ids makes the handler
-- safe against duplicates and races (the slug-default block ran twice before).
create table if not exists stripe_events (
  id text primary key,
  received_at timestamptz default now()
);

-- RLS on with no policies: only the service role (which bypasses RLS) writes
-- here; anon/authenticated clients get no access.
alter table stripe_events enable row level security;

-- The setup-time `GRANT ALL ... TO service_role` only covered tables that
-- existed then, so grant this new table explicitly. Without it, the webhook's
-- service-role insert gets "permission denied" and returns 500
-- ("Idempotency check failed"), so plan upgrades never persist.
grant all on table stripe_events to service_role;
