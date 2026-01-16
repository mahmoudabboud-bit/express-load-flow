-- Fix the link_driver_on_signup function to properly access user metadata
CREATE OR REPLACE FUNCTION public.link_driver_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_user_id UUID;
  driver_record RECORD;
  user_role TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  truck_type_val TEXT;
  truck_number_val TEXT;
BEGIN
  -- Get role from metadata
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Only process if user signed up as driver
  IF user_role = 'driver' THEN
    -- Extract metadata values
    first_name_val := NEW.raw_user_meta_data->>'first_name';
    last_name_val := NEW.raw_user_meta_data->>'last_name';
    truck_type_val := NEW.raw_user_meta_data->>'truck_type';
    truck_number_val := NEW.raw_user_meta_data->>'truck_number';
    
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
          first_name = COALESCE(first_name_val, driver_record.first_name),
          last_name = COALESCE(last_name_val, driver_record.last_name),
          truck_type = COALESCE(truck_type_val, driver_record.truck_type),
          truck_number = COALESCE(truck_number_val, driver_record.truck_number),
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
        COALESCE(first_name_val, ''),
        COALESCE(last_name_val, ''),
        NEW.email,
        COALESCE(truck_type_val, 'Flat Bed'),
        COALESCE(truck_number_val, ''),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;