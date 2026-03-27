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

async function analyzeSchema() {
  await client.connect();
  console.log('🔍 Analyzing current database schema...\n');
  
  // Get all tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('📊 Existing tables:', tables.rows.length);
  console.log('─────────────────────────────────────');
  
  for (const t of tables.rows) {
    const tableName = t.table_name;
    
    // Get columns for each table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    // Get foreign keys
    const fks = await client.query(`
      SELECT 
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = $1;
    `, [tableName]);
    
    // Get row count
    const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    
    console.log(`\n📌 ${tableName} (${count.rows[0].count} rows)`);
    console.log('Columns:');
    columns.rows.forEach(c => {
      const type = c.data_type.toUpperCase();
      const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      console.log(`  - ${c.column_name}: ${type} ${nullable}${def}`);
    });
    
    if (fks.rows.length > 0) {
      console.log('Foreign Keys:');
      fks.rows.forEach(fk => {
        console.log(`  → ${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`);
      });
    }
  }
  
  await client.end();
}

analyzeSchema();
