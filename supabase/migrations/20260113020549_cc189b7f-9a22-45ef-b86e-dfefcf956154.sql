-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create drivers table for extended driver information
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  truck_type TEXT NOT NULL,
  truck_number TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Dispatchers can view and manage all drivers
CREATE POLICY "Dispatchers can view all drivers"
ON public.drivers
FOR SELECT
USING (has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Dispatchers can insert drivers"
ON public.drivers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Dispatchers can update drivers"
ON public.drivers
FOR UPDATE
USING (has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Dispatchers can delete drivers"
ON public.drivers
FOR DELETE
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Drivers can view their own record
CREATE POLICY "Drivers can view own record"
ON public.drivers
FOR SELECT
USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();