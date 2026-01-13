-- Remove the foreign key constraint on loads.driver_id
-- This allows assigning loads to drivers who haven't signed up yet
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_driver_id_fkey;