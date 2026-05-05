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

    const url = new URL(request.url);
    const classIds = url.searchParams.get('classIds')?.split(',') || [];

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

    const bookingClasses = bookings.map((booking) => ({
        id: booking.id,
        bookingId: booking.id,
        title: booking.subjectName || `Classroom ${booking.id.slice(0, 6)}`,
        subject: booking.subjectName || 'Tutoring Session',
        tutorName: booking.tutor?.fullName || booking.tutor?.user?.email || 'Verified Tutor',
        lastActive: booking.scheduledFor ? new Date(booking.scheduledFor).toLocaleString() : 'Just now',
        progress: 0,
        meetingLink: booking.classroom?.meetingLink || null,
        resources: (booking.classroom?.resources || []).map((resource) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description,
            resourceType: resource.resourceType,
            fileUrl: resource.fileUrl,
            content: resource.content,
            uploadedAt: resource.uploadedAt.toISOString(),
        })),
    }));

    // Fetch tutor-created classrooms by IDs
    const tutorClasses = [];
    if (classIds.length > 0) {
        const classrooms = await prisma.classroom.findMany({
            where: {
                id: { in: classIds },
                tutorId: { not: null }, // Only tutor-created classrooms
            },
            include: {
                resources: true,
                tutor: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        for (const classroom of classrooms) {
            tutorClasses.push({
                id: classroom.id,
                bookingId: null,
                title: classroom.title || `Classroom ${classroom.id.slice(0, 6)}`,
                subject: classroom.subject || 'Tutoring Session',
                tutorName: classroom.tutor?.fullName || classroom.tutor?.user?.email || 'Verified Tutor',
                lastActive: classroom.createdAt.toLocaleString(),
                progress: 0,
                meetingLink: classroom.meetingLink || null,
                resources: classroom.resources.map((resource) => ({
                    id: resource.id,
                    title: resource.title,
                    description: resource.description,
                    resourceType: resource.resourceType,
                    fileUrl: resource.fileUrl,
                    content: resource.content,
                    uploadedAt: resource.uploadedAt.toISOString(),
                })),
            });
        }
    }

    const classes = [...bookingClasses, ...tutorClasses];

    return NextResponse.json({ classes });
}
