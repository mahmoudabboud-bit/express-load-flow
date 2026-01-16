-- Add availability columns to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'Available',
ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for valid availability statuses
ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_availability_status_check 
CHECK (availability_status IN ('Available', 'Maintenance', 'Resetting 10 hours', 'Resetting 34 hours', 'Not Available'));