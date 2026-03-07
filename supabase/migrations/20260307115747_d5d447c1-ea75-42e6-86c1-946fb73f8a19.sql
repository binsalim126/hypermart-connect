
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_price numeric DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_offer boolean NOT NULL DEFAULT false;
