-- ================= PAYMENT SYSTEM REWRITE =================
-- This file contains the rewritten payment system with proper status definitions
-- and automatic payment record creation

-- =================== HELPER FUNCTIONS ===================

-- Function to normalize term names for consistency
CREATE OR REPLACE FUNCTION normalize_term(term_input text)
RETURNS text AS $$
BEGIN
  CASE 
    WHEN LOWER(term_input) LIKE '%first%' OR LOWER(term_input) LIKE '%1st%' THEN
      RETURN 'First Term';
    WHEN LOWER(term_input) LIKE '%second%' OR LOWER(term_input) LIKE '%2nd%' THEN
      RETURN 'Second Term';
    WHEN LOWER(term_input) LIKE '%third%' OR LOWER(term_input) LIKE '%3rd%' THEN
      RETURN 'Third Term';
    ELSE
      RETURN term_input;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get class level text from student class level
CREATE OR REPLACE FUNCTION get_class_level_text(class_level text)
RETURNS text AS $$
BEGIN
  CASE
    WHEN class_level LIKE 'PRI%' THEN
      RETURN 'Primary ' || SUBSTRING(class_level FROM 4);
    WHEN class_level LIKE 'JSS%' THEN
      RETURN REPLACE(class_level, 'JSS', 'JSS ');
    WHEN class_level LIKE 'SS%' THEN
      RETURN class_level;
    ELSE
      RETURN class_level;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =================== PAYMENT STATUS FUNCTIONS ===================

-- Function to determine payment status based on paid vs expected amounts
CREATE OR REPLACE FUNCTION get_payment_status(paid_amount numeric, expected_amount numeric)
RETURNS text AS $$
BEGIN
  IF paid_amount = 0 THEN
    RETURN 'Pending';
  ELSIF paid_amount >= expected_amount THEN
    RETURN 'Paid';
  ELSE
    RETURN 'Outstanding';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =================== COMPREHENSIVE STUDENT PAYMENT STATUS ===================

-- Function to get all students with their payment status for a term/session
CREATE OR REPLACE FUNCTION get_student_payment_status(p_term text, p_session text)
RETURNS TABLE (
  student_id text,
  full_name text,
  class_level text,
  class_label text,
  expected_amount numeric,
  paid_amount numeric,
  outstanding_amount numeric,
  payment_status text,
  description text
) AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
BEGIN
  RETURN QUERY
  WITH student_fees AS (
    SELECT 
      ss.student_id,
      ss.full_name,
      ss.class_level,
      CASE 
        WHEN ss.stream IS NOT NULL AND ss.stream != '' THEN 
          ss.class_level || ' ' || ss.stream 
        ELSE 
          ss.class_level 
      END as class_label,
      COALESCE(fs.total_fee, 0) as expected_fee
    FROM school_students ss
    LEFT JOIN fee_structures fs ON (
      fs.term = normalized_term 
      AND fs.session = p_session
      AND fs.class_level_text = get_class_level_text(ss.class_level)
    )
    WHERE ss.is_active = true
  ),
  student_payments AS (
    SELECT 
      pl.student_id,
      COALESCE(SUM(CASE WHEN pl.entry_type = 'Payment' THEN pl.amount ELSE 0 END), 0) as total_paid
    FROM payment_ledgers pl
    WHERE pl.term = normalized_term 
      AND pl.session = p_session
    GROUP BY pl.student_id
  )
  SELECT 
    sf.student_id,
    sf.full_name,
    sf.class_level,
    sf.class_label,
    sf.expected_fee as expected_amount,
    COALESCE(sp.total_paid, 0) as paid_amount,
    GREATEST(sf.expected_fee - COALESCE(sp.total_paid, 0), 0) as outstanding_amount,
    get_payment_status(COALESCE(sp.total_paid, 0), sf.expected_fee) as payment_status,
    CASE 
      WHEN sf.expected_fee = 0 THEN 'No fee structure defined'
      WHEN COALESCE(sp.total_paid, 0) = 0 THEN 'No payments made'
      WHEN COALESCE(sp.total_paid, 0) >= sf.expected_fee THEN 'Payment completed'
      ELSE 'Partial payment made'
    END as description
  FROM student_fees sf
  LEFT JOIN student_payments sp ON sf.student_id = sp.student_id
  ORDER BY sf.class_level, sf.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== INDIVIDUAL STUDENT FINANCIAL SUMMARY ===================

-- Function to get detailed financial summary for a specific student
CREATE OR REPLACE FUNCTION get_student_financial_summary(
  p_student_id text, 
  p_term text, 
  p_session text
)
RETURNS TABLE (
  student_id text,
  billed_total numeric,
  paid_total numeric,
  outstanding_total numeric,
  overdue_total numeric,
  payment_status text
) AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
  v_expected numeric := 0;
  v_paid numeric := 0;
  v_outstanding numeric := 0;
