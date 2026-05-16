const { Client } = require('pg');

const dbUrl = "postgresql://postgres.eskepcqjlxaqakutiqwc:2453%40Final123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({
  connectionString: dbUrl,
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase successfully via pg!");
    await client.end();
  } catch (err) {
    console.error("Connection failed with error:");
    console.error(err);
  }
}

main();
