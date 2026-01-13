-- Make signatures bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'signatures';

-- Drop existing permissive SELECT policy that allows any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON storage.objects;

-- Create proper SELECT policies for signatures bucket
CREATE POLICY "Clients can view their load signatures"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'signatures' AND
  auth.uid() IN (
    SELECT client_id FROM public.loads 
    WHERE client_signature_url LIKE '%' || storage.objects.name || '%'
  )
);

CREATE POLICY "Dispatchers can view all signatures"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'signatures' AND
  has_role(auth.uid(), 'dispatcher'::app_role)
);

CREATE POLICY "Drivers can view signatures for their loads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'signatures' AND
  has_role(auth.uid(), 'driver'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.loads 
    WHERE driver_id = auth.uid() 
    AND client_signature_url LIKE '%' || storage.objects.name || '%'
  )
);