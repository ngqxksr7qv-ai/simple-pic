-- Fix "Chicken and Egg" RLS issue for Organization Creation
-- Problem: User creates org, but can't see it (SELECT) because profile isn't linked yet.
-- Solution: Add 'created_by' column so creator can ALWAYS see their own orgs.

-- 1. Add created_by column
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Create trigger to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_org_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_organizations_created_by ON organizations;
CREATE TRIGGER set_organizations_created_by
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_org_created_by();

-- 3. Update SELECT policy to allow creator to view
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id = public.user_organization_id() 
    OR 
    created_by = auth.uid() -- <--- This fixes the 403 error!
  );

-- 4. Ensure INSERT policy is still correct
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
