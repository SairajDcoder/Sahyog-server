require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    await client.connect();
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '03_civic_issues_workflow.sql'), 'utf-8');
        console.log('Executing civic issues migration...');
        await client.query(sql);
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
