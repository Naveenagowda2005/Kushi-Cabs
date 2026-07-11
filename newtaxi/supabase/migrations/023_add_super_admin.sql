-- Add super_admin role
INSERT INTO roles (name) VALUES ('super_admin') ON CONFLICT (name) DO NOTHING;

-- Create default super admin user
-- Note: This will be handled by the app on first run since we need Supabase auth
-- The app will check if super admin exists and create if not
