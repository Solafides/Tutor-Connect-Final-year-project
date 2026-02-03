const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'tebarekzed2453@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, role: true }
    });
    console.log('User Role Check:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
