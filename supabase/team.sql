-- Leadership & Team content managed by Admin
-- Run in Supabase SQL editor

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  photo_url text,
  bio text default '',
  fun_fact text default '',
  display_order int not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists team_members_display_order_idx on public.team_members(display_order);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

alter table public.team_members enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'Allow read for all'
  ) then
    create policy "Allow read for all" on public.team_members
      for select using (true);
  end if;
end $$;






