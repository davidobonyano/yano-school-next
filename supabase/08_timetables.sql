-- Timetables table for class schedules
create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  class text not null,
  subject text not null,
  teacher_name text not null,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  period text not null,
  session_id uuid not null,
  term_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_timetables_session_term on public.timetables (session_id, term_id);
create index if not exists idx_timetables_class on public.timetables (class); 