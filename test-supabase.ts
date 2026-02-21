// Test Supabase connection
import { Pool } from 'pg';

const PROJECT_REF = 'udytiwrvryssiwbekzxj';
const PASSWORD = encodeURIComponent('#Abolaji7977');

// Test direct connection (port 5432)
const directUrl = `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

// Test different pooler regions
const regions = [
  'aws-0-us-east-1',
  'aws-0-us-west-1', 
  'aws-0-eu-west-1',
  'aws-0-eu-central-1',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-ap-south-1',
  'aws-0-sa-east-1',
];

async function testConnection(name: string, url: string): Promise<boolean> {
  console.log(`\nTesting ${name}...`);
  console.log(`URL pattern: ${url.substring(0, 50)}...`);
  
  const pool = new Pool({
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    console.log(`✓ ${name} - SUCCESS! Server time: ${result.rows[0].now}`);
    return true;
  } catch (error: any) {
    await pool.end();
    console.log(`✗ ${name} - FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Testing Supabase Connections ===');
  console.log(`Project: ${PROJECT_REF}`);
  
  // Test direct connection first
  const directSuccess = await testConnection('Direct Connection (port 5432)', directUrl);
  
  if (directSuccess) {
    console.log('\n✓ Direct connection works! This can be used for DIRECT_DATABASE_URL');
  }

  // Test pooler connections
  console.log('\n--- Testing Pooler Regions ---');
  for (const region of regions) {
    const poolerUrl = `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${region}.pooler.supabase.com:6543/postgres`;
    const success = await testConnection(`Pooler ${region}`, poolerUrl);
    if (success) {
      console.log(`\n✓ Found working pooler region: ${region}`);
      console.log(`Pooler URL: ${poolerUrl}`);
      break;
    }
    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== Connection Test Complete ===');
  process.exit(0);
}

main().catch(console.error);
