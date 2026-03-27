import pg from 'pg';
import fs from 'fs';
import 'dotenv/config';

const { Client } = pg;

const client = new Client({
  host: 'db.jqzpxxsrdcdgimiimbqx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '3240waels800',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔌 Connecting to Supabase PostgreSQL...\n');
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    const sql = fs.readFileSync('./supabase/functions.sql', 'utf-8');
    
    // Execute the entire SQL file
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
    
    // Check audit_logs table
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'audit_logs';
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('\n📊 audit_logs table: ✅ Created');
    }
    
    // Check deleted_at columns
    const columnsCheck = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'deleted_at' 
      AND table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Soft delete columns (deleted_at):');
    columnsCheck.rows.forEach(r => console.log(`  ✅ ${r.table_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try executing statements one by one
    if (error.message.includes('syntax')) {
      console.log('\n🔄 Trying statement-by-statement execution...\n');
      
      const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 10);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt || stmt.startsWith('--')) continue;
        
        const preview = stmt.substring(0, 40).replace(/\n/g, ' ');
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
        
        try {
          await client.query(stmt);
          console.log('✅');
        } catch (e) {
          console.log(`❌ ${e.message.substring(0, 50)}`);
        }
      }
    }
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

main();
