import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTables() {
  console.log('Creating missing tables...');
  
  // Note: Supabase doesn't allow DDL via REST API
  // We need to use the SQL Editor in the dashboard or a migration tool
  // For now, we'll verify what tables exist
  
  const tables = ['tours', 'order_items', 'user_verifications'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table "${table}": ${error.message}`);
    } else {
      console.log(`Table "${table}": ✅ exists`);
    }
  }
}

createTables();
