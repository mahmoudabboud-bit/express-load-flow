-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles table access to authenticated users only
-- Users can view their own profile, dispatchers can view all profiles for load management

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create restricted policy: users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Dispatchers need to view client names for load management
CREATE POLICY "Dispatchers can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'dispatcher'::app_role));