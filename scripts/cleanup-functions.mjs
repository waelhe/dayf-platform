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

async function main() {
  await client.connect();
  console.log('🧹 Cleaning up duplicate functions...\n');
  
  // Drop all versions and recreate clean ones
  await client.query(`DROP FUNCTION IF EXISTS escrow_fund(UUID, UUID, DECIMAL, DECIMAL, JSONB)`);
  await client.query(`DROP FUNCTION IF EXISTS escrow_release(UUID, UUID, DECIMAL, UUID, TEXT)`);
  await client.query(`DROP FUNCTION IF EXISTS escrow_refund(UUID, UUID, DECIMAL, TEXT, DECIMAL)`);
  
  console.log('✅ Dropped old UUID functions\n');
  
  // List current functions
  const { rows } = await client.query(`
    SELECT p.proname as function_name, pg_get_function_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'escrow%'
    ORDER BY p.proname;
  `);
  
  console.log('📊 Current escrow functions:');
  rows.forEach(r => console.log(`   ${r.function_name}(${r.args})`));
  
  await client.end();
}

main();
