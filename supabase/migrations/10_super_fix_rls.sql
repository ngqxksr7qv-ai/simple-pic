-- SUPER FIX: Reset and Fix All RLS Policies & Functions
-- This script fixes:
-- 1. Infinite recursion (by ensuring helper function is correct)
-- 2. Missing INSERT policies (for organizations)
-- 3. Permission errors (by using public schema)

-- ============================================
-- Step 1: Disable RLS temporarily to break loops
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE count_records DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Drop existing function & policies
-- ============================================
-- Use CASCADE to automatically drop all dependent policies
DROP FUNCTION IF EXISTS public.user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS auth.user_organization_id() CASCADE; -- Cleanup old one if exists

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies on organizations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organizations';
    END LOOP;
    
    -- Drop all policies on products
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON products';
    END LOOP;
    
    -- Drop all policies on count_records
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'count_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON count_records';
    END LOOP;
END $$;

-- ============================================
-- Step 3: Recreate Helper Function (CRITICAL)
-- Must be SECURITY DEFINER to bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- Step 4: Recreate All Policies
-- ============================================

-- PROFILES
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ORGANIZATIONS
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT USING (id = public.user_organization_id());

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = public.user_organization_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- PRODUCTS
CREATE POLICY "Users can view their organization's products"
  ON products FOR SELECT USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their organization's products"
  ON products FOR UPDATE USING (organization_id = public.user_organization_id());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- COUNT RECORDS
CREATE POLICY "Users can view their organization's counts"
  ON count_records FOR SELECT USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert counts in their organization"
  ON count_records FOR INSERT WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Admins can delete counts"
  ON count_records FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Step 5: Re-enable RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE count_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 6: Verify
-- ============================================
SELECT 'SUCCESS' as status, count(*) as policy_count FROM pg_policies 
WHERE tablename IN ('profiles', 'organizations', 'products', 'count_records');
