-- COMPREHENSIVE FEE_TYPE SEARCH: Find exactly where fee_type is being referenced
-- This will search every possible place where fee_type might be hiding

-- ================= SEARCH ALL FUNCTIONS =================
-- Look for any function that might reference fee_type
SELECT 'Functions containing fee_type:' as search_type;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition ILIKE '%fee_type%'
ORDER BY routine_name;

-- ================= SEARCH ALL TRIGGERS =================
-- Look for triggers that might reference fee_type
SELECT 'Triggers containing fee_type:' as search_type;
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND action_statement ILIKE '%fee_type%'
ORDER BY trigger_name;

-- ================= SEARCH ALL VIEWS =================
-- Look for views that might reference fee_type
SELECT 'Views containing fee_type:' as search_type;
SELECT table_name, view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND view_definition ILIKE '%fee_type%'
ORDER BY table_name;

-- ================= SEARCH ALL MATERIALIZED VIEWS =================
-- Look for materialized views that might reference fee_type
SELECT 'Materialized Views containing fee_type:' as search_type;
SELECT matviewname, definition
FROM pg_matviews 
WHERE schemaname = 'public'
AND definition ILIKE '%fee_type%'
ORDER BY matviewname;

-- ================= SEARCH ALL CONSTRAINTS =================
-- Look for constraints that might reference fee_type
SELECT 'Constraints containing fee_type:' as search_type;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE pg_get_constraintdef(oid) ILIKE '%fee_type%'
ORDER BY conname;

-- ================= SEARCH ALL INDEXES =================
-- Look for indexes that might reference fee_type
SELECT 'Indexes containing fee_type:' as search_type;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexdef ILIKE '%fee_type%'
ORDER BY indexname;

-- ================= SEARCH ALL RULES =================
-- Look for rules that might reference fee_type
SELECT 'Rules containing fee_type:' as search_type;
SELECT rulename, definition
FROM pg_rules 
WHERE schemaname = 'public'
AND definition ILIKE '%fee_type%'
ORDER BY rulename;

-- ================= SEARCH ALL POLICIES =================
-- Look for RLS policies that might reference fee_type
SELECT 'Policies containing fee_type:' as search_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual ILIKE '%fee_type%' OR with_check ILIKE '%fee_type%')
ORDER BY tablename, policyname;

-- ================= CHECK FOR HIDDEN FUNCTIONS =================
-- Look for any function that might be called during student creation
SELECT 'All functions in public schema:' as search_type;
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- ================= CHECK FOR CACHED QUERIES =================
-- Check if there are any cached queries that might reference fee_type
SELECT 'Active queries (if any):' as search_type;
SELECT query, state, query_start
FROM pg_stat_activity 
WHERE query ILIKE '%fee_type%'
AND state = 'active';



