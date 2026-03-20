const { PrismaClient } = require('@prisma/client');

// Direct connection string (Port 5432, Fixed Password encoding)
const connectionString = "postgresql://postgres:2453%40Final123@db.eskepcqjlxaqakutiqwc.supabase.co:5432/postgres";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString
        }
    },
    log: ['info', 'warn', 'error'],
});

async function main() {
    console.log("Testing DIRECT connection with string:", connectionString);
    try {
        await prisma.$connect();
        console.log("Successfully connected to the database (Direct).");
        // Try a simple query
        const count = await prisma.user.count();
        console.log(`Verified query. User count: ${count}`);
    } catch (e) {
        console.error("Direct Connection failed.");
        console.error("Error message:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
