import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.jqzpxxsrdcdgimiimbqx',
  password: '3240waels800',
  ssl: { rejectUnauthorized: false }
});

async function addReviewerFK() {
  await client.connect();
  console.log('🔧 Adding reviewer_profiles FK...\n');

  // Add FK from reviewer_profiles.user_id to profiles.id
  const sql = `
    -- Add FK from reviewer_profiles to profiles
    ALTER TABLE reviewer_profiles DROP CONSTRAINT IF EXISTS reviewer_profiles_user_id_fkey;
    ALTER TABLE reviewer_profiles ADD CONSTRAINT reviewer_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);
  `;

  try {
    await client.query(sql);
    console.log('✅ FK added: reviewer_profiles.user_id → profiles.id');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Verify
  const fks = await client.query(`
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'reviewer_profiles';
  `);
  
  console.log('\n📌 reviewer_profiles Foreign Keys:');
  fks.rows.forEach(fk => {
    console.log(`  ✅ ${fk.column_name} → ${fk.foreign_table}`);
  });

  await client.end();
}

addReviewerFK();
