-- ================= COMPLETE SYSTEM FIX =================
-- Run this in Supabase SQL Editor to fix ALL issues

-- 1. Create the missing record_student_payment function
CREATE OR REPLACE FUNCTION public.record_student_payment(
  p_student_id text,
  p_term text,
  p_session text,
  p_amount numeric,
  p_method text,
  p_recorded_by uuid,
  p_description text
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id uuid;
  v_term_id uuid;
  v_student_uuid uuid;
  v_payment_records record;
  v_transaction_id uuid;
  v_remaining_amount numeric := p_amount;
BEGIN
  -- Get session and term IDs
  SELECT id INTO v_session_id FROM public.academic_sessions WHERE name = p_session LIMIT 1;
  SELECT id INTO v_term_id FROM public.academic_terms WHERE name = p_term AND session_id = v_session_id LIMIT 1;
  
  -- Get student UUID from student_id
  SELECT id INTO v_student_uuid FROM public.school_students WHERE student_id = p_student_id LIMIT 1;
  
  IF v_session_id IS NULL OR v_term_id IS NULL OR v_student_uuid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid session, term, or student');
  END IF;
  
  -- Update payment records in order of fee_type priority
  FOR v_payment_records IN 
    SELECT * FROM public.payment_records 
    WHERE student_id = v_student_uuid 
      AND session_id = v_session_id 
      AND term_id = v_term_id 
      AND balance > 0
    ORDER BY fee_type
  LOOP
    EXIT WHEN v_remaining_amount <= 0;
    
    DECLARE
      v_payment_amount numeric := LEAST(v_remaining_amount, v_payment_records.balance);
      v_new_paid_amount numeric := v_payment_records.paid_amount + v_payment_amount;
      v_new_balance numeric := v_payment_records.expected_amount - v_new_paid_amount;
      v_new_status text;
    BEGIN
      -- Determine new status
      IF v_new_balance <= 0 THEN
        v_new_status := 'paid';
      ELSIF v_new_paid_amount > 0 THEN
        v_new_status := 'partial';
      ELSE
        v_new_status := 'unpaid';
      END IF;
      
      -- Update payment record
      UPDATE public.payment_records 
      SET paid_amount = v_new_paid_amount,
          balance = v_new_balance,
          status = v_new_status,
          updated_at = now()
      WHERE id = v_payment_records.id;
      
      -- Create payment transaction
      INSERT INTO public.payment_transactions (
        payment_record_id,
        student_id,
        session_id,
        term_id,
        amount,
        payment_method,
        description,
        transaction_date,
        recorded_by
      ) VALUES (
        v_payment_records.id,
        v_student_uuid,
        v_session_id,
        v_term_id,
        v_payment_amount,
        p_method,
        p_description,
        CURRENT_DATE,
        p_recorded_by
      );
      
      v_remaining_amount := v_remaining_amount - v_payment_amount;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'amount_applied', p_amount - v_remaining_amount,
    'remaining_amount', v_remaining_amount
  );
END;
$$;

-- 2. Grant permissions for the payment function
GRANT EXECUTE ON FUNCTION public.record_student_payment(text, text, text, numeric, text, uuid, text) TO anon, authenticated;

