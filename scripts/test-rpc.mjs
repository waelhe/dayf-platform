import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing RPC functions from application...\n');

// Test get_table_names RPC
async function testRPC() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_names`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ get_table_names RPC works!');
    console.log('📊 Tables found:', data.length);
    console.log('   Sample:', data.slice(0, 5).map(r => r.table_name).join(', '));
  } else {
    const error = await response.text();
    console.log('❌ Error:', error);
  }
  
  // Test escrow_fund with fake data (should return error about escrow not found)
  console.log('\n🧪 Testing escrow_fund RPC...');
  
  const testFundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/escrow_fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      p_escrow_id: '00000000-0000-0000-0000-000000000000',
      p_buyer_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 100,
      p_platform_fee: 10
    }),
  });
  
  const fundResult = await testFundResponse.json();
  console.log('Response:', JSON.stringify(fundResult));
  
  if (fundResult.error === 'Escrow not found' || fundResult.success === false) {
    console.log('✅ escrow_fund RPC works! (Correctly returned "not found" for fake ID)');
  }
}

testRPC();
