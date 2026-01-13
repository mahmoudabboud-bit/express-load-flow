-- Make user_id nullable to allow dispatchers to create client profiles before signup
ALTER TABLE public.clients ALTER COLUMN user_id DROP NOT NULL;

-- Create function to link client on signup
CREATE OR REPLACE FUNCTION public.link_client_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  client_record RECORD;
BEGIN
  -- Check if user signed up as client
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    -- Find matching client by email
    SELECT * INTO client_record FROM public.clients 
    WHERE email = NEW.email AND user_id IS NULL
    LIMIT 1;
    
    IF FOUND THEN
      -- Update existing client record with user_id
      UPDATE public.clients 
      SET user_id = NEW.id,
          first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', client_record.first_name),
          last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', client_record.last_name),
          phone_number = COALESCE(NEW.raw_user_meta_data->>'phone_number', client_record.phone_number),
          address = COALESCE(NEW.raw_user_meta_data->>'address', client_record.address),
          updated_at = now()
      WHERE id = client_record.id;
    ELSE
      -- Create new client record
      INSERT INTO public.clients (first_name, last_name, email, phone_number, address, user_id)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run after user signup
DROP TRIGGER IF EXISTS on_client_signup ON auth.users;
CREATE TRIGGER on_client_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_client_on_signup();

-- Update RLS policy to handle clients with user_id
DROP POLICY IF EXISTS "Clients can view own record" ON public.clients;
CREATE POLICY "Clients can view own record" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- Allow clients to update their own record
DROP POLICY IF EXISTS "Clients can update own record" ON public.clients;
CREATE POLICY "Clients can update own record" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);