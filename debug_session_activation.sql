-- ================= DEBUG SESSION ACTIVATION =================
-- Run this in your Supabase SQL editor to debug the session activation issue

-- 1. Check if the function exists
SELECT 'Checking if activate_academic_session function exists...' as status;

SELECT 
  routine_name, 
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'activate_academic_session';

-- 2. Check if sessions exist
SELECT 'Checking available sessions...' as status;
SELECT id, name, is_active, start_date, end_date 
FROM public.academic_sessions 
ORDER BY start_date DESC;

-- 3. Check if terms exist
SELECT 'Checking available terms...' as status;
SELECT t.id, t.name, t.is_active, t.session_id, s.name as session_name
FROM public.academic_terms t
JOIN public.academic_sessions s ON t.session_id = s.id
ORDER BY s.start_date DESC, t.start_date;

-- 4. Check current academic context
SELECT 'Checking current academic context...' as status;
SELECT * FROM public.current_academic_context;

-- 5. Test the function manually (replace with actual session ID)
SELECT 'Testing activate_academic_session function...' as status;

-- First, get a session ID to test with
DO $$
DECLARE
    test_session_id uuid;
BEGIN
    -- Get the first available session
    SELECT id INTO test_session_id FROM public.academic_sessions LIMIT 1;
    
    IF test_session_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with session ID: %', test_session_id;
        
        -- Try to call the function
        BEGIN
            PERFORM public.activate_academic_session(test_session_id);
            RAISE NOTICE 'Function call succeeded!';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Function call failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No sessions found to test with!';
    END IF;
END $$;

-- 6. Check if the function was created properly
SELECT 'Checking function permissions...' as status;
SELECT 
    p.proname as function_name,
    p.proacl as permissions
FROM pg_proc p
WHERE p.proname = 'activate_academic_session';

-- 7. If function doesn't exist, create it
CREATE OR REPLACE FUNCTION public.activate_academic_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all sessions
  UPDATE public.academic_sessions SET is_active = false;
  
  -- Activate the specified session
  UPDATE public.academic_sessions SET is_active = true WHERE id = p_session_id;
  
  -- Update current context to first term of this session
  UPDATE public.current_academic_context 
  SET session_id = p_session_id,
      term_id = (SELECT id FROM public.academic_terms WHERE session_id = p_session_id AND name = '1st Term' LIMIT 1),
      updated_at = now();
      
  -- If no current context exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.current_academic_context (session_id, term_id)
    SELECT 
      p_session_id,
      (SELECT id FROM public.academic_terms WHERE session_id = p_session_id AND name = '1st Term' LIMIT 1);
  END IF;
  
  -- Log the operation
  RAISE NOTICE 'Session % activated successfully', p_session_id;
END;
$$;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.activate_academic_session(uuid) TO anon, authenticated;

-- 9. Test the function again
SELECT 'Testing function after recreation...' as status;

DO $$
DECLARE
    test_session_id uuid;
BEGIN
    -- Get the first available session
    SELECT id INTO test_session_id FROM public.academic_sessions LIMIT 1;
    
    IF test_session_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with session ID: %', test_session_id;
        
        -- Try to call the function
        BEGIN
            PERFORM public.activate_academic_session(test_session_id);
            RAISE NOTICE 'Function call succeeded!';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Function call failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No sessions found to test with!';
    END IF;
END $$;

-- 10. Final verification
SELECT 'Final verification...' as status;
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'activate_academic_session';

SELECT 'Debug complete!' as status;
