-- Add ETA column to loads table
ALTER TABLE public.loads ADD COLUMN eta timestamp with time zone;