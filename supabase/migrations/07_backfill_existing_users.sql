-- Backfill profiles for existing users who don't have one
-- This fixes users created before the trigger was added

INSERT INTO public.profiles (id, email, role)
SELECT 
  id, 
  email, 
  'owner'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
