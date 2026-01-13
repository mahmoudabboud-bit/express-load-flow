-- Add pickup time, delivery date, and delivery time columns to loads table
ALTER TABLE public.loads 
  ADD COLUMN pickup_time time,
  ADD COLUMN delivery_date date,
  ADD COLUMN delivery_time time;