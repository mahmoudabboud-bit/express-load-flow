-- Fix OPEN_ENDPOINTS: Restrict notification INSERT to service_role only
-- This prevents authenticated users from inserting notifications for other users

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create restricted policy: only service_role can insert notifications
-- This allows the edge function (using service_role key) to work while blocking regular users
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);