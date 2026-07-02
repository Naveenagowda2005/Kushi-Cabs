-- Revert minimum wallet balance to 0 (original super admin setting)

UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 0 
WHERE id = 'global';

-- Verify the revert
SELECT id, minimum_wallet_balance_for_drivers FROM public.app_settings WHERE id = 'global';
