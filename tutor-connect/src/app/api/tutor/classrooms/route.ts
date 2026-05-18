import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== 'TUTOR') {
        return NextResponse.json({ classes: [] }, { status: 401 });
    }

    const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!tutor) {
        return NextResponse.json({ classes: [] });
    }

    // Find all accepted bookings for this tutor
    const bookings = await prisma.booking.findMany({
        where: {
            tutorId: tutor.id,
            status: 'ACCEPTED',
        },
        include: {
            student: true,
            classroom: {
                include: {
                    enrollments: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    const classes = await Promise.all(bookings.map(async (booking) => {
        let classroom = booking.classroom;
        
        // Auto-create classroom if it doesn't exist
        if (!classroom) {
            classroom = await prisma.classroom.create({
                data: {
                    bookingId: booking.id,
                    tutorId: tutor.id,
                    title: `${booking.subjectName} with ${booking.student.fullName}`,
                    subject: booking.subjectName,
                },
                include: {
                    enrollments: true
                }
            });
            
            // Auto-enroll the student
            await prisma.studentEnrollment.create({
                data: {
                    classroomId: classroom.id,
                    studentId: booking.studentId,
                }
            });
        }
        
        return {
            id: classroom.id,
            bookingId: booking.id,
            title: `Class with ${booking.student.fullName}`,
            studentName: booking.student.fullName,
            subject: booking.subjectName,
            students: 1, // It's a 1-on-1 class
            lastActive: classroom.createdAt.toLocaleString(),
            progress: 0,
        };
    }));

    return NextResponse.json({ classes });
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tutor = await prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
        }

        const { classId, title, subject, chapters, assignments } = await request.json();

        // Find or create classroom
        let classroom = await prisma.classroom.findFirst({
            where: { id: classId },
        });

        if (!classroom) {
            classroom = await prisma.classroom.create({
                data: {
                    id: classId,
                    tutorId: tutor.id,
                    title,
                    subject,
                },
            });
        }

        // Save chapters as resources
        if (chapters && chapters.length > 0) {
            for (const chapter of chapters) {
                await prisma.classroomResource.upsert({
                    where: { id: chapter.id },
                    update: {
                        title: chapter.title,
                        content: chapter.content,
                        fileUrl: chapter.fileUrl,
                        fileName: chapter.fileName,
                    },
                    create: {
                        classroomId: classroom.id,
                        tutorId: tutor.id,
                        resourceType: 'chapter',
                        title: chapter.title,
                        content: chapter.content,
                        fileUrl: chapter.fileUrl,
                        fileName: chapter.fileName,
                    },
                });
            }
        }

        // Save assignments as resources
        if (assignments && assignments.length > 0) {
            for (const assignment of assignments) {
                await prisma.classroomResource.upsert({
                    where: { id: assignment.id },
                    update: {
                        title: assignment.title,
                        content: assignment.content,
                        fileUrl: assignment.fileUrl,
                        fileName: assignment.fileName,
                    },
                    create: {
                        classroomId: classroom.id,
                        tutorId: tutor.id,
                        resourceType: 'assignment',
                        title: assignment.title,
                        content: assignment.content,
                        fileUrl: assignment.fileUrl,
                        fileName: assignment.fileName,
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving classroom:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    return NextResponse.json({ error: 'Classrooms cannot be manually deleted in 1-on-1 mode.' }, { status: 400 });
}