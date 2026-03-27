import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/([a-z]{20,})\.supabase\.co/)?.[1];
console.log('Project Ref:', projectRef);

// Try Supabase Management API
async function tryManagementAPI() {
  // This requires a different token (access token from Supabase account)
  // The service_role key is for the project, not for management API
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ 
      query: 'SELECT 1;' 
    }),
  });
  
  console.log('Management API response:', response.status);
  const text = await response.text();
  console.log(text.substring(0, 500));
}

await tryManagementAPI();
