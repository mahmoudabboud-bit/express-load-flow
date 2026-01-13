-- Add driver_id column to loads table for proper driver assignment
ALTER TABLE public.loads ADD COLUMN driver_id uuid REFERENCES auth.users(id);

-- Create index for faster driver queries
CREATE INDEX idx_loads_driver_id ON public.loads(driver_id);

-- Update RLS policy for drivers to use driver_id
DROP POLICY IF EXISTS "Drivers can view assigned loads" ON public.loads;
CREATE POLICY "Drivers can view assigned loads" 
ON public.loads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND driver_id = auth.uid()
);

DROP POLICY IF EXISTS "Drivers can update assigned loads" ON public.loads;
CREATE POLICY "Drivers can update assigned loads" 
ON public.loads 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND driver_id = auth.uid()
);