const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('classrooms','student_enrollments');"
    );
    console.log('tables:\n', JSON.stringify(tables, null, 2));

    const classrooms = await prisma.$queryRawUnsafe(
      "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='classrooms';"
    );
    console.log('classrooms:\n', JSON.stringify(classrooms, null, 2));

    const enrollments = await prisma.$queryRawUnsafe(
      "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='student_enrollments';"
    );
    console.log('student_enrollments:\n', JSON.stringify(enrollments, null, 2));

    const bookings = await prisma.$queryRawUnsafe(
      "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings';"
    );
    console.log('bookings:\n', JSON.stringify(bookings, null, 2));

    const students = await prisma.$queryRawUnsafe(
      "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='student_profiles';"
    );
    console.log('student_profiles:\n', JSON.stringify(students, null, 2));

    const dup = await prisma.$queryRawUnsafe(
      "SELECT booking_id, count(*) FROM classrooms GROUP BY booking_id HAVING count(*) > 1;"
    );
    console.log('duplicate_booking_ids:\n', JSON.stringify(dup, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();