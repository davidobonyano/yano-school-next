-- ================= PAYMENT SYSTEM WITH ACADEMIC CONTEXT =================
-- This file creates the payment system that integrates with sessions and terms

-- Fee Structure Table
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions(id) on delete cascade not null,
  term_id uuid references public.academic_terms(id) on delete cascade not null,
  class_level text not null,
  stream text, -- for SS classes
  fee_type text not null check (fee_type in ('tuition', 'library', 'laboratory', 'sports', 'other')),
  amount decimal(10,2) not null,
  is_required boolean default true not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique fee structure per session/term/class/fee_type
  unique(session_id, term_id, class_level, stream, fee_type)
);

-- Payment Records Table
create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.school_students(id) on delete cascade not null,
  session_id uuid references public.academic_sessions(id) on delete cascade not null,
  term_id uuid references public.academic_terms(id) on delete cascade not null,
  fee_type text not null check (fee_type in ('tuition', 'library', 'laboratory', 'sports', 'other')),
  expected_amount decimal(10,2) not null,
  paid_amount decimal(10,2) default 0 not null,
  balance decimal(10,2) not null,
  status text not null default 'unpaid' check (status in ('paid', 'partial', 'unpaid', 'overdue')),
  due_date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique payment record per student/session/term/fee_type
  unique(student_id, session_id, term_id, fee_type)
);

-- Payment Transactions Table
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_record_id uuid references public.payment_records(id) on delete cascade not null,
  student_id uuid references public.school_students(id) on delete cascade not null,
  session_id uuid references public.academic_sessions(id) on delete cascade not null,
  term_id uuid references public.academic_terms(id) on delete cascade not null,
  amount decimal(10,2) not null,
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'card', 'check')),
  reference_number text,
  description text not null,
  transaction_date date not null,
  recorded_by uuid references public.teachers(id),
  created_at timestamptz default now() not null
);

-- Carry Over Balances Table
create table if not exists public.carry_over_balances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.school_students(id) on delete cascade not null,
  from_session_id uuid references public.academic_sessions(id) on delete cascade not null,
  from_term_id uuid references public.academic_terms(id) on delete cascade not null,
  to_session_id uuid references public.academic_sessions(id) on delete cascade not null,
  to_term_id uuid references public.academic_terms(id) on delete cascade not null,
  amount decimal(10,2) not null,
  fee_type text not null check (fee_type in ('tuition', 'library', 'laboratory', 'sports', 'other')),
  created_at timestamptz default now() not null,
  
  -- Ensure unique carry over per student/fee_type/from-to combination
  unique(student_id, fee_type, from_session_id, from_term_id, to_session_id, to_term_id)
);

-- Indexes for performance
create index if not exists idx_fee_structures_session_term on public.fee_structures(session_id, term_id);
create index if not exists idx_fee_structures_class on public.fee_structures(class_level, stream);
create index if not exists idx_fee_structures_type on public.fee_structures(fee_type);

create index if not exists idx_payment_records_student on public.payment_records(student_id);
create index if not exists idx_payment_records_session_term on public.payment_records(session_id, term_id);
create index if not exists idx_payment_records_status on public.payment_records(status);
create index if not exists idx_payment_records_fee_type on public.payment_records(fee_type);

create index if not exists idx_payment_transactions_student on public.payment_transactions(student_id);
create index if not exists idx_payment_transactions_session_term on public.payment_transactions(session_id, term_id);
create index if not exists idx_payment_transactions_date on public.payment_transactions(transaction_date);

create index if not exists idx_carry_over_student on public.carry_over_balances(student_id);
create index if not exists idx_carry_over_from on public.carry_over_balances(from_session_id, from_term_id);
create index if not exists idx_carry_over_to on public.carry_over_balances(to_session_id, to_term_id);

