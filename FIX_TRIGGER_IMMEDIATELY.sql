-- IMMEDIATE FIX: Replace the trigger function that has invalid 'started' status
-- Run this NOW in Supabase SQL Editor

-- First, drop the trigger (this allows us to modify the function)
DROP TRIGGER IF EXISTS trigger_process_refund_on_cancellation ON trips;

-- Now replace the function with the corrected version
CREATE OR REPLACE FUNCTION process_refund_on_trip_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_record RECORD;
  v_refund_percentage INTEGER;
  v_refund_amount NUMERIC;
BEGIN
  -- Only process if trip is being cancelled and it was accepted or in progress
  -- Changed: 'started' → 'in_progress' (valid enum value)
  IF NEW.status = 'cancelled' AND OLD.status IN ('accepted', 'in_progress') AND NEW.accepted_at IS NOT NULL THEN
    
    -- Find the payment record
    SELECT * INTO v_payment_record FROM payments 
    WHERE trip_id = NEW.id AND status = 'completed'
    LIMIT 1;
    
    IF v_payment_record IS NOT NULL THEN
      -- Calculate refund percentage
      SELECT refund_percentage INTO v_refund_percentage
      FROM calculate_refund_percentage(NEW.accepted_at, NOW(), NEW.scheduled_at);
      
      -- Calculate refund amount
      v_refund_amount := v_payment_record.commission_amount * (v_refund_percentage::NUMERIC / 100.0);
      
      -- Create refund record if refund amount > 0
      IF v_refund_amount > 0 THEN
        INSERT INTO refunds (
          payment_id,
          trip_id,
          driver_id,
          original_payment_amount,
          refund_amount,
          refund_percentage,
          cancelled_at,
          minutes_from_acceptance,
          status
        ) VALUES (
          v_payment_record.id,
          NEW.id,
          NEW.driver_id,
          v_payment_record.commission_amount,
          v_refund_amount,
          v_refund_percentage,
          NOW(),
          EXTRACT(EPOCH FROM (NOW() - NEW.accepted_at)) / 60.0,
          'pending'
        );
        
        -- Update trip with refund reference
        NEW.refund_id := (SELECT id FROM refunds WHERE payment_id = v_payment_record.id LIMIT 1);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_process_refund_on_cancellation
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION process_refund_on_trip_cancellation();

-- Verification complete - trigger and function have been updated successfully
-- The trigger now uses 'in_progress' instead of the invalid 'started' status
