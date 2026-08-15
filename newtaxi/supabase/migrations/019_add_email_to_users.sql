-- Allow email-based login by making phone nullable and adding email column
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone) DEFERRABLE INITIALLY DEFERRED;
