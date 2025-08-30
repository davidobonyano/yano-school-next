-- ================= THREE-TERM FEE STRUCTURES (SAME FEES FOR ALL TERMS) =================
-- This file creates fee structures where all three terms have identical fees

-- First, let's clear existing fee structures to avoid duplicates
DELETE FROM public.fee_structures WHERE session_id IN (
  SELECT id FROM public.academic_sessions WHERE name = '2025/2026'
);

-- Now create unified fee structures for all classes (same fees for all three terms)

-- KG1 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG1' as class_level,
  'tuition' as fee_type,
  35000.00 as amount,
  true as is_required,
  'Tuition fee for KG1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG1' as class_level,
  'development' as fee_type,
  3000.00 as amount,
  true as is_required,
  'Development levy for KG1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- KG2 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG2' as class_level,
  'tuition' as fee_type,
  40000.00 as amount,
  true as is_required,
  'Tuition fee for KG2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG2' as class_level,
  'development' as fee_type,
  3500.00 as amount,
  true as is_required,
  'Development levy for KG2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- KG3 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG3' as class_level,
  'tuition' as fee_type,
  45000.00 as amount,
  true as is_required,
  'Tuition fee for KG3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'KG3' as class_level,
  'development' as fee_type,
  4000.00 as amount,
  true as is_required,
  'Development levy for KG3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- JSS1 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'tuition' as fee_type,
  50000.00 as amount,
  true as is_required,
  'Tuition fee for JSS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'library' as fee_type,
  5000.00 as amount,
  true as is_required,
  'Library fee for JSS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS1' as class_level,
  'laboratory' as fee_type,
  3000.00 as amount,
  true as is_required,
  'Laboratory fee for JSS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- JSS2 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS2' as class_level,
  'tuition' as fee_type,
  55000.00 as amount,
  true as is_required,
  'Tuition fee for JSS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS2' as class_level,
  'library' as fee_type,
  5500.00 as amount,
  true as is_required,
  'Library fee for JSS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS2' as class_level,
  'laboratory' as fee_type,
  3500.00 as amount,
  true as is_required,
  'Laboratory fee for JSS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- JSS3 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS3' as class_level,
  'tuition' as fee_type,
  60000.00 as amount,
  true as is_required,
  'Tuition fee for JSS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS3' as class_level,
  'library' as fee_type,
  6000.00 as amount,
  true as is_required,
  'Library fee for JSS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'JSS3' as class_level,
  'laboratory' as fee_type,
  4000.00 as amount,
  true as is_required,
  'Laboratory fee for JSS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- SS1 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'tuition' as fee_type,
  70000.00 as amount,
  true as is_required,
  'Tuition fee for SS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'library' as fee_type,
  7000.00 as amount,
  true as is_required,
  'Library fee for SS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'laboratory' as fee_type,
  5000.00 as amount,
  true as is_required,
  'Laboratory fee for SS1 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- SS1 Science Stream (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, stream, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'science' as stream,
  'tuition' as fee_type,
  75000.00 as amount,
  true as is_required,
  'Tuition fee for SS1 Science students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, stream, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'science' as stream,
  'laboratory' as fee_type,
  8000.00 as amount,
  true as is_required,
  'Laboratory fee for SS1 Science students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- SS1 Commercial Stream (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, stream, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS1' as class_level,
  'commercial' as stream,
  'tuition' as fee_type,
  72000.00 as amount,
  true as is_required,
  'Tuition fee for SS1 Commercial students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- SS2 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS2' as class_level,
  'tuition' as fee_type,
  80000.00 as amount,
  true as is_required,
  'Tuition fee for SS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS2' as class_level,
  'library' as fee_type,
  8000.00 as amount,
  true as is_required,
  'Library fee for SS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS2' as class_level,
  'laboratory' as fee_type,
  6000.00 as amount,
  true as is_required,
  'Laboratory fee for SS2 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- SS3 Fee Structure (Same for all three terms)
INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS3' as class_level,
  'tuition' as fee_type,
  90000.00 as amount,
  true as is_required,
  'Tuition fee for SS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS3' as class_level,
  'library' as fee_type,
  9000.00 as amount,
  true as is_required,
  'Library fee for SS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

INSERT INTO public.fee_structures (session_id, term_id, class_level, fee_type, amount, is_required, description)
SELECT 
  s.id as session_id,
  t.id as term_id,
  'SS3' as class_level,
  'laboratory' as fee_type,
  7000.00 as amount,
  true as is_required,
  'Laboratory fee for SS3 students'
FROM public.academic_sessions s
CROSS JOIN public.academic_terms t
WHERE s.name = '2025/2026' AND t.name IN ('1st Term', '2nd Term', '3rd Term')
ON CONFLICT (session_id, term_id, class_level, stream, fee_type) DO NOTHING;

-- Now create payment records for all existing students based on their class level
-- This will populate the payment_records table with the expected fees for all three terms

-- First, let's clear existing payment records for 2025/2026 to avoid duplicates
DELETE FROM public.payment_records 
WHERE session_id IN (
  SELECT id FROM public.academic_sessions WHERE name = '2025/2026'
);

-- Now insert fresh payment records
INSERT INTO public.payment_records (student_id, session_id, term_id, fee_type, expected_amount, paid_amount, balance, status, due_date)
SELECT 
  ss.id as student_id,
  s.id as session_id,
  t.id as term_id,
  fs.fee_type,
  fs.amount as expected_amount,
  0 as paid_amount,
  fs.amount as balance,
  'unpaid' as status,
  CASE 
    WHEN t.name = '1st Term' THEN '2025-12-20'::date
    WHEN t.name = '2nd Term' THEN '2026-04-20'::date
    WHEN t.name = '3rd Term' THEN '2026-07-20'::date
  END as due_date
FROM public.school_students ss
CROSS JOIN public.academic_sessions s
CROSS JOIN public.academic_terms t
JOIN public.fee_structures fs ON 
  fs.session_id = s.id 
  AND fs.term_id = t.id 
  AND fs.class_level::text = ss.class_level::text
  AND (fs.stream IS NULL OR fs.stream = ss.stream)
WHERE s.name = '2025/2026' 
  AND t.name IN ('1st Term', '2nd Term', '3rd Term');

-- Summary query to show what we've created
SELECT 
  'Fee Structures Created' as summary,
  COUNT(*) as count
FROM public.fee_structures 
WHERE session_id IN (SELECT id FROM public.academic_sessions WHERE name = '2025/2026');

SELECT 
  'Payment Records Created' as summary,
  COUNT(*) as count
FROM public.payment_records 
WHERE session_id IN (SELECT id FROM public.academic_sessions WHERE name = '2025/2026');

-- Show fee structure summary by class and term (should be identical for all three terms)
SELECT 
  class_level,
  stream,
  fee_type,
  t.name as term,
  amount,
  description
FROM public.fee_structures fs
JOIN public.academic_sessions s ON fs.session_id = s.id
JOIN public.academic_terms t ON fs.term_id = t.id
WHERE s.name = '2025/2026'
ORDER BY 
  CASE class_level 
    WHEN 'KG1' THEN 1 
    WHEN 'KG2' THEN 2 
    WHEN 'KG3' THEN 3 
    WHEN 'JSS1' THEN 4 
    WHEN 'JSS2' THEN 5 
    WHEN 'JSS3' THEN 6 
    WHEN 'SS1' THEN 7 
    WHEN 'SS2' THEN 8 
    WHEN 'SS3' THEN 9 
  END,
  stream NULLS FIRST,
  t.name,
  fee_type;
