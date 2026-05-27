-- Add is_online column to drivers table
-- is_online = driver chose to go online/offline
-- is_available = driver has no active trip (system managed)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Update RLS: drivers can update their own online status
DROP POLICY IF EXISTS "Drivers can update own online status" ON drivers;
CREATE POLICY "Drivers can update own online status"
  ON drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
