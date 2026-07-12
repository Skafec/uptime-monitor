-- Flap protection: track consecutive failing checks per monitor so we only
-- declare an outage (open an incident + send a down alert) after N failures
-- in a row, rather than on the very first blip.
alter table monitors
  add column if not exists consecutive_failures int not null default 0;
