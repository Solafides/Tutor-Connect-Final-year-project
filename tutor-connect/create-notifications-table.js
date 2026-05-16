const { Client } = require('pg');

const dbUrl = "postgresql://postgres.eskepcqjlxaqakutiqwc:2453%40Final123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({
  connectionString: dbUrl,
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase successfully via pg!");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "notifications" (
          "id" TEXT NOT NULL,
          "user_id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "is_read" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await client.query(createTableQuery);
    console.log("Table 'notifications' created (or already exists).");

    try {
      await client.query(`CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");`);
      console.log("Index 'notifications_user_id_idx' created.");
    } catch (e) {
      console.log("Index 'notifications_user_id_idx' might already exist.");
    }
    
    try {
      await client.query(`CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");`);
      console.log("Index 'notifications_is_read_idx' created.");
    } catch (e) {
      console.log("Index 'notifications_is_read_idx' might already exist.");
    }
    
    try {
      await client.query(`
        ALTER TABLE "notifications" 
        ADD CONSTRAINT "notifications_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("Foreign key constraint added.");
    } catch (e) {
      console.log("Foreign key constraint might already exist.");
    }

    console.log("Database schema successfully synchronized!");
    
  } catch (err) {
    console.error("Failed with error:");
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
