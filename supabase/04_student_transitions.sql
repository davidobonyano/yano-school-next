-- Student transitions: promote, demote, graduate

do $$
begin
  if not exists (select 1 from pg_type where typname = 'student_transition_action') then
    create type public.student_transition_action as enum ('Promote','Demote','Graduate');
  end if;
exception when duplicate_object then null; end $$;

create table if not exists public.student_transitions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.school_students(id) on delete cascade,
  from_class text,
  to_class text,
  from_stream text,
  to_stream text,
  action public.student_transition_action not null,
  session_id uuid references public.academic_sessions(id) on delete set null,
  term_id uuid references public.academic_terms(id) on delete set null,
  performed_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_transitions_student on public.student_transitions(student_id);
create index if not exists idx_student_transitions_action on public.student_transitions(action);
create index if not exists idx_student_transitions_session_term on public.student_transitions(session_id, term_id);

alter table public.student_transitions enable row level security;

do $$ begin
  drop policy if exists "View transitions" on public.student_transitions;
  create policy "View transitions" on public.student_transitions for select using (true);
  drop policy if exists "Manage transitions" on public.student_transitions;
  create policy "Manage transitions" on public.student_transitions for all using (true);
exception when others then null; end $$;






