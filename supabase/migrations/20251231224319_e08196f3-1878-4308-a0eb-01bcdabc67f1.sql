-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('client', 'dispatcher', 'driver');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create loads table
CREATE TABLE public.loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'In-Transit', 'Delivered')),
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    trailer_type TEXT NOT NULL CHECK (trailer_type IN ('Dry Van', 'Reefer', 'Flatbed', 'Stepdeck')),
    weight_lbs INTEGER NOT NULL,
    pickup_date DATE NOT NULL,
    driver_name TEXT,
    truck_number TEXT,
    bol_image_url TEXT
);

ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

-- Clients can view and create their own loads
CREATE POLICY "Clients can view their own loads"
ON public.loads FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create loads"
ON public.loads FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Dispatchers can view and update all loads
CREATE POLICY "Dispatchers can view all loads"
ON public.loads FOR SELECT
USING (public.has_role(auth.uid(), 'dispatcher'));

CREATE POLICY "Dispatchers can update all loads"
ON public.loads FOR UPDATE
USING (public.has_role(auth.uid(), 'dispatcher'));

-- Drivers can view loads assigned to them (by name match)
CREATE POLICY "Drivers can view assigned loads"
ON public.loads FOR SELECT
USING (public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update assigned loads"
ON public.loads FOR UPDATE
USING (public.has_role(auth.uid(), 'driver'));

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();