-- Allow vendors to create trips
CREATE POLICY "Vendors can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'vendor' AND created_by = auth.uid()
  );

-- Allow admins to create trips
CREATE POLICY "Admins can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');
