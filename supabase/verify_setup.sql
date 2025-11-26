-- Verification Script: Run this to check if everything is set up correctly
-- This will show you the current state of your database

-- ============================================
-- 1. Check if all tables exist
-- ============================================
SELECT 'TABLES' as check_type, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'profiles', 'products', 'count_records')
ORDER BY tablename;

-- ============================================
-- 2. Check if RLS is enabled on all tables
-- ============================================
SELECT 'RLS ENABLED' as check_type, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'profiles', 'products', 'count_records')
ORDER BY tablename;

-- ============================================
-- 3. Check all policies (grouped by table)
-- ============================================
SELECT 'POLICIES' as check_type, tablename, policyname, cmd as operation
FROM pg_policies
WHERE tablename IN ('organizations', 'profiles', 'products', 'count_records')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 4. Check if helper function exists
-- ============================================
SELECT 'FUNCTIONS' as check_type, 
       routine_name, 
       routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'user_organization_id';

-- ============================================
-- 5. Check if trigger exists for auto-creating profiles
-- ============================================
SELECT 'TRIGGERS' as check_type,
       trigger_name,
       event_object_table,
       action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- 6. List all users (to verify profile creation)
-- ============================================
SELECT 'USERS' as check_type,
       u.id,
       u.email,
       u.created_at,
       CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
       p.organization_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
