-- Reset Payment System: drop payment-related objects in safe dependency order
-- WARNING: This will delete payment data. Back up before running.

-- 1) Drop dependent functions first
do $$ begin
  perform 1 from pg_proc where proname = 'bulk_mark_fully_paid';
  if found then execute 'drop function if exists public.bulk_mark_fully_paid(text[], text, text, public.payment_method, uuid) cascade'; end if;
  perform 1 from pg_proc where proname = 'record_installment_payment';
  if found then execute 'drop function if exists public.record_installment_payment(text, text, text, numeric, public.payment_method, uuid) cascade'; end if;
  perform 1 from pg_proc where proname = 'upsert_installment_plan';
  if found then execute 'drop function if exists public.upsert_installment_plan(text, text, text, int, numeric) cascade'; end if;
  perform 1 from pg_proc where proname = 'get_outstanding_aging';
  if found then execute 'drop function if exists public.get_outstanding_aging(text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'get_outstanding_by_class';
  if found then execute 'drop function if exists public.get_outstanding_by_class(text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'record_adjustment';
  if found then execute 'drop function if exists public.record_adjustment(text, text, text, numeric, text, uuid) cascade'; end if;
  perform 1 from pg_proc where proname = 'record_payment';
  if found then execute 'drop function if exists public.record_payment(text, text, text, numeric, public.payment_method, uuid, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'get_student_balance';
  if found then execute 'drop function if exists public.get_student_balance(text, text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'generate_receipt_no';
  if found then execute 'drop function if exists public.generate_receipt_no() cascade'; end if;
  perform 1 from pg_proc where proname = 'open_term_seed_bills';
  if found then execute 'drop function if exists public.open_term_seed_bills(text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'carry_forward_outstanding';
  if found then execute 'drop function if exists public.carry_forward_outstanding(text, text, text, text) cascade'; end if;
  -- From 04_payment_system.sql (structured system)
  perform 1 from pg_proc where proname = 'create_payment_records_for_period';
  if found then execute 'drop function if exists public.create_payment_records_for_period(text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'get_student_financial_summary';
  if found then execute 'drop function if exists public.get_student_financial_summary(text, text, text) cascade'; end if;
  perform 1 from pg_proc where proname = 'get_bulk_student_summaries';
  if found then execute 'drop function if exists public.get_bulk_student_summaries(text[], text, text) cascade'; end if;
end $$;

-- 2) Drop tables that depend on ledgers
drop table if exists public.receipts cascade;
drop table if exists public.payment_ledgers cascade;

-- 3) Structured payments (optional path)
drop table if exists public.payment_transactions cascade;
drop table if exists public.payment_records cascade;

-- 4) Installments (optional)
drop table if exists public.installment_plans cascade;

-- 5) Legacy payments table and enum (if present)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'payments') then
    execute 'drop table if exists public.payments cascade';
  end if;
  if exists (select 1 from pg_type where typname = 'payment_status') then
    execute 'drop type if exists public.payment_status cascade';
  end if;
end $$;

-- 6) Enums from ledger system (drop at the end)
do $$ begin
  if exists (select 1 from pg_type where typname = 'payment_method') then
    execute 'drop type if exists public.payment_method cascade';
  end if;
  if exists (select 1 from pg_type where typname = 'ledger_entry_type') then
    execute 'drop type if exists public.ledger_entry_type cascade';
  end if;
end $$;

-- Note: Do NOT drop core tables: academic_sessions, academic_terms, school_students, fee_structures
-- Next steps after running this reset:
-- 1) Re-run 02_payments_ledger.sql
-- 2) Re-run 04_payment_system.sql (if using structured payments layer)
-- 3) Verify fee_structures are correct for the target term/session
-- 4) Seed bills: select open_term_seed_bills('First', '2024/2025');
--    or POST /api/payments/auto-create if you use the API route

