-- Drop the existing status check constraint
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_status_check;

-- Add new check constraint that includes "Awaiting Payment"
ALTER TABLE public.loads ADD CONSTRAINT loads_status_check 
CHECK (status IN ('Pending', 'Awaiting Payment', 'Assigned', 'Arrived', 'Loaded', 'In-Transit', 'Arrived at Delivery', 'Delivered'));