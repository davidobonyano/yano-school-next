-- ================= ADD FUTURE ACADEMIC SESSIONS =================
-- Run this in your Supabase SQL editor to add more sessions for testing

-- Add future academic sessions
INSERT INTO public.academic_sessions (name, start_date, end_date, is_active) VALUES
('2026/2027', '2026-09-01'::date, '2027-07-31'::date, false),
('2027/2028', '2027-09-01'::date, '2028-07-31'::date, false),
('2028/2029', '2028-09-01'::date, '2029-07-31'::date, false),
('2029/2030', '2029-09-01'::date, '2030-07-31'::date, false),
('2030/2031', '2030-09-01'::date, '2031-07-31'::date, false)
ON CONFLICT (name) DO UPDATE SET
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  updated_at = now();

-- Add terms for each future session
DO $$
DECLARE
  session_record RECORD;
BEGIN
  FOR session_record IN SELECT id, name FROM public.academic_sessions WHERE name IN ('2026/2027', '2027/2028', '2028/2029', '2029/2030', '2030/2031')
  LOOP
    INSERT INTO public.academic_terms (session_id, name, start_date, end_date, is_active) VALUES
    (session_record.id, '1st Term', 
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2026-09-01'::date
       WHEN session_record.name = '2027/2028' THEN '2027-09-01'::date
       WHEN session_record.name = '2028/2029' THEN '2028-09-01'::date
       WHEN session_record.name = '2029/2030' THEN '2029-09-01'::date
       WHEN session_record.name = '2030/2031' THEN '2030-09-01'::date
     END,
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2026-12-20'::date
       WHEN session_record.name = '2027/2028' THEN '2027-12-20'::date
       WHEN session_record.name = '2028/2029' THEN '2028-12-20'::date
       WHEN session_record.name = '2029/2030' THEN '2029-12-20'::date
       WHEN session_record.name = '2030/2031' THEN '2030-12-20'::date
     END,
     false),
    (session_record.id, '2nd Term',
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2027-01-05'::date
       WHEN session_record.name = '2027/2028' THEN '2028-01-05'::date
       WHEN session_record.name = '2028/2029' THEN '2029-01-05'::date
       WHEN session_record.name = '2029/2030' THEN '2030-01-05'::date
       WHEN session_record.name = '2030/2031' THEN '2031-01-05'::date
     END,
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2027-04-10'::date
       WHEN session_record.name = '2027/2028' THEN '2028-04-10'::date
       WHEN session_record.name = '2028/2029' THEN '2029-04-10'::date
       WHEN session_record.name = '2029/2030' THEN '2030-04-10'::date
       WHEN session_record.name = '2030/2031' THEN '2031-04-10'::date
     END,
     false),
    (session_record.id, '3rd Term',
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2027-04-21'::date
       WHEN session_record.name = '2027/2028' THEN '2028-04-21'::date
       WHEN session_record.name = '2028/2029' THEN '2029-04-21'::date
       WHEN session_record.name = '2029/2030' THEN '2030-04-21'::date
       WHEN session_record.name = '2030/2031' THEN '2031-04-21'::date
     END,
     CASE 
       WHEN session_record.name = '2026/2027' THEN '2027-07-31'::date
       WHEN session_record.name = '2027/2028' THEN '2028-07-31'::date
       WHEN session_record.name = '2028/2029' THEN '2029-07-31'::date
       WHEN session_record.name = '2029/2030' THEN '2030-07-31'::date
       WHEN session_record.name = '2030/2031' THEN '2031-07-31'::date
     END,
     false)
    ON CONFLICT (session_id, name) DO UPDATE SET
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      is_active = excluded.is_active,
      updated_at = now();
  END LOOP;
END $$;

-- Verify the sessions were added
SELECT 'Sessions after adding future sessions:' as info;
SELECT 
  id, 
  name, 
  start_date, 
  end_date, 
  is_active,
  created_at
FROM public.academic_sessions 
ORDER BY start_date DESC;

-- Verify the terms were added
SELECT 'Terms after adding future sessions:' as info;
SELECT 
  t.id, 
  t.name, 
  t.start_date, 
  t.end_date, 
  t.is_active,
  s.name as session_name
FROM public.academic_terms t
JOIN public.academic_sessions s ON t.session_id = s.id
ORDER BY s.start_date DESC, t.start_date;



