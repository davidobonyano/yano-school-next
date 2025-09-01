-- Fix for date casting and missing functions
-- Run this in Supabase SQL Editor

-- 1. Fix the date casting issue by updating existing records
UPDATE public.academic_sessions 
SET start_date = start_date::date, 
    end_date = end_date::date 
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

UPDATE public.academic_terms 
SET start_date = start_date::date, 
    end_date = end_date::date 
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- 2. Create the missing record_student_payment function
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.record_student_payment(text, text, text, numeric, text, uuid, text) TO anon, authenticated;

-- 4. Create function to get admin dashboard statistics (FIXED VERSION - Proper JOIN syntax)
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
  WITH stats AS (
    SELECT 
      (SELECT COUNT(*) FROM public.school_students) as students_count,
      (SELECT COUNT(*) FROM public.teachers WHERE is_active = true) as teachers_count,
      (SELECT COUNT(*) FROM public.courses) as courses_count,
      (SELECT COALESCE(SUM(amount), 0) FROM public.payment_transactions WHERE amount > 0) as revenue_total,
      (SELECT COUNT(*) FROM public.payment_transactions WHERE amount > 0) as payments_count,
      (SELECT COUNT(*) FROM public.school_students WHERE is_active = true) as active_students_count,
      (SELECT COUNT(*) FROM public.courses) as active_courses_count_val
  )
  SELECT 
    students_count::bigint,
    teachers_count::bigint,
    courses_count::bigint,
    revenue_total,
    payments_count::bigint,
    active_students_count::bigint,
    active_courses_count_val::bigint
  FROM stats;
END;
$$;

-- 5. Grant permissions for admin dashboard stats
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO anon, authenticated;

-- 6. Create function to get session statistics
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
    AND (ss.is_active = true OR ss.is_active IS NULL);
END;
$$;

-- 7. Grant permissions for session statistics
GRANT EXECUTE ON FUNCTION public.get_session_statistics(uuid) TO anon, authenticated;

-- 8. Create function to activate a session
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

-- 9. Create function to activate a term
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

-- 10. Grant permissions for activation functions
GRANT EXECUTE ON FUNCTION public.activate_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_term(uuid) TO anon, authenticated;

-- 11. Test the admin dashboard stats function
SELECT 'Testing admin dashboard stats function...' as status;
SELECT * FROM public.get_admin_dashboard_stats();

-- 12. Verify functions were created
SELECT 'Functions created successfully' as status;


