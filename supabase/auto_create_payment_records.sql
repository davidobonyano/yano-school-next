-- Function to automatically create payment records for new students
-- Run this in Supabase SQL Editor

-- Function to create payment records for a specific student
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_payment_records_for_student(uuid) TO anon, authenticated;

-- Create a trigger to automatically create payment records when a new student is added
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

-- Create the trigger
DROP TRIGGER IF EXISTS trg_create_payment_records ON public.school_students;
CREATE TRIGGER trg_create_payment_records
  AFTER INSERT ON public.school_students
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_payment_records();





