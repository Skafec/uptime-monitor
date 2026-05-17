-- Users are handled by Supabase Auth

create table if not exists profiles (
  id uuid references auth.users primary key,
  email text not null,
  plan text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  status_page_slug text unique,
  created_at timestamptz default now()
);

create table if not exists monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  url text not null,
  interval_minutes int default 5,
  is_active boolean default true,
  last_checked_at timestamptz,
  last_status text check (last_status in ('up', 'down', 'unknown')) default 'unknown',
  created_at timestamptz default now()
);

create table if not exists monitor_checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid references monitors(id) on delete cascade,
  checked_at timestamptz default now(),
  status text check (status in ('up', 'down')),
  response_time_ms int,
  status_code int
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid references monitors(id) on delete cascade,
  started_at timestamptz default now(),
  resolved_at timestamptz,
  is_resolved boolean default false
);

-- Indexes
create index if not exists monitors_user_id_idx on monitors(user_id);
create index if not exists monitor_checks_monitor_id_checked_at_idx on monitor_checks(monitor_id, checked_at desc);
create index if not exists incidents_monitor_id_idx on incidents(monitor_id);

-- Row Level Security
alter table profiles enable row level security;
alter table monitors enable row level security;
alter table monitor_checks enable row level security;
alter table incidents enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Monitors policies
create policy "Users can view own monitors"
  on monitors for select
  using (auth.uid() = user_id);

create policy "Users can insert own monitors"
  on monitors for insert
  with check (auth.uid() = user_id);

create policy "Users can update own monitors"
  on monitors for update
  using (auth.uid() = user_id);

create policy "Users can delete own monitors"
  on monitors for delete
  using (auth.uid() = user_id);

-- Monitor checks policies
create policy "Users can view own monitor checks"
  on monitor_checks for select
  using (
    exists (
      select 1 from monitors
      where monitors.id = monitor_checks.monitor_id
      and monitors.user_id = auth.uid()
    )
  );

-- Incidents policies
create policy "Users can view own incidents"
  on incidents for select
  using (
    exists (
      select 1 from monitors
      where monitors.id = incidents.monitor_id
      and monitors.user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Public access for status pages (by slug)
create policy "Public can view monitors by slug"
  on monitors for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = monitors.user_id
      and profiles.status_page_slug is not null
    )
  );

create policy "Public can view monitor checks for status pages"
  on monitor_checks for select
  using (true);
