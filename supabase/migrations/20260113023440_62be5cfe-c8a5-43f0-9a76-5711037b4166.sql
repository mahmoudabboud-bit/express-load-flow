-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Create policy for drivers to upload signatures
CREATE POLICY "Drivers can upload signatures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND has_role(auth.uid(), 'driver'::app_role));

-- Create policy for authenticated users to view signatures
CREATE POLICY "Authenticated users can view signatures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

-- Create policy for drivers to update signatures
CREATE POLICY "Drivers can update signatures"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'signatures' AND has_role(auth.uid(), 'driver'::app_role));