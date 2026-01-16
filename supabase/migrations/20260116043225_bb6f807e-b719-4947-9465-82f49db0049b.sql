-- Add payment tracking fields to loads table
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS payment_required boolean DEFAULT false;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'not_required';
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Add check constraint for valid payment statuses
ALTER TABLE public.loads ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed'));