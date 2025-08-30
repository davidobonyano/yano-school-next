-- Payments extensions: ledgers, receipts, adjustments, RPCs, and fee template seeds
-- Run in Supabase SQL Editor after 01_school_schema.sql

-- =================== ENUMS ===================
do $$ begin
  perform 1 from pg_type where typname = 'ledger_entry_type';
  if not found then
    create type public.ledger_entry_type as enum ('Bill','Payment','Adjustment','CarryForward');
  end if;
exception when duplicate_object then null; end $$;

do $$ begin
  perform 1 from pg_type where typname = 'payment_method';
  if not found then
    create type public.payment_method as enum ('Cash','Transfer','POS','Online');
  end if;
exception when duplicate_object then null; end $$;

-- =================== TABLES ===================
create table if not exists public.payment_ledgers (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  term text not null,
  session text not null,
  entry_type public.ledger_entry_type not null,
  amount numeric(12,2) not null,
  method public.payment_method null, -- only for Payment
  description text,
  balance_after numeric(12,2) not null default 0,
  recorded_by uuid null references public.teachers(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists trg_payment_ledgers_updated_at on public.payment_ledgers;
create trigger trg_payment_ledgers_updated_at
  before update on public.payment_ledgers
  for each row execute function public.handle_updated_at();

create index if not exists idx_payment_ledgers_student_term_session on public.payment_ledgers(student_id, term, session);
create index if not exists idx_payment_ledgers_created_at on public.payment_ledgers(created_at desc);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id text not null references public.school_students(student_id) on delete cascade,
  payment_ledger_id uuid null references public.payment_ledgers(id) on delete set null,
  amount numeric(12,2) not null,
  method public.payment_method not null,
  issued_at timestamptz default now() not null,
  created_by uuid null references public.teachers(id) on delete set null,
  pdf_url text null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists trg_receipts_updated_at on public.receipts;
create trigger trg_receipts_updated_at
  before update on public.receipts
  for each row execute function public.handle_updated_at();

-- =================== HELPERS ===================
-- Generate unique, human-friendly receipt number YAN-YYYYMMDD-XXXX
create or replace function public.generate_receipt_no()
returns text as $$
declare
  v_base text := to_char(current_date, 'YYYYMMDD');
  v_suffix int;
  v_receipt text;
begin
  for v_suffix in 1..10000 loop
    v_receipt := concat('YAN-', v_base, '-', lpad(v_suffix::text, 4, '0'));
    exit when not exists (select 1 from public.receipts r where r.receipt_no = v_receipt);
  end loop;
  return v_receipt;
end; $$ language plpgsql immutable;

-- Compute current balance for a student in a term/session
create or replace function public.get_student_balance(p_student_id text, p_term text, p_session text)
returns numeric as $$
declare v_balance numeric := 0; begin
  select coalesce(sum(case when entry_type in ('Bill','CarryForward') then amount else -amount end), 0)
    into v_balance
  from public.payment_ledgers
  where student_id = p_student_id and term = p_term and session = p_session;
  return v_balance;
end; $$ language plpgsql stable;

-- =================== TERM OPENING & BILLING ===================
-- Seed bills for all active students for a term/session from fee_structures
create or replace function public.open_term_seed_bills(p_term text, p_session text)
returns jsonb as $$
declare v_inserted int := 0; begin
  insert into public.payment_ledgers (student_id, term, session, entry_type, amount, description)
  select
    ss.student_id,
    p_term,
    p_session,
    'Bill'::public.ledger_entry_type,
    fs.total_fee,
    concat('School Fees - ', p_term)
  from public.school_students ss
  join public.fee_structures fs
    on fs.term = p_term and fs.session = p_session
   and (
     (ss.class_level in ('PRI1','PRI2','PRI3','PRI4','PRI5','PRI6') and fs.class_level_text = concat('Primary ', substring(ss.class_level from 4)))
     or (ss.class_level like 'JSS%' and fs.class_level_text = replace(ss.class_level, 'JSS', 'JSS '))
     or (ss.class_level like 'SS%' and (fs.class_level_text = ss.class_level or fs.class_level_text = replace(ss.class_level, 'SS', 'SS ')))
   )
  where ss.is_active = true
    and not exists (
      select 1 from public.payment_ledgers pl
      where pl.student_id = ss.student_id and pl.term = p_term and pl.session = p_session and pl.entry_type = 'Bill'
    )
  returning 1;

  get diagnostics v_inserted = row_count;

  -- update running balances
  update public.payment_ledgers pl set balance_after = public.get_student_balance(pl.student_id, pl.term, pl.session)
  where pl.term = p_term and pl.session = p_session;

  return jsonb_build_object('success', true, 'bills_inserted', v_inserted);
end; $$ language plpgsql security definer;

grant execute on function public.open_term_seed_bills to anon, authenticated;

-- Carry forward outstanding from previous term into current term as CarryForward entries
create or replace function public.carry_forward_outstanding(p_from_term text, p_from_session text, p_to_term text, p_to_session text)
returns jsonb as $$
declare v_inserted int := 0; begin
  insert into public.payment_ledgers (student_id, term, session, entry_type, amount, description, metadata)
  select
    pl.student_id,
    p_to_term,
    p_to_session,
    'CarryForward'::public.ledger_entry_type,
    greatest(public.get_student_balance(pl.student_id, p_from_term, p_from_session), 0),
    concat('Carry forward outstanding from ', p_from_term, ' ', p_from_session),
    jsonb_build_object('from_term', p_from_term, 'from_session', p_from_session)
  from public.payment_ledgers pl
  group by pl.student_id
  having greatest(public.get_student_balance(pl.student_id, p_from_term, p_from_session), 0) > 0
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  -- update balances on destination period
  update public.payment_ledgers pl set balance_after = public.get_student_balance(pl.student_id, pl.term, pl.session)
  where pl.term = p_to_term and pl.session = p_to_session;

  return jsonb_build_object('success', true, 'carried', v_inserted);
end; $$ language plpgsql security definer;

grant execute on function public.carry_forward_outstanding to anon, authenticated;

-- =================== PAYMENT RECORDING ===================
create or replace function public.record_payment(
  p_student_id text,
  p_term text,
  p_session text,
  p_amount numeric,
  p_method public.payment_method,
  p_recorded_by uuid,
  p_description text default 'Payment received'
) returns jsonb as $$
declare v_receipt_no text; v_balance_after numeric; v_ledger_id uuid; begin
  -- insert ledger entry
  insert into public.payment_ledgers (student_id, term, session, entry_type, amount, method, description, recorded_by)
  values (p_student_id, p_term, p_session, 'Payment', p_amount, p_method, p_description, p_recorded_by)
  returning id into v_ledger_id;

  -- update running balance for this period
  update public.payment_ledgers pl set balance_after = public.get_student_balance(p_student_id, p_term, p_session)
  where pl.id = v_ledger_id;

  select balance_after into v_balance_after from public.payment_ledgers where id = v_ledger_id;

  -- receipt
  v_receipt_no := public.generate_receipt_no();
  insert into public.receipts (receipt_no, student_id, payment_ledger_id, amount, method, created_by)
  values (v_receipt_no, p_student_id, v_ledger_id, p_amount, p_method, p_recorded_by);

  return jsonb_build_object('success', true, 'ledger_id', v_ledger_id, 'receipt_no', v_receipt_no, 'balance_after', v_balance_after);
end; $$ language plpgsql security definer;

grant execute on function public.record_payment to anon, authenticated;

-- =================== MANUAL ADJUSTMENTS ===================
create or replace function public.record_adjustment(
  p_student_id text,
  p_term text,
  p_session text,
  p_amount numeric,
  p_description text,
  p_recorded_by uuid
) returns jsonb as $$
declare v_ledger_id uuid; v_balance_after numeric; begin
  insert into public.payment_ledgers (student_id, term, session, entry_type, amount, description, recorded_by)
  values (p_student_id, p_term, p_session, 'Adjustment', p_amount, p_description, p_recorded_by)
  returning id into v_ledger_id;

  update public.payment_ledgers pl set balance_after = public.get_student_balance(p_student_id, p_term, p_session)
  where pl.id = v_ledger_id;

  select balance_after into v_balance_after from public.payment_ledgers where id = v_ledger_id;
  return jsonb_build_object('success', true, 'ledger_id', v_ledger_id, 'balance_after', v_balance_after);
end; $$ language plpgsql security definer;

grant execute on function public.record_adjustment to anon, authenticated;

-- =================== AGING & REPORTS ===================
-- Outstanding per student for a term/session
create or replace function public.get_outstanding_by_class(p_term text, p_session text)
returns table(student_id text, full_name text, class_level text, stream text, outstanding numeric) as $$
begin
  return query
  select ss.student_id, ss.full_name, ss.class_level::text, ss.stream,
         greatest(public.get_student_balance(ss.student_id, p_term, p_session), 0) as outstanding
  from public.school_students ss
  order by class_level, stream, full_name;
end; $$ language plpgsql stable;

grant execute on function public.get_outstanding_by_class to anon, authenticated;

-- Aging report: how many prior terms has debt existed
create or replace function public.get_outstanding_aging(p_current_term text, p_current_session text)
returns table(student_id text, full_name text, outstanding numeric, terms_owing int) as $$
begin
  return query
  with periods as (
    select unnest(array['First','Second','Third']) as term
  ),
  hist as (
    select ss.student_id, ss.full_name,
           sum(case when public.get_student_balance(ss.student_id, t.term, s.name) > 0 then 1 else 0 end) as terms_owing,
           greatest(public.get_student_balance(ss.student_id, p_current_term, p_current_session), 0) as current_outstanding
    from public.school_students ss
    cross join public.academic_sessions s
    cross join periods t
    group by ss.student_id, ss.full_name
  )
  select student_id, full_name, current_outstanding as outstanding, terms_owing
  from hist
  where current_outstanding > 0
  order by terms_owing desc, outstanding desc;
end; $$ language plpgsql stable;

grant execute on function public.get_outstanding_aging to anon, authenticated;

-- =================== RLS (open for now) ===================
alter table public.payment_ledgers enable row level security;
alter table public.receipts enable row level security;

-- =================== INSTALLMENT TRACKING ===================
create table if not exists public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.school_students(student_id) on delete cascade,
  term text not null,
  session text not null,
  total_installments int not null check (total_installments > 0),
  expected_per_installment numeric(12,2) not null default 0,
  completed_installments int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_installment_plan unique(student_id, term, session)
);

drop trigger if exists trg_installment_plans_updated_at on public.installment_plans;
create trigger trg_installment_plans_updated_at
  before update on public.installment_plans
  for each row execute function public.handle_updated_at();

create or replace function public.upsert_installment_plan(
  p_student_id text,
  p_term text,
  p_session text,
  p_total_installments int,
  p_expected_per_installment numeric
) returns jsonb as $$
declare v_id uuid; begin
  insert into public.installment_plans(student_id, term, session, total_installments, expected_per_installment)
  values (p_student_id, p_term, p_session, p_total_installments, p_expected_per_installment)
  on conflict (student_id, term, session)
  do update set total_installments = excluded.total_installments,
                expected_per_installment = excluded.expected_per_installment
  returning id into v_id;
  return jsonb_build_object('success', true, 'id', v_id);
end; $$ language plpgsql security definer;

grant execute on function public.upsert_installment_plan to anon, authenticated;

create or replace function public.record_installment_payment(
  p_student_id text,
  p_term text,
  p_session text,
  p_amount numeric,
  p_method public.payment_method,
  p_recorded_by uuid
) returns jsonb as $$
declare v_result jsonb; begin
  v_result := public.record_payment(p_student_id, p_term, p_session, p_amount, p_method, p_recorded_by, 'Installment payment');
  update public.installment_plans
    set completed_installments = completed_installments + 1
  where student_id = p_student_id and term = p_term and session = p_session;
  return v_result;
end; $$ language plpgsql security definer;

grant execute on function public.record_installment_payment to anon, authenticated;

-- =================== BULK ACTIONS ===================
-- Bulk mark payments: record payment equal to outstanding for a list of students
create or replace function public.bulk_mark_fully_paid(
  p_student_ids text[],
  p_term text,
  p_session text,
  p_method public.payment_method,
  p_recorded_by uuid
) returns jsonb as $$
declare v_processed int := 0; v_sid text; v_out numeric; begin
  foreach v_sid in array p_student_ids loop
    v_out := public.get_student_balance(v_sid, p_term, p_session);
    if v_out is not null and v_out > 0 then
      perform public.record_payment(v_sid, p_term, p_session, v_out, p_method, p_recorded_by, 'Bulk mark paid');
      v_processed := v_processed + 1;
    end if;
  end loop;
  return jsonb_build_object('success', true, 'processed', v_processed);
end; $$ language plpgsql security definer;

grant execute on function public.bulk_mark_fully_paid to anon, authenticated;

-- Bulk promote students and optionally seed bills for new term/session
create or replace function public.bulk_promote_students(
  p_student_ids text[],
  p_new_term text,
  p_new_session text,
  p_seed_bills boolean default true
) returns jsonb as $$
declare v_sid text; v_promoted int := 0; begin
  update public.school_students ss set class_level = case ss.class_level
    when 'KG1' then 'KG2'
    when 'PRI1' then 'PRI2'
    when 'PRI2' then 'PRI3'
    when 'PRI3' then 'PRI4'
    when 'PRI4' then 'PRI5'
    when 'PRI5' then 'PRI6'
    when 'JSS1' then 'JSS2'
    when 'JSS2' then 'JSS3'
    when 'SS1' then 'SS2'
    when 'SS2' then 'SS3'
    else ss.class_level
  end
  where ss.student_id = any(p_student_ids);
  get diagnostics v_promoted = row_count;

  if p_seed_bills then
    perform public.open_term_seed_bills(p_new_term, p_new_session);
  end if;

  return jsonb_build_object('success', true, 'promoted', v_promoted);
end; $$ language plpgsql security definer;

grant execute on function public.bulk_promote_students to anon, authenticated;

-- =================== SEEDS: FEE TEMPLATES ===================
-- Example seeds; idempotent based on unique (term, session, class_level_text)
insert into public.fee_structures (class_level_text, class_level_code, term, session, tuition_fee, development_levy, examination_fee, sports_fee, pta_fee, total_fee)
select * from (values
  ('JSS 1', 'JSS1'::public.class_level, 'First', '2024/2025', 90000, 0, 0, 0, 0, 90000),
  ('JSS 1', 'JSS1'::public.class_level, 'Second', '2024/2025', 90000, 0, 0, 0, 0, 90000),
  ('JSS 1', 'JSS1'::public.class_level, 'Third', '2024/2025', 90000, 0, 0, 0, 0, 90000),
  ('SS1',   'SS1'::public.class_level,   'First', '2024/2025', 120000, 0, 0, 0, 0, 120000),
  ('SS1',   'SS1'::public.class_level,   'Second', '2024/2025', 120000, 0, 0, 0, 0, 120000),
  ('SS1',   'SS1'::public.class_level,   'Third', '2024/2025', 120000, 0, 0, 0, 0, 120000),
  ('JSS 2', 'JSS2'::public.class_level, 'First', '2024/2025', 95000, 0, 0, 0, 0, 95000),
  ('JSS 2', 'JSS2'::public.class_level, 'Second', '2024/2025', 95000, 0, 0, 0, 0, 95000),
  ('JSS 2', 'JSS2'::public.class_level, 'Third', '2024/2025', 95000, 0, 0, 0, 0, 95000),
  ('SS2',   'SS2'::public.class_level,   'First', '2024/2025', 125000, 0, 0, 0, 0, 125000),
  ('SS2',   'SS2'::public.class_level,   'Second', '2024/2025', 125000, 0, 0, 0, 0, 125000),
  ('SS2',   'SS2'::public.class_level,   'Third', '2024/2025', 125000, 0, 0, 0, 0, 125000)
) v(class_text, class_code, term, session, tuition, dev, exam, sport, pta, total)
where not exists (
  select 1 from public.fee_structures fs where fs.term = v.term and fs.session = v.session and fs.class_level_text = v.class_text
);


