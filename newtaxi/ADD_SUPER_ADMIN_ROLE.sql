-- Add super_admin role to the roles table
-- Run this in your Supabase SQL editor

INSERT INTO roles (name) VALUES ('super_admin') 
ON CONFLICT (name) DO NOTHING;

-- Verify the role was added
SELECT * FROM roles WHERE name = 'super_admin';