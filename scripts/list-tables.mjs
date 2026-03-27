import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listTables() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_names`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  const data = await response.json();
  console.log('📊 Available tables in Supabase:\n');
  data.forEach(r => console.log(`  - ${r.table_name}`));
  console.log(`\nTotal: ${data.length} tables`);
}

listTables();
