import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { classroomId } = await request.json();

        if (!classroomId) {
            return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
        }

        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Get classroom details
        let classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
            include: {
                tutor: {
                    include: {
                        user: true,
                    },
                },
                booking: true,
                resources: true,
            },
        });

        if (!classroom) {
            classroom = await prisma.classroom.findFirst({
                where: { bookingId: classroomId },
                include: {
                    tutor: {
                        include: {
                            user: true,
                        },
                    },
                    booking: true,
                    resources: true,
                },
            });
        }

        if (!classroom) {
            return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
        }

        if (!classroom.tutorId) {
            return NextResponse.json({ error: 'Invalid classroom configuration' }, { status: 400 });
        }

        // Check if student has an active booking with this tutor
        const hasBooking = await prisma.booking.findFirst({
            where: {
                studentId: studentProfile.id,
                tutorId: classroom.tutorId,
                status: 'ACCEPTED',
                isPaid: true,
            },
        });

        if (!hasBooking) {
            return NextResponse.json(
                { error: 'You must have an active booking with this tutor to enroll in their classroom' },
                { status: 403 }
            );
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.studentEnrollment.findUnique({
            where: {
                classroomId_studentId: {
                    classroomId: classroom.id,
                    studentId: studentProfile.id,
                },
            },
        });

        if (existingEnrollment) {
            return NextResponse.json({ error: 'You are already enrolled in this classroom' }, { status: 409 });
        }

        // Create enrollment
        const enrollment = await prisma.studentEnrollment.create({
            data: {
                classroomId: classroom.id,
                studentId: studentProfile.id,
            },
            include: {
                classroom: {
                    include: {
                        tutor: {
                            include: {
                                user: true,
                            },
                        },
                        resources: true,
                    },
                },
            },
        });

        const classData = {
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
        };

        return NextResponse.json({ success: true, classroom: classData });
    } catch (error) {
        console.error('Error enrolling in classroom:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
