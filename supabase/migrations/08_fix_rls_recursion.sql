-- Fix infinite recursion in RLS policies
-- The issue: policies were querying profiles table to check profiles table access

-- ============================================
-- Step 1: Drop ALL existing policies on each table
-- Using DO block to drop policies dynamically
-- ============================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies on organizations table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organizations';
    END LOOP;
    
    -- Drop all policies on products table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON products';
    END LOOP;
    
    -- Drop all policies on count_records table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'count_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON count_records';
    END LOOP;
END $$;

-- ============================================
-- Step 2: Create helper function to get user's organization
-- This uses SECURITY DEFINER to bypass RLS, avoiding recursion
-- ============================================

CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- Step 3: Recreate policies using the helper function
-- ============================================

-- PROFILES TABLE
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    organization_id IS NOT NULL 
    AND organization_id = public.user_organization_id()
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ORGANIZATIONS TABLE
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = public.user_organization_id());

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = public.user_organization_id()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );


-- PRODUCTS TABLE
CREATE POLICY "Users can view their organization's products"
  ON products FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their organization's products"
  ON products FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- COUNT RECORDS TABLE
CREATE POLICY "Users can view their organization's counts"
  ON count_records FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert counts in their organization"
  ON count_records FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Admins can delete counts"
  ON count_records FOR DELETE
  USING (
    organization_id = public.user_organization_id()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
