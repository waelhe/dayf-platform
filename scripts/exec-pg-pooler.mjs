import pg from 'pg';
import fs from 'fs';
import 'dotenv/config';

const { Client } = pg;

// Use connection pooler (port 6543)
const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.jqzpxxsrdcdgimiimbqx',
  password: '3240waels800',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔌 Connecting via Pooler...\n');
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    const sql = fs.readFileSync('./supabase/functions.sql', 'utf-8');
    
    console.log('📋 Executing SQL functions...\n');
    
    await client.query(sql);
    
    console.log('✅ All SQL functions executed successfully!\n');
    
    // Verify functions exist
    const { rows } = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('escrow_fund', 'escrow_release', 'escrow_refund', 'get_table_names')
      ORDER BY routine_name;
    `);
    
    console.log('📊 Created functions:');
    rows.forEach(r => console.log(`  ✅ ${r.routine_name} (${r.routine_type})`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try statements one by one
    console.log('\n🔄 Trying statement-by-statement...\n');
    
    const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 10);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.startsWith('--')) continue;
      
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
      process.stdout.write(`[${i + 1}] ${preview}... `);
      
      try {
        await client.query(stmt);
        console.log('✅');
      } catch (e) {
        console.log(`❌ ${e.message.substring(0, 60)}`);
      }
    }
  } finally {
    await client.end();
    console.log('\n🔌 Done!');
  }
}

main();
