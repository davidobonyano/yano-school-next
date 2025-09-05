-- ================= SESSION AND TERM MANAGEMENT =================
-- This file adds proper session and term management to the course system

-- Create academic sessions table
create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g., "2025/2026"
  start_date date not null,
  end_date date not null,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create terms table
create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions(id) on delete cascade not null,
  name text not null, -- e.g., "1st Term", "2nd Term", "3rd Term"
  start_date date not null,
  end_date date not null,
  is_active boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique term names within a session
  unique(session_id, name)
);

-- Create current session/term context table
create table if not exists public.current_academic_context (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions(id) not null,
  term_id uuid references public.academic_terms(id) not null,
  updated_at timestamptz default now() not null,
  
  -- Only one active context at a time
  unique(id)
);

-- Add session and term fields to courses table if they don't exist
do $$
begin
  -- Add session_id if it doesn't exist
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'courses' and column_name = 'session_id') then
    alter table public.courses add column session_id uuid references public.academic_sessions(id);
  end if;
  
  -- Add term_id if it doesn't exist
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'courses' and column_name = 'term_id') then
    alter table public.courses add column term_id uuid references public.academic_terms(id);
  end if;
end $$;

-- Update student_course_registrations to use proper foreign keys
do $$
begin
  -- Add session_id if it doesn't exist
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'student_course_registrations' and column_name = 'session_id') then
    alter table public.student_course_registrations add column session_id uuid references public.academic_sessions(id);
  end if;
  
  -- Add term_id if it doesn't exist
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'student_course_registrations' and column_name = 'term_id') then
    alter table public.student_course_registrations add column term_id uuid references public.academic_terms(id);
  end if;
end $$;

-- Indexes for performance
create index if not exists idx_sessions_active on public.academic_sessions(is_active);
create index if not exists idx_terms_session on public.academic_terms(session_id);
create index if not exists idx_terms_active on public.academic_terms(is_active);
create index if not exists idx_courses_session on public.courses(session_id);
create index if not exists idx_courses_term on public.courses(term_id);
create index if not exists idx_registrations_session on public.student_course_registrations(session_id);
create index if not exists idx_registrations_term on public.student_course_registrations(term_id);

-- Triggers for updated_at
drop trigger if exists trg_sessions_updated_at on public.academic_sessions;
create trigger trg_sessions_updated_at
  before update on public.academic_sessions
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_terms_updated_at on public.academic_terms;
create trigger trg_terms_updated_at
  before update on public.academic_terms
  for each row execute function public.handle_updated_at();

-- RLS policies
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

-- Insert default academic session (2025/2026)
insert into public.academic_sessions (name, start_date, end_date, is_active) values
('2025/2026', '2025-09-01', '2026-07-31', true)
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

-- Set current academic context
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

-- Helper functions for getting current context
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

-- Function to get all sessions
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

-- Function to get terms for a session
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

-- Function to activate a session
create or replace function public.activate_academic_session(p_session_id uuid)
returns void as $$
begin
  -- Deactivate all sessions
  update public.academic_sessions set is_active = false;
  
  -- Activate the specified session
  update public.academic_sessions set is_active = true where id = p_session_id;
  
  -- Update current context to first term of this session
  update public.current_academic_context 
  set session_id = p_session_id,
      term_id = (select id from public.academic_terms where session_id = p_session_id and name = '1st Term' limit 1),
      updated_at = now();
end;
$$ language plpgsql security definer;

-- Function to activate a term
create or replace function public.activate_academic_term(p_term_id uuid)
returns void as $$
declare
  v_session_id uuid;
begin
  -- Get the session for this term
  select session_id into v_session_id from public.academic_terms where id = p_term_id;
  
  if v_session_id is null then
    raise exception 'Term not found';
  end if;
  
  -- Deactivate all terms in this session
  update public.academic_terms set is_active = false where session_id = v_session_id;
  
  -- Activate the specified term
  update public.academic_terms set is_active = true where id = p_term_id;
  
  -- Update current context
  update public.current_academic_context 
  set session_id = v_session_id,
      term_id = p_term_id,
      updated_at = now();
end;
$$ language plpgsql security definer;











