const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.kzxjhjkauvsoipvlusjo:sahyog876737@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('Connected to DB');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log(res.rows);
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.message);
    client.end();
  });
