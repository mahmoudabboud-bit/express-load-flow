-- Create function to link driver account on signup
CREATE OR REPLACE FUNCTION public.link_driver_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email exists in drivers table and update user_id
  UPDATE public.drivers
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table (which is populated on signup)
CREATE TRIGGER on_profile_created_link_driver
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_driver_on_signup();