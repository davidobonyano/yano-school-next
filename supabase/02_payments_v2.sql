-- Payments v2 schema: fee structures, student charges, payment records, carry-over

-- Sessions and terms assumed to exist in existing schema:
-- tables: academic_sessions(id uuid pk, name text, start_date date, end_date date)
--         academic_terms(id uuid pk, session_id uuid fk -> academic_sessions, name text, start_date date, end_date date)
--         school_students(id uuid pk, student_id text unique, full_name text, class_level class_level enum, stream text)

-- Enumerations
do $$ begin
  create type fee_purpose as enum ('Tuition','Exam','Uniform','PTA','Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','partial','paid');
exception when duplicate_object then null; end $$;

-- Use existing fee_structures table from 01_school_schema.sql
-- No need to create a new one - the existing one already works with your system

-- The existing fee_structures table from 01_school_schema.sql already has the right structure
-- It uses class_level_text (text) and class_level_code (enum) which works with your system

-- Add term_name column to student_charges if it doesn't exist
do $$ begin
  alter table student_charges add column if not exists term_name text;
exception when duplicate_column then null; end $$;

create table if not exists student_charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.school_students(id) on delete cascade,
  session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term_id uuid not null references public.academic_terms(id) on delete cascade,
  term_name text not null, -- e.g., "1st Term", "2nd Term", "3rd Term"
  purpose fee_purpose not null,
  description text,
  amount bigint not null check (amount >= 0),
  carried_over boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, session_id, term_id, purpose, carried_over, description)
);

create table if not exists payment_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.school_students(id) on delete cascade,
  session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term_id uuid not null references public.academic_terms(id) on delete cascade,
  purpose fee_purpose not null,
  amount bigint not null check (amount > 0),
  paid_on date not null default current_date,
  reference text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Materialized ledger view per student/session/term
create materialized view if not exists payment_ledgers as
select 
  sc.student_id,
  sc.session_id,
  sc.term_id,
  sc.purpose,
  sum(sc.amount) as total_charged,
  coalesce((select sum(pr.amount) from payment_records pr where pr.student_id = sc.student_id and pr.session_id = sc.session_id and pr.term_id = sc.term_id and pr.purpose = sc.purpose),0) as total_paid,
  sum(sc.amount) - coalesce((select sum(pr.amount) from payment_records pr where pr.student_id = sc.student_id and pr.session_id = sc.session_id and pr.term_id = sc.term_id and pr.purpose = sc.purpose),0) as balance
from student_charges sc
group by sc.student_id, sc.session_id, sc.term_id, sc.purpose;

create index if not exists idx_payment_ledgers_student on payment_ledgers(student_id);

-- Helper function: carry forward unpaid balances from previous term/session
create or replace function carry_over_unpaid_balances(target_session uuid, target_term uuid)
returns void language plpgsql as $$
declare
  prev_term uuid;
  prev_session uuid;
  current_term_name text;
  current_session_name text;
begin
  -- Get current term and session names
  select t.name, s.name into current_term_name, current_session_name
  from public.academic_terms t
  join public.academic_sessions s on t.session_id = s.id
  where t.id = target_term;

  -- Determine previous term within same session by term name
  select t2.id into prev_term
  from public.academic_terms t
  join public.academic_terms t2 on t.session_id = t2.session_id
  where t.id = target_term
    and case 
          when t.name = '2nd Term' then t2.name = '1st Term'
          when t.name = '3rd Term' then t2.name = '2nd Term'
          else false
        end
  limit 1;

  if prev_term is null then
    -- Move to previous session's last term (3rd Term)
    select s2.id into prev_session
    from public.academic_sessions s
    join public.academic_sessions s2 on s2.start_date < s.start_date
    where s.id = target_session
    order by s2.start_date desc
    limit 1;
    if prev_session is null then
      return; -- Nothing to carry
    end if;
    select t3.id into prev_term from public.academic_terms t3 where t3.session_id = prev_session and t3.name = '3rd Term' limit 1;
  else
    select session_id into prev_session from public.academic_terms where id = prev_term;
  end if;

  -- Insert carry-over charges for balances > 0 (only unpaid amounts),
  -- computed directly from student_charges minus payment_records
  insert into student_charges (student_id, session_id, term_id, term_name, purpose, description, amount, carried_over)
  select
    sc.student_id,
    target_session,
    target_term,
    current_term_name,
    sc.purpose,
    'Previous Balance (' || (select name from public.academic_terms where id = prev_term) || ')',
    balance_due,
    true
  from (
    select
      sc.student_id,
      sc.purpose,
      greatest(sum(sc.amount) - coalesce((
        select sum(pr.amount)
        from payment_records pr
        where pr.student_id = sc.student_id
          and pr.session_id = prev_session
          and pr.term_id = prev_term
          and pr.purpose = sc.purpose
      ), 0), 0) as balance_due
    from student_charges sc
    where sc.session_id = prev_session
      and sc.term_id = prev_term
    group by sc.student_id, sc.purpose
    having greatest(sum(sc.amount) - coalesce((
      select sum(pr.amount)
      from payment_records pr
      where pr.student_id = sc.student_id
        and pr.session_id = prev_session
        and pr.term_id = prev_term
        and pr.purpose = sc.purpose
    ), 0), 0) > 0
  ) balances
  join student_charges sc on sc.student_id = balances.student_id and sc.purpose = balances.purpose
  on conflict do nothing;
end $$;

-- Helper function to refresh payment ledgers after payments
create or replace function refresh_payment_ledgers()
returns void language plpgsql as $$
begin
  refresh materialized view concurrently payment_ledgers;
end $$;

-- Trigger to keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger t_fee_structures_updated before update on fee_structures for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger t_student_charges_updated before update on student_charges for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Note: Fee structures are already managed by the existing system in 01_school_schema.sql
-- No need to create additional fee structures here

-- Helper function to create student charges with term names
-- This function works with the existing fee_structures table structure
create or replace function create_student_charges_for_term(p_session uuid, p_term uuid)
returns void language plpgsql as $$
begin
  -- Create student charges based on existing fee_structures table
  -- The existing table uses class_level_text and class_level_code
  insert into student_charges (student_id, session_id, term_id, term_name, purpose, description, amount, carried_over)
  select s.id, p_session, p_term, t.name, 'Tuition'::fee_purpose, 'Term Fee', fs.total_fee, false
  from public.school_students s
  join public.fee_structures fs on fs.class_level_code = s.class_level
  join public.academic_terms t on t.id = p_term
  where t.session_id = p_session
    and fs.term = t.name
    and fs.session = (select name from public.academic_sessions where id = p_session)
  on conflict do nothing;
end $$;


