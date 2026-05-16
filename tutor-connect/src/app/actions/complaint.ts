'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function submitComplaint(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
        throw new Error('Unauthorized');
    }

    const bookingId = formData.get('bookingId') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;

    if (!bookingId || !subject || !description) {
        throw new Error('Missing required fields');
    }

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!studentProfile) {
        throw new Error('Student profile not found');
    }

    // Verify booking belongs to student
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId, studentId: studentProfile.id }
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    // Check if complaint already exists
    const existingComplaint = await prisma.complaint.findUnique({
        where: { bookingId: booking.id }
    });

    if (existingComplaint) {
        throw new Error('A complaint has already been filed for this booking');
    }

    await prisma.complaint.create({
        data: {
            bookingId: booking.id,
            complainant: studentProfile.fullName,
            subject: subject,
            description: description,
            status: 'OPEN'
        }
    });

    redirect('/student/bookings');
}
