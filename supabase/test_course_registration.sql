-- ================= TEST COURSE REGISTRATION SYSTEM =================
-- Run this to verify that the course registration system is working correctly

-- Test 1: Check if student_course_registrations table exists and has the right structure
select 'Test 1: Student Course Registrations Table Structure' as test_name;
select 
  column_name, 
  data_type, 
  is_nullable,
  column_default
from information_schema.columns 
where table_name = 'student_course_registrations' 
order by ordinal_position;

-- Test 2: Check if there are any existing registrations
select 'Test 2: Existing Registrations' as test_name;
select 
  id,
  student_id,
  course_id,
  class_level,
  stream,
  term,
  session,
  status,
  registered_at
from public.student_course_registrations 
order by registered_at desc;

-- Test 3: Check if courses table has session_id and term_id columns
select 'Test 3: Courses Table with Session/Term Columns' as test_name;
select 
  id,
  name,
  code,
  class_level,
  term,
  session_id,
  term_id,
  created_at
from public.courses 
order by created_at desc 
limit 5;

-- Test 4: Test the RLS policies
select 'Test 4: RLS Policies' as test_name;
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'student_course_registrations'
order by policyname;

-- Test 5: Check academic context for course registration
select 'Test 5: Academic Context for Registration' as test_name;
select 
  c.id,
  s.name as session_name,
  t.name as term_name,
  c.updated_at
from public.current_academic_context c
join public.academic_sessions s on c.session_id = s.id
join public.academic_terms t on c.term_id = t.id;

-- Test 6: Check available courses for JSS1 students
select 'Test 6: Available Courses for JSS1' as test_name;
select 
  c.id,
  c.name,
  c.code,
  c.class_level,
  c.term,
  s.name as session_name,
  t.name as term_name
from public.courses c
left join public.academic_sessions s on c.session_id = s.id
left join public.academic_terms t on c.term_id = t.id
where c.class_level = 'JSS1'
order by c.name;

-- Test 7: Check if there are any students to register
select 'Test 7: Available Students' as test_name;
select 
  id,
  name,
  class_level,
  stream,
  created_at
from public.school_students 
order by created_at desc 
limit 5;

-- Summary
select 'SUMMARY: Course registration system is ready for testing' as message;
select 'Next steps:' as next_steps;
select '1. Create a test student registration via the API' as step1;
select '2. Test approval/rejection workflow' as step2;
select '3. Verify the registration appears in the dashboard' as step3;