BEGIN
  -- Get expected amount from fee structure
  SELECT COALESCE(fs.total_fee, 0) INTO v_expected
  FROM school_students ss
  LEFT JOIN fee_structures fs ON (
    fs.term = normalized_term 
    AND fs.session = p_session
    AND fs.class_level_text = get_class_level_text(ss.class_level)
  )
  WHERE ss.student_id = p_student_id;

  -- Get total payments made
  SELECT COALESCE(SUM(pl.amount), 0) INTO v_paid
  FROM payment_ledgers pl
  WHERE pl.student_id = p_student_id
    AND pl.term = normalized_term
    AND pl.session = p_session
    AND pl.entry_type = 'Payment';

  -- Calculate outstanding
  v_outstanding := GREATEST(v_expected - v_paid, 0);

  RETURN QUERY
  SELECT 
    p_student_id,
    v_expected as billed_total,
    v_paid as paid_total,
    v_outstanding as outstanding_total,
    0::numeric as overdue_total, -- TODO: Implement overdue logic based on due dates
    get_payment_status(v_paid, v_expected) as payment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== BULK STUDENT SUMMARIES ===================

-- Function to get financial summaries for multiple students
CREATE OR REPLACE FUNCTION get_bulk_student_summaries(
  p_student_ids text[], 
  p_term text, 
  p_session text
)
RETURNS TABLE (
  student_id text,
  billed_total numeric,
  paid_total numeric,
  outstanding_total numeric,
  overdue_total numeric,
  payment_status text
) AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
BEGIN
  RETURN QUERY
  WITH student_expectations AS (
    SELECT 
      ss.student_id,
      COALESCE(fs.total_fee, 0) as expected_amount
    FROM school_students ss
    LEFT JOIN fee_structures fs ON (
      fs.term = normalized_term 
      AND fs.session = p_session
      AND fs.class_level_text = get_class_level_text(ss.class_level)
    )
    WHERE ss.student_id = ANY(p_student_ids)
  ),
  student_payments_agg AS (
    SELECT 
      pl.student_id,
      COALESCE(SUM(pl.amount), 0) as total_paid
    FROM payment_ledgers pl
    WHERE pl.student_id = ANY(p_student_ids)
      AND pl.term = normalized_term
      AND pl.session = p_session
      AND pl.entry_type = 'Payment'
    GROUP BY pl.student_id
  )
  SELECT 
    se.student_id,
    se.expected_amount as billed_total,
    COALESCE(spa.total_paid, 0) as paid_total,
    GREATEST(se.expected_amount - COALESCE(spa.total_paid, 0), 0) as outstanding_total,
    0::numeric as overdue_total,
    get_payment_status(COALESCE(spa.total_paid, 0), se.expected_amount) as payment_status
  FROM student_expectations se
  LEFT JOIN student_payments_agg spa ON se.student_id = spa.student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== AUTOMATIC PAYMENT RECORD CREATION ===================

-- Function to create payment records for all students when a new session/term is activated
CREATE OR REPLACE FUNCTION create_payment_records_for_period(p_term text, p_session text)
RETURNS jsonb AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
  records_created integer := 0;
  students_processed integer := 0;
BEGIN
  -- Create bill entries in payment_ledgers for all active students
  INSERT INTO payment_ledgers (student_id, term, session, entry_type, amount, description, balance_after)
  SELECT 
    ss.student_id,
    normalized_term,
    p_session,
    'Bill'::ledger_entry_type,
    COALESCE(fs.total_fee, 0),
    'School fees - ' || normalized_term || ' ' || p_session,
    COALESCE(fs.total_fee, 0) -- Initial balance equals the bill amount
  FROM school_students ss
  LEFT JOIN fee_structures fs ON (
    fs.term = normalized_term 
    AND fs.session = p_session
    AND fs.class_level_text = get_class_level_text(ss.class_level)
  )
  WHERE ss.is_active = true
    AND COALESCE(fs.total_fee, 0) > 0 -- Only create records where there's a fee structure
    AND NOT EXISTS (
      -- Don't create duplicate bills
      SELECT 1 FROM payment_ledgers pl
      WHERE pl.student_id = ss.student_id
        AND pl.term = normalized_term
        AND pl.session = p_session
        AND pl.entry_type = 'Bill'
    );

  GET DIAGNOSTICS records_created = ROW_COUNT;

  -- Count total active students for reference
  SELECT COUNT(*) INTO students_processed
  FROM school_students ss
  WHERE ss.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'records_created', records_created,
    'students_processed', students_processed,
    'term', normalized_term,
    'session', p_session
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== IMPROVED PAYMENT RECORDING ===================

