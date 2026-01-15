-- Update trailer_type constraint to allow new values
ALTER TABLE public.loads DROP CONSTRAINT IF EXISTS loads_trailer_type_check;
ALTER TABLE public.loads ADD CONSTRAINT loads_trailer_type_check CHECK (trailer_type IN ('Dry Van', 'Reefer', 'Flatbed', 'Stepdeck', 'Flat Bed', 'Step Deck', 'Minifloat', '1Ton'));