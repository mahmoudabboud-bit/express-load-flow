-- Add delivery_asap column to loads table
ALTER TABLE public.loads ADD COLUMN delivery_asap BOOLEAN DEFAULT FALSE;