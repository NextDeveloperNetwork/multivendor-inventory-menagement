const { Client } = require('pg');
const fs = require('fs');

async function test() {
  console.log('Reading .env...');
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatches = env.match(/DATABASE_URL=(.*)/);
  if (!urlMatches) {
    console.error('DATABASE_URL not found in .env');
    return;
  }
  const url = urlMatches[1].trim();
  console.log('Testing Raw Connection...');
  
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connection Successful!');
    const res = await client.query('SELECT NOW()');
    console.log('🕒 DB Time:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error(err);
  }
}

test();
