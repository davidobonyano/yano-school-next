-- Achievements content managed by Admin
-- Run this in Supabase SQL editor

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null,
  description text not null,
  display_order int not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Helpful index for ordering
create index if not exists achievements_display_order_idx on public.achievements(display_order);
create index if not exists achievements_event_date_idx on public.achievements(event_date);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_achievements_updated_at on public.achievements;
create trigger set_achievements_updated_at
before update on public.achievements
for each row execute function public.set_updated_at();

-- RLS policies: read for anon, write for service/admin only (use your existing authz in API)
alter table public.achievements enable row level security;

-- Read policy for everyone
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'achievements' and policyname = 'Allow read for all'
  ) then
    create policy "Allow read for all" on public.achievements
      for select using (true);
  end if;
end $$;






