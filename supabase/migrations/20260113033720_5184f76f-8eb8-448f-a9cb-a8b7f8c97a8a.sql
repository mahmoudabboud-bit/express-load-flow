-- Create clients table for storing client profiles
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Dispatchers can view all clients
CREATE POLICY "Dispatchers can view all clients"
ON public.clients
FOR SELECT
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Dispatchers can insert clients
CREATE POLICY "Dispatchers can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'dispatcher'::app_role));

-- Dispatchers can update clients
CREATE POLICY "Dispatchers can update clients"
ON public.clients
FOR UPDATE
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Dispatchers can delete clients
CREATE POLICY "Dispatchers can delete clients"
ON public.clients
FOR DELETE
USING (has_role(auth.uid(), 'dispatcher'::app_role));

-- Clients can view their own record
CREATE POLICY "Clients can view own record"
ON public.clients
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();