-- Triggers for updated_at
drop trigger if exists trg_fee_structures_updated_at on public.fee_structures;
create trigger trg_fee_structures_updated_at
  before update on public.fee_structures
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_payment_records_updated_at on public.payment_records;
create trigger trg_payment_records_updated_at
  before update on public.payment_records
  for each row execute function public.handle_updated_at();

-- Trigger to update payment record balance when transaction is added
create or replace function public.update_payment_record_balance()
returns trigger as $$
begin
  -- Update the payment record
  update public.payment_records
  set 
    paid_amount = paid_amount + NEW.amount,
    balance = expected_amount - (paid_amount + NEW.amount),
    status = case 
      when (paid_amount + NEW.amount) >= expected_amount then 'paid'
      when (paid_amount + NEW.amount) > 0 then 'partial'
      else 'unpaid'
    end,
    updated_at = now()
  where id = NEW.payment_record_id;
  
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_update_payment_balance on public.payment_transactions;
create trigger trg_update_payment_balance
  after insert on public.payment_transactions
  for each row execute function public.update_payment_record_balance();

-- RLS policies
alter table public.fee_structures enable row level security;
alter table public.payment_records enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.carry_over_balances enable row level security;

-- Fee structures: read access for all, write for admins
drop policy if exists "Allow read fee structures" on public.fee_structures;
create policy "Allow read fee structures" on public.fee_structures for select using (true);

drop policy if exists "Admins manage fee structures" on public.fee_structures;
create policy "Admins manage fee structures" on public.fee_structures for all using (true);

-- Payment records: students see own, teachers/admins see all
drop policy if exists "Students see own payment records" on public.payment_records;
create policy "Students see own payment records" on public.payment_records
  for select using (auth.uid()::text = student_id::text);

drop policy if exists "Teachers and admins see all payment records" on public.payment_records;
create policy "Teachers and admins see all payment records" on public.payment_records
  for select using (true);

drop policy if exists "Admins manage payment records" on public.payment_records;
create policy "Admins manage payment records" on public.payment_records for all using (true);

-- Payment transactions: students see own, teachers/admins see all
drop policy if exists "Students see own transactions" on public.payment_transactions;
create policy "Students see own transactions" on public.payment_transactions
  for select using (auth.uid()::text = student_id::text);

drop policy if exists "Teachers and admins see all transactions" on public.payment_transactions;
create policy "Teachers and admins see all transactions" on public.payment_transactions
  for select using (true);

drop policy if exists "Admins manage transactions" on public.payment_transactions;
create policy "Admins manage transactions" on public.payment_transactions for all using (true);

-- Carry over balances: students see own, teachers/admins see all
drop policy if exists "Students see own carry over" on public.carry_over_balances;
create policy "Students see own carry over" on public.carry_over_balances
  for select using (auth.uid()::text = student_id::text);

drop policy if exists "Teachers and admins see all carry over" on public.carry_over_balances;
create policy "Teachers and admins see all carry over" on public.carry_over_balances
  for select using (true);

drop policy if exists "Admins manage carry over" on public.carry_over_balances;
create policy "Admins manage carry over" on public.carry_over_balances for all using (true);

-- Helper functions for payment management

-- Function to get payment summary for a student in a specific session/term
create or replace function public.get_student_payment_summary(
  p_student_id uuid,
  p_session_id uuid,
  p_term_id uuid
)
returns table (
  student_id uuid,
  session_id uuid,
  term_id uuid,
  total_expected decimal,
  total_paid decimal,
  total_balance decimal,
  carry_over_from_previous decimal,
  net_amount_due decimal
) as $$
declare
  v_carry_over decimal := 0;
