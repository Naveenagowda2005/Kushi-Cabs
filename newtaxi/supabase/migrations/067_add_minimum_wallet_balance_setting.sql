-- Add minimum_wallet_balance_for_drivers setting to app_settings table

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS minimum_wallet_balance_for_drivers NUMERIC DEFAULT 500 NOT NULL;

-- Update existing row with default minimum wallet balance
UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 500 
WHERE id = 'global';

-- Ensure RLS is enabled
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read app settings
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

-- Allow only super admins to update app settings
DROP POLICY IF EXISTS "Only super admins can update app settings" ON public.app_settings;
CREATE POLICY "Only super admins can update app settings" ON public.app_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
