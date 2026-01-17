-- Create dispatcher invites table
CREATE TABLE public.dispatcher_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispatcher_invites ENABLE ROW LEVEL SECURITY;

-- Only dispatchers can view invites
CREATE POLICY "Dispatchers can view invites"
ON public.dispatcher_invites
FOR SELECT
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Only dispatchers can create invites
CREATE POLICY "Dispatchers can create invites"
ON public.dispatcher_invites
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'dispatcher'::app_role));

-- Dispatchers can update invites (mark as used)
CREATE POLICY "Dispatchers can update invites"
ON public.dispatcher_invites
FOR UPDATE
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Service role can update invites (for the edge function to mark as used)
CREATE POLICY "Service role can update invites"
ON public.dispatcher_invites
FOR UPDATE
USING (true);

-- Public can read invites to validate tokens (needed for signup verification)
CREATE POLICY "Anyone can verify invite token"
ON public.dispatcher_invites
FOR SELECT
USING (true);

-- Add index for token lookups
CREATE INDEX idx_dispatcher_invites_token ON public.dispatcher_invites(token);
CREATE INDEX idx_dispatcher_invites_email ON public.dispatcher_invites(email);