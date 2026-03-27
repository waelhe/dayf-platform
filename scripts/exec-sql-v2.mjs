import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Testing Supabase connection...\n');

// Test basic connection first
async function testConnection() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  console.log('Connection test:', response.status);
}

// Try to execute SQL via the query endpoint
async function tryQueryEndpoint() {
  const sql = "SELECT 1 as test;";
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  const text = await response.text();
  console.log('Query endpoint response:', response.status, text.substring(0, 200));
}

// Try to create a simple function
async function createFunction() {
  const createFuncSQL = `
    CREATE OR REPLACE FUNCTION test_function()
    RETURNS TEXT
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN 'Hello from Dayf Platform!';
    END;
    $$;
  `;
  
  // Try via SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'x-supabase-authorization': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: createFuncSQL }),
  });
  
  console.log('PG endpoint:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
  } else {
    const text = await response.text();
    console.log('Error:', text.substring(0, 500));
  }
}

await testConnection();
await tryQueryEndpoint();
await createFunction();
