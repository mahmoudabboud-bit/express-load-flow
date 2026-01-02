-- Add email column to profiles table for notification purposes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with user emails (will be done on next login)
-- Create trigger to sync email on profile creation/update
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS sync_email_on_profile ON public.profiles;
CREATE TRIGGER sync_email_on_profile
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email();

-- Backfill existing profiles with emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;