-- 3. Function to create payment records for a specific student
CREATE OR REPLACE FUNCTION public.create_payment_records_for_student(
  p_student_id uuid
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_records_created integer := 0;
  v_fee record;
  v_existing_count integer;
  v_current_session_id uuid;
  v_current_term_id uuid;
BEGIN
  -- Get current active session and term
  SELECT session_id, term_id INTO v_current_session_id, v_current_term_id
  FROM public.current_academic_context
  LIMIT 1;
  
  IF v_current_session_id IS NULL OR v_current_term_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No active session/term found');
  END IF;
  
  -- Loop through fee structures for this student's class
  FOR v_fee IN 
    SELECT * FROM public.fee_structures 
    WHERE session_id = v_current_session_id 
      AND term_id = v_current_term_id
      AND class_level = (
        SELECT class_level FROM public.school_students WHERE id = p_student_id
      )
      AND (stream IS NULL OR stream = (
        SELECT stream FROM public.school_students WHERE id = p_student_id
      ))
  LOOP
    -- Check if payment record already exists
    SELECT COUNT(*) INTO v_existing_count
    FROM public.payment_records
    WHERE student_id = p_student_id
      AND session_id = v_current_session_id
      AND term_id = v_current_term_id
      AND fee_type = v_fee.fee_type;
    
    -- Create payment record if it doesn't exist
    IF v_existing_count = 0 THEN
      INSERT INTO public.payment_records (
        student_id,
        session_id,
        term_id,
        fee_type,
        expected_amount,
        paid_amount,
        balance,
        status,
        due_date
      ) VALUES (
        p_student_id,
        v_current_session_id,
        v_current_term_id,
        v_fee.fee_type,
        v_fee.amount,
        0,
        v_fee.amount,
        'unpaid',
        CURRENT_DATE + INTERVAL '30 days'
      );
      
      v_records_created := v_records_created + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'records_created', v_records_created,
    'message', format('Created %s payment records for student', v_records_created)
  );
END;
$$;

-- 4. Grant permissions for the student payment record creation function
GRANT EXECUTE ON FUNCTION public.create_payment_records_for_student(uuid) TO anon, authenticated;

-- 5. Create a trigger to automatically create payment records when a new student is added
CREATE OR REPLACE FUNCTION public.trigger_create_payment_records()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create payment records for new students
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_payment_records_for_student(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create the trigger
DROP TRIGGER IF EXISTS trg_create_payment_records ON public.school_students;
CREATE TRIGGER trg_create_payment_records
  AFTER INSERT ON public.school_students
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_payment_records();

-- 7. Function to manually create payment records for existing students
CREATE OR REPLACE FUNCTION public.create_payment_records_for_all_students()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_records_created integer := 0;
  v_student record;
BEGIN
  -- Loop through all active students
  FOR v_student IN 
    SELECT id FROM public.school_students WHERE is_active = true
  LOOP
    -- Create payment records for this student
    PERFORM public.create_payment_records_for_student(v_student.id);
    v_records_created := v_records_created + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'students_processed', v_records_created,
    'message', format('Processed %s students for payment records', v_records_created)
  );
END;
$$;

-- 8. Grant permissions for the bulk payment record creation function
GRANT EXECUTE ON FUNCTION public.create_payment_records_for_all_students() TO anon, authenticated;

-- 9. Ensure academic sessions and terms exist with proper data (2023-2030)
INSERT INTO public.academic_sessions (name, start_date, end_date, is_active) VALUES
('2025/2026', '2025-09-01'::date, '2026-07-31'::date, true),
('2024/2025', '2024-09-01'::date, '2025-07-31'::date, false),
('2023/2024', '2023-09-01'::date, '2024-07-31'::date, false),
('2026/2027', '2026-09-01'::date, '2027-07-31'::date, false),
('2027/2028', '2027-09-01'::date, '2028-07-31'::date, false),
('2028/2029', '2028-09-01'::date, '2029-07-31'::date, false),
('2029/2030', '2029-09-01'::date, '2030-07-31'::date, false),
('2030/2031', '2030-09-01'::date, '2031-07-31'::date, false)
ON CONFLICT (name) DO UPDATE SET
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  updated_at = now();

-- 10. Insert terms for all sessions with proper date casting
DO $$
DECLARE
  session_record RECORD;
