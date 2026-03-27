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

async function fixTypes() {
  await client.connect();
  console.log('🔧 Fixing type mismatches...\n');

  // Problem: profiles.id is UUID, but other tables use TEXT for user references
  // Solution: Change profiles.id to TEXT to match

  const migrations = [
    {
      name: 'Change profiles.id to TEXT',
      sql: `
        ALTER TABLE profiles 
        DROP CONSTRAINT IF EXISTS profiles_pkey,
        ALTER COLUMN id DROP DEFAULT,
        ALTER COLUMN id TYPE TEXT;
        
        ALTER TABLE profiles ADD PRIMARY KEY (id);
      `
    },
    {
      name: 'FK: reviews.author_id -> profiles.id',
      sql: `
        ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_author_id_fkey;
        ALTER TABLE reviews ADD CONSTRAINT reviews_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
      `
    },
    {
      name: 'FK: topics.author_id -> profiles.id',
      sql: `
        ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_author_id_fkey;
        ALTER TABLE topics ADD CONSTRAINT topics_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
      `
    },
    {
      name: 'FK: replies.author_id -> profiles.id',
      sql: `
        ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_author_id_fkey;
        ALTER TABLE replies ADD CONSTRAINT replies_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
      `
    },
    {
      name: 'FK: bookings.user_id -> profiles.id',
      sql: `
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
        ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: orders.user_id -> profiles.id',
      sql: `
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: escrows.buyer_id -> profiles.id',
      sql: `
        ALTER TABLE escrows DROP CONSTRAINT IF EXISTS escrows_buyer_id_fkey;
        ALTER TABLE escrows ADD CONSTRAINT escrows_buyer_id_fkey 
        FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: escrows.provider_id -> profiles.id',
      sql: `
        ALTER TABLE escrows DROP CONSTRAINT IF EXISTS escrows_provider_id_fkey;
        ALTER TABLE escrows ADD CONSTRAINT escrows_provider_id_fkey 
        FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: services.host_id -> profiles.id',
      sql: `
        ALTER TABLE services DROP CONSTRAINT IF EXISTS services_host_id_fkey;
        ALTER TABLE services ADD CONSTRAINT services_host_id_fkey 
        FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE SET NULL;
      `
    },
    {
      name: 'FK: companies.owner_id -> profiles.id',
      sql: `
        ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_owner_id_fkey;
        ALTER TABLE companies ADD CONSTRAINT companies_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: review_replies.author_id -> profiles.id',
      sql: `
        ALTER TABLE review_replies DROP CONSTRAINT IF EXISTS review_replies_author_id_fkey;
        ALTER TABLE review_replies ADD CONSTRAINT review_replies_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
      `
    },
    {
      name: 'FK: review_photos.review_id -> reviews.id',
      sql: `
        ALTER TABLE review_photos DROP CONSTRAINT IF EXISTS review_photos_review_id_fkey;
        ALTER TABLE review_photos ADD CONSTRAINT review_photos_review_id_fkey 
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: review_replies.review_id -> reviews.id',
      sql: `
        ALTER TABLE review_replies DROP CONSTRAINT IF EXISTS review_replies_review_id_fkey;
        ALTER TABLE review_replies ADD CONSTRAINT review_replies_review_id_fkey 
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
      `
    },
    {
      name: 'FK: review_helpful.review_id -> reviews.id',
      sql: `
        ALTER TABLE review_helpful DROP CONSTRAINT IF EXISTS review_helpful_review_id_fkey;
        ALTER TABLE review_helpful ADD CONSTRAINT review_helpful_review_id_fkey 
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
      `
    },
  ];

  for (const migration of migrations) {
    try {
      await client.query(migration.sql);
      console.log(`✅ ${migration.name}`);
    } catch (error) {
      console.log(`❌ ${migration.name}: ${error.message}`);
    }
  }

  // Count foreign keys
  const fks = await client.query(`
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);
  
  console.log('\n📌 Foreign Keys in database:');
  fks.rows.forEach(fk => {
    console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`);
  });
  
  console.log(`\n📊 Total: ${fks.rows.length} Foreign Keys`);

  await client.end();
}

fixTypes();
