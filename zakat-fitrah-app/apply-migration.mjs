import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

console.log('🚀 Applying migration: 003_add_is_data_lama_to_mustahik.sql\n');
console.log('📡 Connecting to Supabase...\n');

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration file
const migrationSQL = readFileSync(
  join(__dirname, 'supabase/migrations/003_add_is_data_lama_to_mustahik.sql'),
  'utf-8'
);

// Clean SQL - remove comments and split by semicolon
const cleanSQL = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

// Execute the SQL statements one by one
const statements = [
  `ALTER TABLE mustahik ADD COLUMN IF NOT EXISTS is_data_lama BOOLEAN DEFAULT false`,
  `COMMENT ON COLUMN mustahik.is_data_lama IS 'Indicates if this mustahik was imported from previous year (true) or newly created (false)'`,
  `UPDATE mustahik SET is_data_lama = false WHERE is_data_lama IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_mustahik_is_data_lama ON mustahik(is_data_lama)`
];

console.log(`Executing ${statements.length} SQL statements...\n`);

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: statement });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.log('\n⚠️  RPC method not available. Trying alternative approach...\n');
      
      // Alternative: Print SQL for manual execution
      console.log('📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
      console.log('─'.repeat(80));
      console.log(migrationSQL);
      console.log('─'.repeat(80));
      process.exit(1);
    }
    
    console.log('   ✅ Success\n');
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    process.exit(1);
  }
}

console.log('✅ All statements executed successfully!\n');
console.log('🔍 Verifying column exists...');

// Verify the column exists by trying to select it
const { data, error } = await supabase
  .from('mustahik')
  .select('id, is_data_lama')
  .limit(1);

if (error) {
  console.error(`❌ Verification failed: ${error.message}`);
  console.log('The column may not be accessible through the API yet.');
  process.exit(1);
} else {
  console.log('✅ Column is_data_lama exists and is accessible!');
  if (data && data.length > 0) {
    console.log(`✅ Sample data: is_data_lama = ${data[0].is_data_lama}`);
  }
}

console.log('\n🎉 Migration completed successfully!');
process.exit(0);
