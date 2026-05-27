-- Add customer_pre_advance column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS customer_pre_advance DECIMAL(10, 2) DEFAULT 0;
