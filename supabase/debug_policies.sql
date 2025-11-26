-- Run this to see all current policies on the organizations table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,  -- Command type: SELECT, INSERT, UPDATE, DELETE
    qual, -- USING clause
    with_check -- WITH CHECK clause
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY cmd, policyname;