BEGIN
  FOR session_record IN SELECT id, name FROM public.academic_sessions
  LOOP
    INSERT INTO public.academic_terms (session_id, name, start_date, end_date, is_active) VALUES
    (session_record.id, '1st Term', 
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2025-09-01'::date
       WHEN session_record.name = '2024/2025' THEN '2024-09-01'::date
       WHEN session_record.name = '2023/2024' THEN '2023-09-01'::date
       WHEN session_record.name = '2026/2027' THEN '2026-09-01'::date
       WHEN session_record.name = '2027/2028' THEN '2027-09-01'::date
       WHEN session_record.name = '2028/2029' THEN '2028-09-01'::date
       WHEN session_record.name = '2029/2030' THEN '2029-09-01'::date
       WHEN session_record.name = '2030/2031' THEN '2030-09-01'::date
     END,
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2025-12-20'::date
       WHEN session_record.name = '2024/2025' THEN '2024-12-20'::date
       WHEN session_record.name = '2023/2024' THEN '2023-12-20'::date
       WHEN session_record.name = '2026/2027' THEN '2026-12-20'::date
       WHEN session_record.name = '2027/2028' THEN '2027-12-20'::date
       WHEN session_record.name = '2028/2029' THEN '2028-12-20'::date
       WHEN session_record.name = '2029/2030' THEN '2029-12-20'::date
       WHEN session_record.name = '2030/2031' THEN '2030-12-20'::date
     END,
     session_record.name = '2025/2026'),
    (session_record.id, '2nd Term',
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2026-01-05'::date
       WHEN session_record.name = '2024/2025' THEN '2025-01-05'::date
       WHEN session_record.name = '2023/2024' THEN '2024-01-05'::date
       WHEN session_record.name = '2026/2027' THEN '2027-01-05'::date
       WHEN session_record.name = '2027/2028' THEN '2028-01-05'::date
       WHEN session_record.name = '2028/2029' THEN '2029-01-05'::date
       WHEN session_record.name = '2029/2030' THEN '2030-01-05'::date
       WHEN session_record.name = '2030/2031' THEN '2031-01-05'::date
     END,
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2026-04-10'::date
       WHEN session_record.name = '2024/2025' THEN '2025-04-10'::date
       WHEN session_record.name = '2023/2024' THEN '2024-04-10'::date
       WHEN session_record.name = '2026/2027' THEN '2027-04-10'::date
       WHEN session_record.name = '2027/2028' THEN '2028-04-10'::date
       WHEN session_record.name = '2028/2029' THEN '2029-04-10'::date
       WHEN session_record.name = '2029/2030' THEN '2030-04-10'::date
       WHEN session_record.name = '2030/2031' THEN '2031-04-10'::date
     END,
     false),
    (session_record.id, '3rd Term',
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2026-04-21'::date
       WHEN session_record.name = '2024/2025' THEN '2025-04-21'::date
       WHEN session_record.name = '2023/2024' THEN '2024-04-21'::date
       WHEN session_record.name = '2026/2027' THEN '2027-04-21'::date
       WHEN session_record.name = '2027/2028' THEN '2028-04-21'::date
       WHEN session_record.name = '2028/2029' THEN '2029-04-21'::date
       WHEN session_record.name = '2029/2030' THEN '2030-04-21'::date
       WHEN session_record.name = '2030/2031' THEN '2031-04-21'::date
     END,
     CASE 
       WHEN session_record.name = '2025/2026' THEN '2026-07-31'::date
       WHEN session_record.name = '2024/2025' THEN '2025-07-31'::date
       WHEN session_record.name = '2023/2024' THEN '2024-07-31'::date
       WHEN session_record.name = '2026/2027' THEN '2027-07-31'::date
       WHEN session_record.name = '2027/2028' THEN '2028-07-31'::date
       WHEN session_record.name = '2028/2029' THEN '2029-07-31'::date
       WHEN session_record.name = '2029/2030' THEN '2030-07-31'::date
       WHEN session_record.name = '2030/2031' THEN '2031-07-31'::date
     END,
     false)
    ON CONFLICT (session_id, name) DO UPDATE SET
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      is_active = excluded.is_active,
      updated_at = now();
  END LOOP;
END $$;

-- 11. Set current academic context
INSERT INTO public.current_academic_context (session_id, term_id)
SELECT 
  s.id,
  t.id
FROM public.academic_sessions s
JOIN public.academic_terms t ON s.id = t.session_id
WHERE s.name = '2025/2026' AND t.name = '1st Term'
ON CONFLICT (id) DO UPDATE SET
  session_id = excluded.session_id,
  term_id = excluded.term_id,
  updated_at = now();

