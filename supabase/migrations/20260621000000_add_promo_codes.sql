-- Kampanjkoder per resa. JSONB-array med { code, type: 'percent'|'fixed', value, label? }.
-- Admin styr rabatten själv; rabatten räknas på hela totalen vid anmälan.
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS promo_codes jsonb;
