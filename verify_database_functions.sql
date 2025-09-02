-- ================= VERIFY AND RECREATE DATABASE FUNCTIONS =================
-- Run this in your Supabase SQL editor to ensure all functions exist and work properly

-- 1. Check if functions exist
SELECT 'Checking existing functions...' as status;

SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'activate_academic_session', 
    'activate_academic_term', 
    'get_current_academic_context',
    'get_all_academic_sessions',
    'get_terms_for_session'
  );

-- 2. Recreate the activate_academic_session function
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
END;
$$;

-- 3. Recreate the activate_academic_term function
CREATE OR REPLACE FUNCTION public.activate_academic_term(p_term_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Get the session for this term
  SELECT session_id INTO v_session_id FROM public.academic_terms WHERE id = p_term_id;
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Term not found';
  END IF;
  
  -- Deactivate all terms in this session
  UPDATE public.academic_terms SET is_active = false WHERE session_id = v_session_id;
  
  -- Activate the specified term
  UPDATE public.academic_terms SET is_active = true WHERE id = p_term_id;
  
  -- Update current context
  UPDATE public.current_academic_context 
  SET session_id = v_session_id,
      term_id = p_term_id,
      updated_at = now();
      
  -- If no current context exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.current_academic_context (session_id, term_id)
    VALUES (v_session_id, p_term_id);
  END IF;
END;
$$;

-- 4. Recreate the get_current_academic_context function
CREATE OR REPLACE FUNCTION public.get_current_academic_context()
RETURNS TABLE (
  session_id uuid,
  session_name text,
  term_id uuid,
  term_name text,
  session_start date,
  session_end date,
  term_start date,
  term_end date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.name as session_name,
    t.id as term_id,
    t.name as term_name,
    s.start_date as session_start,
    s.end_date as session_end,
    t.start_date as term_start,
    t.end_date as term_end
  FROM public.current_academic_context c
  JOIN public.academic_sessions s ON c.session_id = s.id
  JOIN public.academic_terms t ON c.term_id = t.id
  WHERE s.is_active = true AND t.is_active = true;
END;
$$;

-- 5. Recreate the get_all_academic_sessions function
CREATE OR REPLACE FUNCTION public.get_all_academic_sessions()
RETURNS TABLE (
  id uuid,
  name text,
  start_date date,
  end_date date,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.start_date, s.end_date, s.is_active
  FROM public.academic_sessions s
  ORDER BY s.start_date DESC;
END;
$$;

-- 6. Recreate the get_terms_for_session function
CREATE OR REPLACE FUNCTION public.get_terms_for_session(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  start_date date,
  end_date date,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.start_date, t.end_date, t.is_active
  FROM public.academic_terms t
  WHERE t.session_id = p_session_id
  ORDER BY t.start_date;
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.activate_academic_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_academic_term(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_academic_context() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_academic_sessions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_terms_for_session(uuid) TO anon, authenticated;

-- 8. Verify functions were created
SELECT 'Functions created successfully' as status;

SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'activate_academic_session', 
    'activate_academic_term', 
    'get_current_academic_context',
    'get_all_academic_sessions',
    'get_terms_for_session'
  );

-- 9. Test the functions
SELECT 'Testing functions...' as status;

-- Test get_current_academic_context
SELECT 'Current context:' as test, * FROM public.get_current_academic_context();

-- Test get_all_academic_sessions
SELECT 'All sessions:' as test, * FROM public.get_all_academic_sessions();

-- Test get_terms_for_session (replace with actual session ID)
SELECT 'Terms for first session:' as test, * FROM public.get_terms_for_session(
  (SELECT id FROM public.academic_sessions LIMIT 1)
);

SELECT 'Database functions verification complete!' as status;



