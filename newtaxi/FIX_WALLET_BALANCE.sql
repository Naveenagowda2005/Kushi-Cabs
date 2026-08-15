-- Remove the DEFAULT constraint to allow 0 as a valid value
ALTER TABLE public.app_settings 
ALTER COLUMN minimum_wallet_balance_for_drivers DROP DEFAULT;

-- Set it to 0 to allow no minimum
UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 0 
WHERE id = 'global';

-- Verify
SELECT id, minimum_wallet_balance_for_drivers FROM public.app_settings WHERE id = 'global';

