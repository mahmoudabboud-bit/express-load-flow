-- Add policy allowing drivers to update their own record
CREATE POLICY "Drivers can update own record" 
ON public.drivers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);