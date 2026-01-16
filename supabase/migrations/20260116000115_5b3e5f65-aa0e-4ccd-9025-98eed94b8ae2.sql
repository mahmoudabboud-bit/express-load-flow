-- Update the loads status constraint to include new statuses
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_status_check;

ALTER TABLE public.loads ADD CONSTRAINT loads_status_check 
CHECK (status IN ('Pending', 'Assigned', 'Arrived', 'Loaded', 'In-Transit', 'Delivered'));

-- Add arrived_at and loaded_at timestamp columns
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS loaded_at TIMESTAMP WITH TIME ZONE;