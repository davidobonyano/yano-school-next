-- Function to automatically create payment records for all students when session/term changes
CREATE OR REPLACE FUNCTION public.create_payment_records_for_period(
  p_session_id uuid,
  p_term_id uuid
)
RETURNS TABLE(
  records_created integer,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_records_created integer := 0;
  v_student record;
  v_fee record;
  v_existing_count integer;
BEGIN
  -- Loop through all active students
  FOR v_student IN 
    SELECT id, class_level, stream 
    FROM public.school_students 
    WHERE is_active = true
  LOOP
    -- Loop through fee structures for this student's class
    FOR v_fee IN 
      SELECT * FROM public.fee_structures 
      WHERE session_id = p_session_id 
        AND term_id = p_term_id
        AND class_level = v_student.class_level
        AND (stream IS NULL OR stream = v_student.stream)
    LOOP
      -- Check if payment record already exists
      SELECT COUNT(*) INTO v_existing_count
      FROM public.payment_records
      WHERE student_id = v_student.id
        AND session_id = p_session_id
        AND term_id = p_term_id
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
          v_student.id,
          p_session_id,
          p_term_id,
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
  END LOOP;
  
  RETURN QUERY SELECT v_records_created, format('Created %s payment records', v_records_created);
END;
$$;

-- Function to calculate payment statistics for a session/term
CREATE OR REPLACE FUNCTION public.get_payment_statistics(
  p_session_id uuid,
  p_term_id uuid
)
RETURNS TABLE(
  total_students integer,
  total_expected numeric,
  total_collected numeric,
  pending_count integer,
  outstanding_count integer,
  paid_count integer,
  pending_amount numeric,
  outstanding_amount numeric,
  collection_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_summaries AS (
    SELECT 
      pr.student_id,
      SUM(pr.expected_amount) as student_expected,
      SUM(pr.paid_amount) as student_paid,
      CASE 
        WHEN SUM(pr.paid_amount) = 0 THEN 'pending'
        WHEN SUM(pr.paid_amount) >= SUM(pr.expected_amount) THEN 'paid'
        ELSE 'outstanding'
      END as student_status
    FROM public.payment_records pr
    WHERE pr.session_id = p_session_id 
      AND pr.term_id = p_term_id
    GROUP BY pr.student_id
  )
  SELECT 
    COUNT(*)::integer as total_students,
    SUM(student_expected) as total_expected,
    SUM(student_paid) as total_collected,
    COUNT(CASE WHEN student_status = 'pending' THEN 1 END)::integer as pending_count,
    COUNT(CASE WHEN student_status = 'outstanding' THEN 1 END)::integer as outstanding_count,
    COUNT(CASE WHEN student_status = 'paid' THEN 1 END)::integer as paid_count,
    SUM(CASE WHEN student_status = 'pending' THEN student_expected ELSE 0 END) as pending_amount,
    SUM(CASE WHEN student_status = 'outstanding' THEN (student_expected - student_paid) ELSE 0 END) as outstanding_amount,
    CASE 
      WHEN SUM(student_expected) > 0 THEN (SUM(student_paid) / SUM(student_expected)) * 100
      ELSE 0
    END as collection_rate
  FROM student_summaries;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_payment_records_for_period(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_statistics(uuid, uuid) TO anon, authenticated;
