const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER PUBLICATION supabase_realtime ADD TABLE messages;');
    console.log('Successfully added messages table to supabase_realtime publication');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('already part of publication')) {
        console.log('Table already in publication.');
    } else {
        console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
