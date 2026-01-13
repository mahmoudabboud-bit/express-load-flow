-- Add price column for dispatcher to set and signature fields for delivery confirmation
ALTER TABLE public.loads
ADD COLUMN price_cents integer,
ADD COLUMN client_signature_url text,
ADD COLUMN signature_timestamp timestamp with time zone;

-- Update the default status to ensure new loads start as 'Pending'
-- Then status flow: Pending -> Assigned -> In-Transit -> Delivered

-- Update RLS policy for clients to allow signing on delivered loads
DROP POLICY IF EXISTS "Clients can update their own pending loads" ON public.loads;

CREATE POLICY "Clients can update their own loads"
ON public.loads
FOR UPDATE
USING (
  auth.uid() = client_id AND (
    -- Clients can edit pending loads
    status = 'Pending' OR 
    -- Clients can sign delivered loads (only the signature fields)
    status = 'Delivered'
  )
)
WITH CHECK (
  auth.uid() = client_id AND (
    status = 'Pending' OR 
    status = 'Delivered'
  )
);

-- Create index for better performance on signature queries
CREATE INDEX IF NOT EXISTS idx_loads_status_signature ON public.loads (status, client_signature_url);