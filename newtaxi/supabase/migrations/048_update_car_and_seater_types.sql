-- ============================================================
-- Update car types and seater types
-- ============================================================

-- Clear existing car types
DELETE FROM car_types;

-- Insert updated car types
INSERT INTO car_types (name) VALUES
  ('Sedan'),
  ('SUV'),
  ('INNOVA'),
  ('INNOVA CRYSTA')
ON CONFLICT (name) DO NOTHING;

-- Clear existing seater types
DELETE FROM seater_types;

-- Insert updated seater types
INSERT INTO seater_types (name) VALUES
  ('4+1'),
  ('6+1'),
  ('7+1')
ON CONFLICT (name) DO NOTHING;
