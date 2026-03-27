import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTables() {
  console.log('🔍 Checking Supabase tables...\n');
  
  // Check reviews table
  const reviewsResponse = await fetch(`${SUPABASE_URL}/rest/v1/reviews?limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('reviews table:', reviewsResponse.status);
  if (!reviewsResponse.ok) {
    const error = await reviewsResponse.text();
    console.log('Error:', error);
  } else {
    const data = await reviewsResponse.json();
    console.log('Sample data:', JSON.stringify(data, null, 2).substring(0, 500));
  }
  
  // Check users table
  const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('\nusers table:', usersResponse.status);
  
  // Check review_photos table
  const photosResponse = await fetch(`${SUPABASE_URL}/rest/v1/review_photos?limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  
  console.log('review_photos table:', photosResponse.status);
}

checkTables();
