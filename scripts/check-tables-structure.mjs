import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jqzpxxsrdcdgimiimbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenB4eHNyZGNkZ2ltaWltYnF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0ODI2MywiZXhwIjoyMDkwMDI0MjYzfQ.F2E-43SeIOiMi1LZwrk68yjrEHtP7XQ4vxjLef8K4W8'
);

async function checkTables() {
  console.log('🔍 فحص هيكل الجداول:\n');
  
  // Check profiles columns
  console.log('📊 أعمدة profiles:');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => console.log(`   - ${k}`));
    } else {
      console.log('   الجدول فارغ');
    }
  } catch (e) {
    console.log('   خطأ:', e.message);
  }
  
  // Check bookings columns
  console.log('\n📊 أعمدة bookings:');
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => console.log(`   - ${k}`));
    } else if (error) {
      // Try insert to see column names
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({})
        .select();
      console.log('   خطأ يوضح الأعمدة:', insertError.message);
    } else {
      console.log('   الجدول فارغ');
    }
  } catch (e) {
    console.log('   خطأ:', e.message);
  }
  
  // Check escrows columns
  console.log('\n📊 أعمدة escrows:');
  try {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .limit(1);
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => console.log(`   - ${k}`));
    } else if (error) {
      console.log('   خطأ:', error.message);
    }
  } catch (e) {
    console.log('   خطأ:', e.message);
  }
  
  // Check reviews columns
  console.log('\n📊 أعمدة reviews:');
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => console.log(`   - ${k}`));
    } else if (error) {
      console.log('   خطأ:', error.message);
    }
  } catch (e) {
    console.log('   خطأ:', e.message);
  }
  
  // Check audit_logs
  console.log('\n📊 أعمدة audit_logs:');
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => console.log(`   - ${k}: ${typeof data[0][k]}`));
    } else {
      console.log('   الجدول فارغ أو غير موجود');
    }
  } catch (e) {
    console.log('   خطأ:', e.message);
  }
}

checkTables().catch(console.error);
