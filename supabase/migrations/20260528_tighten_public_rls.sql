-- Tighten public RLS policies on monitors and monitor_checks.
-- Previously monitor_checks used `using (true)` — any anon key could read
-- every check in the database. Scope both policies to only monitors whose
-- owner has explicitly published a status page (status_page_slug IS NOT NULL).

drop policy if exists "Public can view monitors by slug" on monitors;
drop policy if exists "Public can view monitor checks for status pages" on monitor_checks;

-- Monitors: public read only for monitors owned by a user who has a status page
create policy "Public can view monitors by slug"
  on monitors for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = monitors.user_id
        and profiles.status_page_slug is not null
    )
  );

-- Monitor checks: public read only when the monitor's owner has a status page
create policy "Public can view monitor checks for status pages"
  on monitor_checks for select
  using (
    exists (
      select 1 from monitors
      join profiles on profiles.id = monitors.user_id
      where monitors.id = monitor_checks.monitor_id
        and profiles.status_page_slug is not null
    )
  );
