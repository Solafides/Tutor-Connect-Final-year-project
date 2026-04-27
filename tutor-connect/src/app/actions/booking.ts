'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { bookingSchema } from '@/lib/validations';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createBooking(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
        throw new Error('Unauthorized');
    }

    const data = {
        tutorId: formData.get('tutorId') as string,
        subjectName: formData.get('subjectName') as string,
        scheduledFor: formData.get('scheduledFor') as string,
        duration: parseInt(formData.get('duration') as string),
        notes: formData.get('notes') as string || undefined,
    };

    const result = bookingSchema.safeParse(data);
    if (!result.success) {
        throw new Error('Invalid booking data');
    }

    const { tutorId, subjectName, scheduledFor, duration, notes } = result.data;

    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId }
    });

    if (!tutor) {
        throw new Error('Tutor not found');
    }

    const studentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { studentProfile: true }
    });

    const studentId = studentUser?.studentProfile?.id;

    if (!studentId) {
        throw new Error('Student profile not found');
    }

    // calculate amounts
    const hourlyRate = Number(tutor.hourlyRate);
    const hours = duration / 60;
    const totalAmount = hourlyRate * hours;
    const platformFee = totalAmount * 0.1; // 10% fee
    const tutorEarning = totalAmount - platformFee;

    const booking = await prisma.booking.create({
        data: {
            tutorId,
            studentId,
            subjectName,
            scheduledFor: new Date(scheduledFor),
            duration,
            notes,
            totalAmount,
            platformFee,
            tutorEarning,
            status: 'PENDING',
            isPaid: false,
        }
    });

    redirect(`/student/bookings`);
}
