-- Add index to driver_documents for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id_status 
ON driver_documents(driver_id, status);

-- Add index on driver_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id 
ON driver_documents(driver_id);
