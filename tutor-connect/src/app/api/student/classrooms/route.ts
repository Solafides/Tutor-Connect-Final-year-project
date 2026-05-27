import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Fetch booking-based classrooms
    const bookings = await prisma.booking.findMany({
        where: {
            studentId: studentProfile.id,
            status: 'ACCEPTED',
            isPaid: true,
        },
        orderBy: { scheduledFor: 'desc' },
        include: {
            tutor: {
                include: {
                    user: true,
                },
            },
            classroom: {
                include: {
                    resources: true,
                },
            },
        },
    });

    const classes = bookings
        .filter((booking) => booking.classroom)
        .map((booking) => {
        const classroom = booking.classroom!;

        return {
            id: classroom.id,
            bookingId: booking.id,
            title: `Class with ${booking.tutor?.fullName || 'Tutor'}`,
            tutorName: booking.tutor?.fullName || 'Tutor',
            subject: booking.subjectName || 'Tutoring Session',
            lastActive: classroom.createdAt.toLocaleString(),
            progress: 0,
            meetingLink: classroom.meetingLink || null,
            resources: (classroom.resources || []).map((resource) => ({
                id: resource.id,
                title: resource.title,
                description: resource.description,
                resourceType: resource.resourceType,
                fileUrl: resource.fileUrl,
                content: resource.content,
                uploadedAt: resource.uploadedAt.toISOString(),
            })),
        };
    });

    return NextResponse.json({ classes });
}