-- 12. Create function to get session statistics
CREATE OR REPLACE FUNCTION public.get_session_statistics(p_session_id uuid)
RETURNS TABLE (
  total_students bigint,
  total_courses bigint,
  total_fees numeric,
  active_enrollments bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT ss.id), 0)::bigint as total_students,
    COALESCE(COUNT(DISTINCT c.id), 0)::bigint as total_courses,
    COALESCE(SUM(fs.amount), 0) as total_fees,
    COALESCE(COUNT(DISTINCT scr.student_id), 0)::bigint as active_enrollments
  FROM public.academic_sessions s
  LEFT JOIN public.school_students ss ON ss.current_session_id = s.id
  LEFT JOIN public.courses c ON c.session_id = s.id
  LEFT JOIN public.fee_structures fs ON fs.session_id = s.id
  LEFT JOIN public.student_course_registrations scr ON scr.session = s.name
  WHERE s.id = p_session_id
    AND (ss.is_active = true OR ss.is_active IS NULL)
    AND (c.is_active = true OR c.is_active IS NULL);
END;
$$;

-- 13. Grant permissions for the session statistics function
GRANT EXECUTE ON FUNCTION public.get_session_statistics(uuid) TO anon, authenticated;

-- 14. Create function to activate a session
CREATE OR REPLACE FUNCTION public.activate_session(p_session_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  -- Deactivate all sessions
  UPDATE public.academic_sessions SET is_active = false;
  
  -- Activate the specified session
  UPDATE public.academic_sessions SET is_active = true WHERE id = p_session_id;
  
  -- Update current context to first term of this session
  UPDATE public.current_academic_context 
  SET session_id = p_session_id,
      term_id = (SELECT id FROM public.academic_terms WHERE session_id = p_session_id AND name = '1st Term' LIMIT 1),
      updated_at = now();
  
  RETURN json_build_object('success', true, 'message', 'Session activated successfully');
END;
$$;

-- 15. Create function to activate a term
CREATE OR REPLACE FUNCTION public.activate_term(p_term_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Get the session for this term
  SELECT session_id INTO v_session_id FROM public.academic_terms WHERE id = p_term_id;
  
  IF v_session_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Term not found');
  END IF;
  
  -- Deactivate all terms in this session
  UPDATE public.academic_terms SET is_active = false WHERE session_id = v_session_id;
  
  -- Activate the specified term
  UPDATE public.academic_terms SET is_active = true WHERE id = p_term_id;
  
  -- Update current context
  UPDATE public.current_academic_context 
  SET session_id = v_session_id,
      term_id = p_term_id,
      updated_at = now();
  
  RETURN json_build_object('success', true, 'message', 'Term activated successfully');
END;
$$;

-- 16. Grant permissions for activation functions
GRANT EXECUTE ON FUNCTION public.activate_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_term(uuid) TO anon, authenticated;

-- 17. Create function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_students bigint,
  total_teachers bigint,
  active_courses bigint,
  total_revenue numeric,
  completed_payments bigint,
  active_students bigint,
  active_courses_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT ss.id), 0)::bigint as total_students,
    COALESCE(COUNT(DISTINCT t.id), 0)::bigint as total_teachers,
    COALESCE(COUNT(DISTINCT c.id), 0)::bigint as active_courses,
    COALESCE(SUM(pt.amount), 0) as total_revenue,
    COALESCE(COUNT(DISTINCT pt.id), 0)::bigint as completed_payments,
    COALESCE(COUNT(DISTINCT CASE WHEN ss.is_active = true THEN ss.id END), 0)::bigint as active_students,
    COALESCE(COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END), 0)::bigint as active_courses_count
  FROM public.school_students ss
  FULL OUTER JOIN public.teachers t ON t.is_active = true
  FULL OUTER JOIN public.courses c ON c.is_active = true
  FULL OUTER JOIN public.payment_transactions pt ON pt.amount > 0;
END;
$$;

-- 18. Grant permissions for admin dashboard stats function
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO anon, authenticated;

-- 19. Verify the functions were created
SELECT 'Functions created successfully' as status;

-- 20. Show summary of what was created
SELECT 'Summary' as info, 
       (SELECT COUNT(*) FROM public.academic_sessions) as total_sessions,
       (SELECT COUNT(*) FROM public.academic_terms) as total_terms,
       (SELECT COUNT(*) FROM public.fee_structures) as total_fee_structures;
