-- ================= COMPLETE DATABASE SETUP =================
-- Run this script in your Supabase SQL editor to fix all issues

-- 1. Create academic sessions and terms tables
create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(session_id, name)
);

create table if not exists public.current_academic_context (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions(id) not null,
  term_id uuid references public.academic_terms(id) not null,
  updated_at timestamptz default now() not null,
  unique(id)
);

-- 2. Insert sample academic data
insert into public.academic_sessions (name, start_date, end_date, is_active) values
('2025/2026', '2025-09-01', '2026-07-31', true),
('2024/2025', '2024-09-01', '2025-07-31', false)
on conflict (name) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  updated_at = now();

-- Insert terms for 2025/2026 session
insert into public.academic_terms (session_id, name, start_date, end_date, is_active) 
select 
  s.id,
  t.name,
  t.start_date,
  t.end_date,
  t.is_active
from public.academic_sessions s
cross join (values
  ('1st Term', '2025-09-01'::date, '2025-12-20'::date, true),
  ('2nd Term', '2026-01-05'::date, '2026-04-10'::date, false),
  ('3rd Term', '2026-04-21'::date, '2026-07-31'::date, false)
) as t(name, start_date, end_date, is_active)
where s.name = '2025/2026'
on conflict (session_id, name) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  updated_at = now();

-- Insert terms for 2024/2025 session
insert into public.academic_terms (session_id, name, start_date, end_date, is_active) 
select 
  s.id,
  t.name,
  t.start_date,
  t.end_date,
  t.is_active
from public.academic_sessions s
cross join (values
  ('1st Term', '2024-09-01'::date, '2024-12-20'::date, false),
  ('2nd Term', '2025-01-05'::date, '2025-04-10'::date, false),
  ('3rd Term', '2025-04-21'::date, '2025-07-31'::date, false)
) as t(name, start_date, end_date, is_active)
where s.name = '2024/2025'
on conflict (session_id, name) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  updated_at = now();

-- 3. Set current academic context
insert into public.current_academic_context (session_id, term_id)
select 
  s.id,
  t.id
from public.academic_sessions s
join public.academic_terms t on s.id = t.session_id
where s.name = '2025/2026' and t.name = '1st Term'
on conflict (id) do update set
  session_id = excluded.session_id,
  term_id = excluded.term_id,
  updated_at = now();

-- 4. Create the required database functions
create or replace function public.get_current_academic_context()
returns table (
  session_id uuid,
  session_name text,
  term_id uuid,
  term_name text,
  session_start date,
  session_end date,
  term_start date,
  term_end date
) as $$
begin
  return query
  select 
    s.id as session_id,
    s.name as session_name,
    t.id as term_id,
    t.name as term_name,
    s.start_date as session_start,
    s.end_date as session_end,
    t.start_date as term_start,
    t.end_date as term_end
  from public.current_academic_context c
  join public.academic_sessions s on c.session_id = s.id
  join public.academic_terms t on c.term_id = t.id
  where s.is_active = true and t.is_active = true;
end;
$$ language plpgsql security definer;

create or replace function public.get_all_academic_sessions()
returns table (
  id uuid,
  name text,
  start_date date,
  end_date date,
  is_active boolean
) as $$
begin
  return query
  select s.id, s.name, s.start_date, s.end_date, s.is_active
  from public.academic_sessions s
  order by s.start_date desc;
end;
$$ language plpgsql security definer;

create or replace function public.get_terms_for_session(p_session_id uuid)
returns table (
  id uuid,
  name text,
  start_date date,
  end_date date,
  is_active boolean
) as $$
begin
  return query
  select t.id, t.name, t.start_date, t.end_date, t.is_active
  from public.academic_terms t
  where t.session_id = p_session_id
  order by t.start_date;
end;
$$ language plpgsql security definer;

-- 5. Set up RLS policies
alter table public.academic_sessions enable row level security;
alter table public.academic_terms enable row level security;
alter table public.current_academic_context enable row level security;

-- Allow read access to all authenticated users
drop policy if exists "Allow read sessions" on public.academic_sessions;
create policy "Allow read sessions" on public.academic_sessions for select using (true);

drop policy if exists "Allow read terms" on public.academic_terms;
create policy "Allow read terms" on public.academic_terms for select using (true);

drop policy if exists "Allow read context" on public.current_academic_context;
create policy "Allow read context" on public.current_academic_context for select using (true);

-- Only admins can manage sessions and terms
drop policy if exists "Admins manage sessions" on public.academic_sessions;
create policy "Admins manage sessions" on public.academic_sessions for all using (true);

drop policy if exists "Admins manage terms" on public.academic_terms;
create policy "Admins manage terms" on public.academic_terms for all using (true);

drop policy if exists "Admins manage context" on public.current_academic_context;
create policy "Admins manage context" on public.current_academic_context for all using (true);

-- 6. Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.academic_sessions to anon, authenticated;
grant all on public.academic_terms to anon, authenticated;
grant all on public.current_academic_context to anon, authenticated;
grant execute on function public.get_current_academic_context() to anon, authenticated;
grant execute on function public.get_all_academic_sessions() to anon, authenticated;
grant execute on function public.get_terms_for_session(uuid) to anon, authenticated;

-- 7. Verify the setup
select 'Database setup completed successfully!' as status;

-- Check current context
select 'Current academic context:' as info;
select * from public.get_current_academic_context();

-- Check sessions
select 'Available sessions:' as info;
select * from public.get_all_academic_sessions();

-- Check terms for current session
select 'Terms for current session:' as info;
select 
  s.name as session_name,
  t.name as term_name,
  t.is_active
from public.academic_sessions s
join public.academic_terms t on s.id = t.session_id
where s.is_active = true
order by t.start_date;


