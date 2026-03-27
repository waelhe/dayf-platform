import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.jqzpxxsrdcdgimiimbqx:3240waels800@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function verifySchema() {
  await client.connect();
  console.log('🔍 التحقق من الواقع الفعلي في قاعدة البيانات\n');
  console.log('='.repeat(60));

  // 1. هل جدول profiles أم users؟
  console.log('\n📊 1. الجداول الموجودة (users/profiles/reviewer_profiles):');
  const tables = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'profiles', 'reviewer_profiles')
    ORDER BY tablename
  `);
  tables.rows.forEach(t => console.log(`   ✅ ${t.tablename}`));

  // 2. أعمدة reviewer_profiles
  console.log('\n📊 2. أعمدة reviewer_profiles:');
  try {
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviewer_profiles'
      ORDER BY ordinal_position
    `);
    if (columns.rows.length > 0) {
      columns.rows.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));
    } else {
      console.log('   ❌ الجدول غير موجود أو فارغ');
    }
  } catch (e) {
    console.log('   ❌ خطأ:', e.message);
  }

  // 3. أعمدة profiles
  console.log('\n📊 3. أعمدة profiles (أول 15):');
  try {
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
      LIMIT 15
    `);
    columns.rows.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));
    console.log('   ...(أول 15 عمود فقط)');
  } catch (e) {
    console.log('   ❌ خطأ:', e.message);
  }

  // 4. جميع Foreign Keys
  console.log('\n📊 4. جميع Foreign Keys:');
  const fks = await client.query(`
    SELECT 
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_name as to_table,
      ccu.column_name as to_column,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name
  `);
  
  fks.rows.forEach(fk => {
    console.log(`   ${fk.from_table}.${fk.from_column} → ${fk.to_table}.${fk.to_column}`);
  });
  console.log(`\n   📈 إجمالي FKs: ${fks.rows.length}`);

  // 5. تحقق من FK لـ reviewer_profiles
  console.log('\n📊 5. FKs الخاصة بـ reviewer_profiles:');
  const reviewerFk = fks.rows.filter(fk => fk.from_table === 'reviewer_profiles');
  if (reviewerFk.length > 0) {
    reviewerFk.forEach(fk => {
      console.log(`   ✅ ${fk.from_column} → ${fk.to_table}.${fk.to_column}`);
    });
  } else {
    console.log('   ❌ لا يوجد FK!');
  }

  // 6. نوع بيانات profiles.id
  console.log('\n📊 6. نوع بيانات profiles.id:');
  try {
    const idType = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'id'
    `);
    if (idType.rows.length > 0) {
      console.log(`   ${idType.rows[0].column_name}: ${idType.rows[0].data_type} (${idType.rows[0].udt_name})`);
    }
  } catch (e) {
    console.log('   ❌ خطأ:', e.message);
  }

  // 7. عدد الجداول الإجمالي
  console.log('\n📊 7. إحصائيات قاعدة البيانات:');
  const stats = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables_count,
      (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as fk_count
  `);
  console.log(`   - عدد الجداول: ${stats.rows[0].tables_count}`);
  console.log(`   - عدد FKs: ${stats.rows[0].fk_count}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهى التحقق');
  
  await client.end();
}

verifySchema().catch(e => {
  console.error('❌ خطأ:', e.message);
  process.exit(1);
});
