-- Allow any authenticated user to read roles (needed during registration)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Also allow reading roles during signup (before profile exists)
CREATE POLICY "Anon can read roles"
  ON roles FOR SELECT
  TO anon
  USING (true);
