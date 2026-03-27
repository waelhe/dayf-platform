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
  console.log('🔍 Verifying database setup...\n');
  
  // Check functions
  const functions = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    ORDER BY routine_name;
  `);
  console.log('📋 Functions:', functions.rows.map(r => r.routine_name).join(', '));
  
  // Check audit_logs table
  const auditTable = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    );
  `);
  console.log('\n📊 audit_logs table:', auditTable.rows[0].exists ? '✅ Exists' : '❌ Missing');
  
  // Check soft delete columns
  const deletedAt = await client.query(`
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'deleted_at' AND table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('\n🗑️ Soft delete columns:', deletedAt.rows.map(r => r.table_name).join(', '));
  
  // Check indexes
  const indexes = await client.query(`
    SELECT indexname FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'audit_logs';
  `);
  console.log('\n📑 Indexes on audit_logs:', indexes.rows.map(r => r.indexname).join(', '));
  
  // Test escrow_fund function
  console.log('\n🧪 Testing escrow_fund function signature...');
  const testResult = await client.query(`
    SELECT pg_get_function_arguments(oid) 
    FROM pg_proc 
    WHERE proname = 'escrow_fund';
  `);
  if (testResult.rows.length > 0) {
    console.log('✅ escrow_fund arguments:', testResult.rows[0].pg_get_function_arguments);
  }
  
  await client.end();
}

main();
