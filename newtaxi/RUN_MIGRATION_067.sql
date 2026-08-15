-- Add minimum_wallet_balance_for_drivers setting to app_settings table

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS minimum_wallet_balance_for_drivers NUMERIC DEFAULT 500 NOT NULL;

-- Update existing row with default minimum wallet balance
UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 500 
WHERE id = 'global';
