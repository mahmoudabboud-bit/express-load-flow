-- Add timestamp columns for tracking status changes
ALTER TABLE public.loads 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;