begin
  -- Get carry over from previous terms
  select coalesce(sum(amount), 0) into v_carry_over
  from public.carry_over_balances
  where student_id = p_student_id
    and to_session_id = p_session_id
    and to_term_id = p_term_id;
  
  return query
  select 
    pr.student_id,
    pr.session_id,
    pr.term_id,
    sum(pr.expected_amount) as total_expected,
    sum(pr.paid_amount) as total_paid,
    sum(pr.balance) as total_balance,
    v_carry_over as carry_over_from_previous,
    (sum(pr.balance) + v_carry_over) as net_amount_due
  from public.payment_records pr
  where pr.student_id = p_student_id
    and pr.session_id = p_session_id
    and pr.term_id = p_term_id
  group by pr.student_id, pr.session_id, pr.term_id;
end;
$$ language plpgsql security definer;

-- Function to get outstanding balances for carry over
create or replace function public.get_outstanding_balances_for_carry_over(
  p_from_session_id uuid,
  p_from_term_id uuid
)
returns table (
  student_id uuid,
  fee_type text,
  outstanding_amount decimal
) as $$
begin
  return query
  select 
    pr.student_id,
    pr.fee_type,
    pr.balance as outstanding_amount
  from public.payment_records pr
  where pr.session_id = p_from_session_id
    and pr.term_id = p_from_term_id
    and pr.balance > 0
    and pr.status in ('partial', 'unpaid', 'overdue');
end;
$$ language plpgsql security definer;

-- Function to create carry over balances
create or replace function public.create_carry_over_balances(
  p_from_session_id uuid,
  p_from_term_id uuid,
  p_to_session_id uuid,
  p_to_term_id uuid
)
returns void as $$
begin
  -- Insert carry over balances for all outstanding amounts
  insert into public.carry_over_balances (
    student_id, from_session_id, from_term_id, to_session_id, to_term_id, amount, fee_type
  )
  select 
    student_id,
    p_from_session_id,
    p_from_term_id,
    p_to_session_id,
    p_to_term_id,
    outstanding_amount,
    fee_type
  from public.get_outstanding_balances_for_carry_over(p_from_session_id, p_from_term_id);
end;
$$ language plpgsql security definer;

-- Function to get payment statistics for a session/term
create or replace function public.get_payment_statistics(
  p_session_id uuid,
  p_term_id uuid
)
returns table (
  total_students bigint,
  total_expected decimal,
  total_paid decimal,
  total_outstanding decimal,
  total_carry_over decimal
) as $$
begin
  return query
  select 
    count(distinct pr.student_id) as total_students,
    sum(pr.expected_amount) as total_expected,
    sum(pr.paid_amount) as total_paid,
    sum(pr.balance) as total_outstanding,
    coalesce(sum(cob.amount), 0) as total_carry_over
  from public.payment_records pr
  left join public.carry_over_balances cob on 
    pr.student_id = cob.student_id 
    and cob.to_session_id = p_session_id 
    and cob.to_term_id = p_term_id
  where pr.session_id = p_session_id and pr.term_id = p_term_id;
end;
$$ language plpgsql security definer;

-- Insert sample fee structure for 2025/2026 session
insert into public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
select 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'tuition' as fee_type,
  50000.00 as amount,
  true as is_required,
  'Tuition fee for JSS1 students'
from public.academic_sessions s
join public.academic_terms t on s.id = t.session_id
where s.name = '2025/2026' and t.name = '1st Term'
on conflict (session_id, term_id, class_level, stream, fee_type) do nothing;

insert into public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
select 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'library' as fee_type,
  5000.00 as amount,
  true as is_required,
  'Library fee for JSS1 students'
from public.academic_sessions s
join public.academic_terms t on s.id = t.session_id
where s.name = '2025/2026' and t.name = '1st Term'
on conflict (session_id, term_id, class_level, stream, fee_type) do nothing;

insert into public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
select 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'laboratory' as fee_type,
  3000.00 as amount,
  true as is_required,
  'Laboratory fee for JSS1 students'
from public.academic_sessions s
join public.academic_terms t on s.id = t.session_id
where s.name = '2025/2026' and t.name = '1st Term'
on conflict (session_id, term_id, class_level, stream, fee_type) do nothing;
