const { Client } = require('pg');
const fs = require('fs');

const testStrings = {
  'Direct (Old Password)': 'postgresql://postgres:sahyog%40890@db.kzxjhjkauvsoipvlusjo.supabase.co:5432/postgres',
  'Direct (New Password)': 'postgresql://postgres:sahyog876737@db.kzxjhjkauvsoipvlusjo.supabase.co:5432/postgres',
  'Pooler 5432 (Old Password)': 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog%40890@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  'Pooler 6543 (Old Password)': 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog%40890@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  'Pooler 5432 (New Password)': 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog876737@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  'Pooler 6543 (New Password)': 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog876737@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
};

async function checkAll() {
  let log = '';
  for (const [name, connectionString] of Object.entries(testStrings)) {
    log += `Testing ${name}...\n`;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      log += `✅ SUCCESS: ${name}\n`;
      const res = await client.query('SELECT NOW()');
      log += `Data: ${res.rows[0].now}\n\n`;
      await client.end();
      // Write to .env successfully!
      fs.writeFileSync('.env', fs.readFileSync('.env', 'utf8').replace(/DATABASE_URL=.*/, `DATABASE_URL=${connectionString}`));
      fs.writeFileSync('../sahyog-web/.env', fs.readFileSync('../sahyog-web/.env', 'utf8').replace(/DATABASE_URL=.*/, `DATABASE_URL=${connectionString}`));
      log += 'Patched .env files because we found a working connection!\n';
    } catch (err) {
      log += `❌ ERROR: ${err.message}\n\n`;
      try { await client.end(); } catch (e) {}
    }
  }
  fs.writeFileSync('test-output.txt', log);
}

checkAll().catch(err => fs.writeFileSync('test-output.txt', err.message));