-- Function to record a payment with automatic status updates
CREATE OR REPLACE FUNCTION record_student_payment(
  p_student_id text,
  p_term text,
  p_session text,
  p_amount numeric,
  p_method payment_method,
  p_recorded_by uuid,
  p_description text DEFAULT 'Payment received'
)
RETURNS jsonb AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
  receipt_no text;
  ledger_id uuid;
  new_balance numeric;
BEGIN
  -- Insert payment entry
  INSERT INTO payment_ledgers (student_id, term, session, entry_type, amount, method, description, recorded_by)
  VALUES (p_student_id, normalized_term, p_session, 'Payment', p_amount, p_method, p_description, p_recorded_by)
  RETURNING id INTO ledger_id;

  -- Calculate and update balance for this payment
  SELECT get_student_balance(p_student_id, normalized_term, p_session) INTO new_balance;
  
  UPDATE payment_ledgers 
  SET balance_after = new_balance
  WHERE id = ledger_id;

  -- Generate receipt
  SELECT generate_receipt_no() INTO receipt_no;
  
  INSERT INTO receipts (receipt_no, student_id, payment_ledger_id, amount, method, created_by)
  VALUES (receipt_no, p_student_id, ledger_id, p_amount, p_method, p_recorded_by);

  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', ledger_id,
    'receipt_no', receipt_no,
    'balance_after', new_balance,
    'payment_status', get_payment_status(
      (SELECT COALESCE(SUM(amount), 0) FROM payment_ledgers 
       WHERE student_id = p_student_id AND term = normalized_term AND session = p_session AND entry_type = 'Payment'),
      (SELECT COALESCE(SUM(amount), 0) FROM payment_ledgers 
       WHERE student_id = p_student_id AND term = normalized_term AND session = p_session AND entry_type = 'Bill')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== PAYMENT STATISTICS ===================

-- Function to get comprehensive payment statistics for a term/session
CREATE OR REPLACE FUNCTION get_payment_statistics(p_term text, p_session text)
RETURNS TABLE (
  total_students bigint,
  total_expected numeric,
  total_collected numeric,
  pending_count bigint,
  outstanding_count bigint,
  paid_count bigint,
  pending_amount numeric,
  outstanding_amount numeric,
  collection_rate numeric
) AS $$
DECLARE
  normalized_term text := normalize_term(p_term);
BEGIN
  RETURN QUERY
  WITH payment_stats AS (
    SELECT 
      COUNT(*) as total_students,
      SUM(expected_amount) as total_expected,
      SUM(paid_amount) as total_collected,
      COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN payment_status = 'Outstanding' THEN 1 END) as outstanding_count,
      COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_count,
      SUM(CASE WHEN payment_status = 'Pending' THEN expected_amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN payment_status = 'Outstanding' THEN outstanding_amount ELSE 0 END) as outstanding_amount
    FROM get_student_payment_status(normalized_term, p_session)
  )
  SELECT 
    ps.total_students,
    ps.total_expected,
    ps.total_collected,
    ps.pending_count,
    ps.outstanding_count,
    ps.paid_count,
    ps.pending_amount,
    ps.outstanding_amount,
    CASE 
      WHEN ps.total_expected > 0 THEN (ps.total_collected / ps.total_expected) * 100
      ELSE 0
    END as collection_rate
  FROM payment_stats ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== PERIOD MANAGEMENT INTEGRATION ===================

-- Function to handle period changes and automatically create payment records
CREATE OR REPLACE FUNCTION handle_period_change(p_term text, p_session text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update the global period setting
  PERFORM set_app_period(p_term, p_session);
  
  -- Automatically create payment records for the new period
  SELECT create_payment_records_for_period(p_term, p_session) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================== GRANT PERMISSIONS ===================

GRANT EXECUTE ON FUNCTION normalize_term(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_class_level_text(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_payment_status(numeric, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_student_payment_status(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_student_financial_summary(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bulk_student_summaries(text[], text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_payment_records_for_period(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_student_payment(text, text, text, numeric, payment_method, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_payment_statistics(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_period_change(text, text) TO anon, authenticated;

-- =================== COMMENTS ===================

COMMENT ON FUNCTION get_payment_status(numeric, numeric) IS 
'Determines payment status: Pending (paid=0), Outstanding (0<paid<expected), Paid (paid>=expected)';

COMMENT ON FUNCTION get_student_payment_status(text, text) IS 
'Returns comprehensive payment status for all active students in a specific term/session';

COMMENT ON FUNCTION create_payment_records_for_period(text, text) IS 
'Automatically creates payment records for all active students when a new session/term is activated';

COMMENT ON FUNCTION record_student_payment(text, text, text, numeric, payment_method, uuid, text) IS 
'Records a payment with automatic balance updates and receipt generation';
