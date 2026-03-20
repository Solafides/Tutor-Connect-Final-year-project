const { PrismaClient } = require('@prisma/client');

const connectionString = "postgresql://postgres.eskepcqjlxaqakutiqwc:2453%40Final123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString
        }
    },
    log: ['info', 'warn', 'error', 'query'],
});

async function main() {
    console.log("Testing connection with string (Port 5432):", connectionString);
    try {
        await prisma.$connect();
        console.log("Successfully connected to the database on Port 5432.");
        const userCount = await prisma.user.count();
        console.log("User count:", userCount);
    } catch (e) {
        console.error("Connection failed.");
        console.error("Error message:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
