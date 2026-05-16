const { Client } = require('pg');

const dbUrl = "postgresql://postgres.eskepcqjlxaqakutiqwc:2453%40Final123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({
  connectionString: dbUrl,
});

async function main() {
  await client.connect();
  
  console.log("Creating Notification table...");
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications"("is_read");
  `);

  console.log("Table created.");
  await client.end();
}

main().catch(console.error);
