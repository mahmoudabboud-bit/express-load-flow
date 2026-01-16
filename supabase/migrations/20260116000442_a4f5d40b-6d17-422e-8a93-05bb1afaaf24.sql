-- Update the loads status constraint to include "Arrived at Delivery"
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_status_check;

ALTER TABLE public.loads ADD CONSTRAINT loads_status_check 
CHECK (status IN ('Pending', 'Assigned', 'Arrived', 'Loaded', 'In-Transit', 'Arrived at Delivery', 'Delivered'));

-- Add arrived_at_delivery timestamp column
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS arrived_at_delivery_at TIMESTAMP WITH TIME ZONE;