-- Update minimum wallet balance setting
-- Current value in database: 0
-- This script updates it to a reasonable minimum (e.g., 500)

UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 500 
WHERE id = 'global';

-- Verify the update
SELECT id, minimum_wallet_balance_for_drivers FROM public.app_settings WHERE id = 'global';
