-- Force fix for Organization INSERT policy
-- This script will explicitly drop and recreate the policy to ensure it exists and is correct.

-- 1. Drop the policy if it exists (to avoid "already exists" errors)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- 2. Re-create the policy allowing any authenticated user to insert
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Verify it exists immediately
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'organizations' 
  AND policyname = 'Authenticated users can create organizations';
