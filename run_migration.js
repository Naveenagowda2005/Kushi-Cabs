const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vofupwsnbcidjnifaihm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZnVwd3NuYmNpZGpuaWZhaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTg1OTEsImV4cCI6MjA5MzI3NDU5MX0.bimiuf0UELlSHg7SNNexv-IKnntvtDjisWDq7xlonhg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration: Add hills_included to trips table...');
    
    // Create the column
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS hills_included BOOLEAN DEFAULT FALSE;` 
      });
    
    if (error) {
      console.error('Error:', error);
      // Try alternative approach via REST API
      console.log('Trying alternative approach...');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('hills_included column added to trips table');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
