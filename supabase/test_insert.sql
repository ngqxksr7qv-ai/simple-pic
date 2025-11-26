-- Simple test to check if you can manually insert an organization
-- Run this AFTER authenticating (while logged in to the dashboard)

-- This simulates what the app is trying to do
INSERT INTO public.organizations (name) 
VALUES ('Test Organization') 
RETURNING *;
