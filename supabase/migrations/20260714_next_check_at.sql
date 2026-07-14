-- Per-monitor scheduling so Pro's 1-minute interval is actually honored.
-- The cron selects monitors where next_check_at <= now() and pushes it forward
-- by interval_minutes after each check. With a 1-minute cron cadence this makes
-- free monitors (5 min) run every 5th tick and Pro monitors (1 min) run every
-- tick. Existing rows default to now() so they're due on the next run.
alter table monitors
  add column if not exists next_check_at timestamptz not null default now();

-- Partial indexes for the cron's hot query (P1-5). Most monitors are active,
-- so the predicate keeps these small.
create index if not exists monitors_is_active_idx
  on monitors(is_active) where is_active = true;
create index if not exists monitors_next_check_at_idx
  on monitors(next_check_at) where is_active = true;
