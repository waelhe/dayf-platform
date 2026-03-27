import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSimple() {
  console.log('🧪 Testing simple queries without joins...\n');
  
  // Test simple reviews query
  const reviewsResponse = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=*&limit=5`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('Reviews status:', reviewsResponse.status);
  const reviews = await reviewsResponse.json();
  console.log('Reviews count:', reviews.length);
  
  // Test simple topics query
  const topicsResponse = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=*&limit=3`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('Topics status:', topicsResponse.status);
  const topics = await topicsResponse.json();
  console.log('Topics count:', topics.length);
  
  // Check profiles table structure
  const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('\nProfiles status:', profilesResponse.status);
  if (profilesResponse.ok) {
    const profiles = await profilesResponse.json();
    if (profiles.length > 0) {
      console.log('Profile columns:', Object.keys(profiles[0]));
    }
  } else {
    const error = await profilesResponse.text();
    console.log('Error:', error);
  }
}

testSimple();
