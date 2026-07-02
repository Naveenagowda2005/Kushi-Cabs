-- Run this in Supabase SQL Editor to fix driver trip visibility
-- This allows drivers to see trips assigned by vendors

DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;

CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'driver' AND (
      (status = 'pending' AND NOW() > vendor_visible_until)
      OR driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
      OR accepted_by = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as condition
FROM pg_policies
WHERE tablename = 'trips' AND policyname LIKE '%Drivers%'
ORDER BY policyname;
