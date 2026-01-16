-- Drop and recreate the link_driver_on_signup function to also create new driver records
CREATE OR REPLACE FUNCTION public.link_driver_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_user_id UUID;
  driver_record RECORD;
BEGIN
  -- Only process if user signed up as driver
  IF NEW.raw_user_meta_data->>'role' = 'driver' THEN
    -- Check if there's an existing driver record by email
    SELECT * INTO driver_record FROM public.drivers 
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
    
    IF FOUND THEN
      -- Get the old temporary user_id before updating
      old_user_id := driver_record.user_id;
      
      -- Update existing driver record with the new auth user id
      UPDATE public.drivers
      SET user_id = NEW.id,
          first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', driver_record.first_name),
          last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', driver_record.last_name),
          truck_type = COALESCE(NEW.raw_user_meta_data->>'truck_type', driver_record.truck_type),
          truck_number = COALESCE(NEW.raw_user_meta_data->>'truck_number', driver_record.truck_number),
          updated_at = now()
      WHERE id = driver_record.id;
      
      -- Also update any loads that were assigned to the old temporary user_id
      IF old_user_id IS NOT NULL AND old_user_id != NEW.id THEN
        UPDATE public.loads
        SET driver_id = NEW.id
        WHERE driver_id = old_user_id;
      END IF;
    ELSE
      -- Create new driver record
      INSERT INTO public.drivers (first_name, last_name, email, truck_type, truck_number, user_id)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'truck_type', 'Flat Bed'),
        COALESCE(NEW.raw_user_meta_data->>'truck_number', ''),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for driver signup if it doesn't exist
DROP TRIGGER IF EXISTS on_driver_signup ON auth.users;
CREATE TRIGGER on_driver_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_driver_on_signup();