-- ============================================================
-- ADD CAR DETAILS TO TRIPS TABLE
-- Store car type, seater, and fuel type for each trip
-- ============================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS car_type UUID,
ADD COLUMN IF NOT EXISTS car_model UUID,
ADD COLUMN IF NOT EXISTS seater_type UUID,
ADD COLUMN IF NOT EXISTS fuel_type UUID;

-- Create car_types table for reference
CREATE TABLE IF NOT EXISTS car_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create car_models table (linked to car_type)
CREATE TABLE IF NOT EXISTS car_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_type_id UUID NOT NULL REFERENCES car_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seater_types table
CREATE TABLE IF NOT EXISTS seater_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fuel_types table
CREATE TABLE IF NOT EXISTS fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert car types
INSERT INTO car_types (name) VALUES 
  ('Sedan'),
  ('SUV'),
  ('Inova'),
  ('Inova Crysta')
ON CONFLICT (name) DO NOTHING;

-- Insert car models for each type
INSERT INTO car_models (car_type_id, name)
SELECT id, 'Standard' FROM car_types WHERE name = 'Sedan'
ON CONFLICT DO NOTHING;

INSERT INTO car_models (car_type_id, name)
SELECT id, 'Standard' FROM car_types WHERE name = 'SUV'
ON CONFLICT DO NOTHING;

INSERT INTO car_models (car_type_id, name)
SELECT id, 'Standard' FROM car_types WHERE name = 'Inova'
ON CONFLICT DO NOTHING;

INSERT INTO car_models (car_type_id, name)
SELECT id, 'Standard' FROM car_types WHERE name = 'Inova Crysta'
ON CONFLICT DO NOTHING;

-- Insert seater types
INSERT INTO seater_types (name) VALUES 
  ('4 Seater'),
  ('5 Seater'),
  ('6 Seater'),
  ('6+1 Seater'),
  ('7 Seater'),
  ('8 Seater'),
  ('9 Seater')
ON CONFLICT (name) DO NOTHING;

-- Insert fuel types
INSERT INTO fuel_types (name) VALUES 
  ('Petrol'),
  ('Diesel'),
  ('CNG'),
  ('Hybrid'),
  ('Electric')
ON CONFLICT (name) DO NOTHING;
