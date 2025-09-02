-- ================= TEST SESSION/TERM SETUP =================
-- Run this to verify that session/term management is working correctly

-- Test 1: Check if academic_sessions table exists and has data
select 'Test 1: Academic Sessions' as test_name;
select 
  id, 
  name, 
  start_date, 
  end_date, 
  is_active,
  created_at
from public.academic_sessions 
order by start_date desc;

-- Test 2: Check if academic_terms table exists and has data
select 'Test 2: Academic Terms' as test_name;
select 
  t.id, 
  t.name, 
  t.start_date, 
  t.end_date, 
  t.is_active,
  s.name as session_name
from public.academic_terms t
join public.academic_sessions s on t.session_id = s.id
order by s.start_date desc, t.start_date;

-- Test 3: Check if current_academic_context is set
select 'Test 3: Current Academic Context' as test_name;
select 
  c.id,
  s.name as session_name,
  t.name as term_name,
  c.updated_at
from public.current_academic_context c
join public.academic_sessions s on c.session_id = s.id
join public.academic_terms t on c.term_id = t.id;

-- Test 4: Test the helper functions
select 'Test 4: Helper Functions' as test_name;

-- Test get_current_academic_context function
select 'Testing get_current_academic_context function:' as function_test;
select * from public.get_current_academic_context();

-- Test get_all_academic_sessions function
select 'Testing get_all_academic_sessions function:' as function_test;
select * from public.get_all_academic_sessions();

-- Test get_terms_for_session function (get first session ID)
select 'Testing get_terms_for_session function:' as function_test;
select * from public.get_terms_for_session(
  (select id from public.academic_sessions limit 1)
);

-- Test 5: Check if courses table has session_id and term_id columns
select 'Test 5: Courses Table Structure' as test_name;
select 
  column_name, 
  data_type, 
  is_nullable
from information_schema.columns 
where table_name = 'courses' 
  and column_name in ('session_id', 'term_id')
order by column_name;

-- Test 6: Check if student_course_registrations table has session_id and term_id columns
select 'Test 6: Student Course Registrations Table Structure' as test_name;
select 
  column_name, 
  data_type, 
  is_nullable
from information_schema.columns 
where table_name = 'student_course_registrations' 
  and column_name in ('session_id', 'term_id')
order by column_name;

-- Summary
select 'SUMMARY: If all tests pass, you can proceed with the payment system' as message;











