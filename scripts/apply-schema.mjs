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

async function applySchema() {
  await client.connect();
  console.log('🔧 Applying complete database schema...\n');

  const migrations = [
    // 1. Create missing tables
    {
      name: 'review_photos table',
      sql: `
        CREATE TABLE IF NOT EXISTS review_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          review_id UUID NOT NULL,
          url TEXT NOT NULL,
          caption TEXT,
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    },
    {
      name: 'review_replies table',
      sql: `
        CREATE TABLE IF NOT EXISTS review_replies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          review_id UUID NOT NULL,
          author_id TEXT NOT NULL,
          author_name TEXT,
          author_role TEXT DEFAULT 'provider',
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    },
    {
      name: 'review_helpful table',
      sql: `
        CREATE TABLE IF NOT EXISTS review_helpful (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          review_id UUID NOT NULL,
          user_id TEXT NOT NULL,
          is_helpful BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(review_id, user_id)
        )`
    },
    {
      name: 'reviewer_profiles table',
      sql: `
        CREATE TABLE IF NOT EXISTS reviewer_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL UNIQUE,
          level TEXT DEFAULT 'NEW_REVIEWER',
          total_reviews INTEGER DEFAULT 0,
          helpful_votes INTEGER DEFAULT 0,
          badges JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    },
    // 2. Add Foreign Keys
    {
      name: 'FK: reviews.author_id -> profiles.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'reviews_author_id_fkey'
          ) THEN
            ALTER TABLE reviews ADD CONSTRAINT reviews_author_id_fkey 
            FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
          END IF;
        END $$;`
    },
    {
      name: 'FK: topics.author_id -> profiles.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'topics_author_id_fkey'
          ) THEN
            ALTER TABLE topics ADD CONSTRAINT topics_author_id_fkey 
            FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
          END IF;
        END $$;`
    },
    {
      name: 'FK: replies.author_id -> profiles.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'replies_author_id_fkey'
          ) THEN
            ALTER TABLE replies ADD CONSTRAINT replies_author_id_fkey 
            FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
          END IF;
        END $$;`
    },
    {
      name: 'FK: bookings.user_id -> profiles.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'bookings_user_id_fkey'
          ) THEN
            ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
          END IF;
        END $$;`
    },
    {
      name: 'FK: bookings.service_id -> services.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'bookings_service_id_fkey'
          ) THEN
            ALTER TABLE bookings ADD CONSTRAINT bookings_service_id_fkey 
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
          END IF;
        END $$;`
    },
    {
      name: 'FK: orders.user_id -> profiles.id',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'orders_user_id_fkey'
          ) THEN
            ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
          END IF;
        END $$;`
    },
    // 3. Create indexes
    {
      name: 'Index: reviews.author_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id)`
    },
    {
      name: 'Index: reviews.reference_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_reviews_reference_id ON reviews(reference_id)`
    },
    {
      name: 'Index: topics.author_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id)`
    },
    {
      name: 'Index: bookings.user_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`
    },
    {
      name: 'Index: profiles.email',
      sql: `CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)`
    },
    // 4. Create update trigger function
    {
      name: 'Auto-update trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`
    },
    // 5. Apply triggers
    {
      name: 'Trigger: reviews.updated_at',
      sql: `
        DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
        CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    },
    {
      name: 'Trigger: profiles.updated_at',
      sql: `
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    },
    // 6. Add missing columns to reviews
    {
      name: 'Column: reviews.location_rating',
      sql: `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS location_rating NUMERIC`
    },
    {
      name: 'Column: reviews.metadata',
      sql: `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS metadata JSONB`
    },
  ];

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    try {
      await client.query(migration.sql);
      console.log(`✅ ${migration.name}`);
      success++;
    } catch (error) {
      console.log(`❌ ${migration.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed`);
  
  // Verify the new tables
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('review_photos', 'review_replies', 'review_helpful', 'reviewer_profiles')
    ORDER BY table_name;
  `);
  
  console.log('\n📌 New tables created:');
  tables.rows.forEach(t => console.log(`  ✅ ${t.table_name}`));
  
  // Count foreign keys
  const fks = await client.query(`
    SELECT COUNT(*) as count FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
  `);
  
  console.log(`\n📌 Total Foreign Keys: ${fks.rows[0].count}`);

  await client.end();
}

applySchema();
