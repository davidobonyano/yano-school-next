-- Fix for missing record_student_payment function
-- Run this in Supabase SQL Editor

-- Create the missing payment function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.record_student_payment(text, text, text, numeric, text, uuid, text) TO anon, authenticated;


