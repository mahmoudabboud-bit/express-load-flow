-- Update the trigger function to also update loads when driver signs up
CREATE OR REPLACE FUNCTION public.link_driver_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  old_user_id UUID;
BEGIN
  -- Get the old temporary user_id before updating
  SELECT user_id INTO old_user_id 
  FROM public.drivers 
  WHERE LOWER(email) = LOWER(NEW.email);
  
  -- Update the driver record with the new auth user id
  UPDATE public.drivers
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email);
  
  -- Also update any loads that were assigned to the old temporary user_id
  IF old_user_id IS NOT NULL THEN
    UPDATE public.loads
    SET driver_id = NEW.id
    WHERE driver_id = old_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;