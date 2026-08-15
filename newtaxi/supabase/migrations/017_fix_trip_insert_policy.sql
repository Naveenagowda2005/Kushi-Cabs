-- Drop old policy and replace with one that covers both vendor and admin trip creation
DROP POLICY IF EXISTS "Vendors can create trips" ON trips;
DROP POLICY IF EXISTS "Admins can create trips" ON trips;

CREATE POLICY "Authenticated users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
