-- ============================================================
-- VERIFY MIGRATION 106 TRIGGER IS CORRECT
-- ============================================================

-- Get the current trigger function definition
SELECT 
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'update_overall_verification_status';

-- Show the trigger details
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_update_overall_verification_status';
