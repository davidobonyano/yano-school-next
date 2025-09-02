-- Test script to check database state
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if fee_structures table has data
SELECT 'Fee Structures Count:' as check_type, COUNT(*) as count FROM public.fee_structures;

-- 2. Check if academic_sessions table has data
SELECT 'Academic Sessions:' as check_type, id, name, is_active FROM public.academic_sessions;

-- 3. Check if academic_terms table has data
SELECT 'Academic Terms:' as check_type, t.id, t.name, s.name as session_name, t.is_active 
FROM public.academic_terms t 
JOIN public.academic_sessions s ON t.session_id = s.id;

-- 4. Check current academic context
SELECT 'Current Context:' as check_type, 
       s.name as session_name, 
       t.name as term_name,
       c.updated_at
FROM public.current_academic_context c
JOIN public.academic_sessions s ON c.session_id = s.id
JOIN public.academic_terms t ON c.term_id = t.id;

-- 5. Check if payment_records table exists and has data
SELECT 'Payment Records Count:' as check_type, COUNT(*) as count FROM public.payment_records;

-- 6. Check if the record_student_payment function exists
SELECT 'Payment Function:' as check_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'record_student_payment' 
         AND routine_schema = 'public'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 7. Sample fee structures with session/term info
SELECT 'Sample Fee Structures:' as check_type, 
       fs.id, 
       fs.class_level, 
       fs.stream, 
       fs.fee_type, 
       fs.amount,
       s.name as session_name,
       t.name as term_name
FROM public.fee_structures fs
LEFT JOIN public.academic_sessions s ON fs.session_id = s.id
LEFT JOIN public.academic_terms t ON fs.term_id = t.id
LIMIT 10;

-- 8. Check for any orphaned fee structures (no matching session/term)
SELECT 'Orphaned Fee Structures:' as check_type, COUNT(*) as count
FROM public.fee_structures fs
LEFT JOIN public.academic_sessions s ON fs.session_id = s.id
LEFT JOIN public.academic_terms t ON fs.term_id = t.id
WHERE s.id IS NULL OR t.id IS NULL;





