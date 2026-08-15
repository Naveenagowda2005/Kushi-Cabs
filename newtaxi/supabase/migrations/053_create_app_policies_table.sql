-- Create app_policies table for managing privacy, terms, cancellation, etc.
CREATE TABLE IF NOT EXISTS app_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  applies_to TEXT[] DEFAULT ARRAY['driver', 'vendor'], -- Who this applies to
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE app_policies ENABLE ROW LEVEL SECURITY;

-- Super admin can read all policies
CREATE POLICY "Super admin can read policies" ON app_policies
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role_id = 1 AND is_active = true
    )
  );

-- Super admin can update policies
CREATE POLICY "Super admin can update policies" ON app_policies
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role_id = 1 AND is_active = true
    )
  );

-- Super admin can insert policies
CREATE POLICY "Super admin can insert policies" ON app_policies
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role_id = 1 AND is_active = true
    )
  );

-- Drivers and vendors can read policies
CREATE POLICY "Users can read policies" ON app_policies
  FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IN (SELECT id FROM users WHERE role_id = 3) THEN 'driver' = ANY(applies_to)
      WHEN auth.uid() IN (SELECT id FROM users WHERE role_id = 2) THEN 'vendor' = ANY(applies_to)
      ELSE false
    END
  );

-- Add index for faster lookups
CREATE INDEX idx_app_policies_type ON app_policies(policy_type);
