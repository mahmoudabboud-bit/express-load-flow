-- Allow clients to update their own loads while status is Pending
CREATE POLICY "Clients can update their own pending loads"
ON public.loads
FOR UPDATE
USING (auth.uid() = client_id AND status = 'Pending')
WITH CHECK (auth.uid() = client_id AND status = 'Pending');