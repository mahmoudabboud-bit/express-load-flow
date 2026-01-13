-- First drop the existing constraint
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_status_check;

-- Update existing 'Approved' status to 'Assigned' to match new workflow
UPDATE public.loads SET status = 'Assigned' WHERE status = 'Approved';

-- Add new check constraint that includes all valid statuses
ALTER TABLE public.loads ADD CONSTRAINT loads_status_check 
CHECK (status IN ('Pending', 'Assigned', 'In-Transit', 'Delivered'));