-- Remove "Any sedan" car type from the database
DELETE FROM car_types WHERE name = 'Any sedan';

-- Verify the deletion
SELECT * FROM car_types ORDER BY name;
