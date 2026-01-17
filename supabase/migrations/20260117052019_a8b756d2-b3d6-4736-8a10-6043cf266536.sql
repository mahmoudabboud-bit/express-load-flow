-- Add DELETE policy for dispatchers to revoke invites
CREATE POLICY "Dispatchers can delete invites"
ON public.dispatcher_invites
FOR DELETE
USING (has_role(auth.uid(), 'dispatcher'::app_role));