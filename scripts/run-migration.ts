// Run migration via Supabase REST API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqzpxxsrdcdgimiimbqx.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAndCreateTables() {
  console.log('Checking existing tables...\n');
  
  // Check if tables exist by trying to query them
  const tablesToCheck = ['tours', 'order_items', 'user_verifications'];
  
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.log(`❌ Table "${table}" does NOT exist`);
      } else {
        console.log(`⚠️ Table "${table}": ${error.message}`);
      }
    } else {
      console.log(`✅ Table "${table}" exists`);
    }
  }
  
  console.log('\n---');
  console.log('Note: Creating tables via REST API is not supported.');
  console.log('Please run the SQL migration manually in Supabase Dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/jqzpxxsrdcdgimiimbqx/sql/new');
  console.log('2. Copy the contents of: supabase/migrations/002_missing_tables.sql');
  console.log('3. Execute the SQL');
  console.log('---');
}

checkAndCreateTables();
