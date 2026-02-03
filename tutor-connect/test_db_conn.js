const { PrismaClient } = require('@prisma/client');

// Using the exact string found in .env
const connectionString = "postgresql://postgres.eskepcqjlxaqakutiqwc:2453%40Final123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString
        }
    },
    log: ['info', 'warn', 'error'],
});

async function main() {
    console.log("Testing connection with string:", connectionString);
    try {
        await prisma.$connect();
        console.log("Successfully connected to the database.");
    } catch (e) {
        console.error("Connection failed.");
        console.error("Error message:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
