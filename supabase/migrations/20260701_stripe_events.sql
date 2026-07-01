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
