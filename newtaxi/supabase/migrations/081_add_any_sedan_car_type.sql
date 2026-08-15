-- Add "Any Sedan" as a car type option
INSERT INTO car_types (name) 
VALUES ('Any Sedan')
ON CONFLICT (name) DO NOTHING;
