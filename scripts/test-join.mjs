import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testJoin() {
  console.log('🧪 Testing profile join...\n');
  
  // Test the simplified query
  const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=*,author:profiles!reviews_author_id_fkey(id,display_name,avatar)&limit=5`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2).substring(0, 1000));
  
  // Also test topics with profiles
  console.log('\n🧪 Testing topics join...\n');
  const topicsResponse = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=*,author:profiles(id,display_name,avatar)&limit=3`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('Status:', topicsResponse.status);
  const topicsData = await topicsResponse.json();
  console.log('Response:', JSON.stringify(topicsData, null, 2).substring(0, 1000));
}

testJoin();
