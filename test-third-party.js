const { Client } = require('pg');
const https = require('https');

async function testSupabase() {
  const connectionString = 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog876737@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Supabase connected successfully!');
    await client.end();
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message);
  }
}

async function testClerk() {
  const secretKey = 'sk_test_QkDQICo45ZUFjgY7Nc5qvslHMouQLmuoDGPH9TptYR';
  
  return new Promise((resolve) => {
    const req = https.get('https://api.clerk.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Clerk API works! (HTTP ' + res.statusCode + ')');
        } else {
          console.log('❌ Clerk API error: HTTP ' + res.statusCode, data);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Clerk fetch error:', err.message);
      resolve();
    });
  });
}

(async () => {
  await testSupabase();
  await testClerk();
  process.exit();
})();
