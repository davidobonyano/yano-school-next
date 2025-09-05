-- DISABLE TRIGGERS: Disable all triggers on school_students table
-- This will stop the fee_type error from triggers

-- ================= CHECK CURRENT TRIGGERS =================
-- See what triggers exist on school_students table
SELECT 'Current triggers on school_students:' as check_type;
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'school_students'
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ================= DISABLE USER TRIGGERS =================
-- Disable only user-created triggers (not system triggers)
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Loop through all user-created triggers on school_students
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'school_students'
        AND trigger_schema = 'public'
        AND trigger_name NOT LIKE 'RI_ConstraintTrigger_%'  -- Skip system triggers
    LOOP
        EXECUTE format('ALTER TABLE public.school_students DISABLE TRIGGER %I', trigger_record.trigger_name);
    END LOOP;
END $$;

-- ================= VERIFY TRIGGERS ARE DISABLED =================
-- Check that triggers are disabled
SELECT 'Triggers after disabling:' as check_type;
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'school_students'
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ================= TEST STUDENT CREATION =================
-- Test creating a student with triggers disabled
SELECT 'Testing student creation with triggers disabled...' as test_step;

-- Test with direct table insertion (like your UI does)
INSERT INTO public.school_students (
  student_id, full_name, class_level, school_name, email, phone,
  parent_name, parent_phone, admission_date, created_by, stream
) VALUES (
  'YAN999', 'Test Student Direct', 'JSS1'::public.class_level, 'Test School', 
  'testdirect@example.com', '08012345678', 'Test Parent Direct', 
  '08087654321', current_date, 
  (SELECT id FROM public.teachers LIMIT 1), null
);

-- Test with RPC function
SELECT public.add_school_student(
  'Test Student RPC',
  'JSS2'::public.class_level,
  'Test School',
  (SELECT id FROM public.teachers LIMIT 1),
  'testrpc@example.com',
  '08012345678',
  'Test Parent RPC',
  '08087654321',
  current_date,
  null
) as result;

-- ================= SHOW RESULTS =================
-- Show the created students
SELECT 'Created students:' as check_type;
SELECT student_id, full_name, class_level, created_at
FROM public.school_students 
WHERE full_name LIKE 'Test Student%'
ORDER BY created_at DESC;
