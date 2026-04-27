const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tutors = await prisma.tutorProfile.findMany({ include: { subjects: { include: { subject: true } } } });
    console.dir(tutors, {depth: null});
}
main().catch(console.error).finally(() => prisma.$disconnect());
