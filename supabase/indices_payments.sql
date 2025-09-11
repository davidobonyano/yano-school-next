-- Lightweight indexes to improve report performance (no constraints)

-- Student charges
create index if not exists idx_student_charges_session_term
  on public.student_charges (session_id, term_id);

create index if not exists idx_student_charges_student_session_term
  on public.student_charges (student_id, session_id, term_id);

-- Payment records
create index if not exists idx_payment_records_session_term
  on public.payment_records (session_id, term_id);

create index if not exists idx_payment_records_student_session_term
  on public.payment_records (student_id, session_id, term_id);


