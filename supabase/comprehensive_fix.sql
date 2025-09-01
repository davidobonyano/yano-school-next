-- ================= COMPREHENSIVE FIX FOR PAYMENT SYSTEM =================
-- Run this in Supabase SQL Editor to fix all payment-related issues

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

-- 9. Verify the functions were created
SELECT 'Functions created successfully' as status;



