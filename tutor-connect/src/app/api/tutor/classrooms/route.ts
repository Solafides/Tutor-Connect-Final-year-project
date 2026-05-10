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

    const classrooms = await prisma.classroom.findMany({
        where: {
            OR: [
                { tutorId: tutor.id },
                { booking: { tutorId: tutor.id } },
            ],
        },
        include: {
            booking: true,
            enrollments: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const classes = classrooms.map((cls) => ({
        id: cls.id,
        title: cls.title || cls.booking?.subjectName || 'Untitled Classroom',
        subject: cls.subject || cls.booking?.subjectName || 'General',
        students: cls.enrollments?.length || 0,
        lastActive: cls.createdAt.toLocaleString(),
        progress: 0,
        bookingId: cls.bookingId || null,
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

    const classroomId = request.nextUrl.searchParams.get('id');
    if (!classroomId) {
        return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
    }

    const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
    });

    if (!classroom || classroom.tutorId !== tutor.id) {
        return NextResponse.json({ error: 'Classroom not found or access denied' }, { status: 404 });
    }

    await prisma.classroom.delete({
        where: { id: classroomId },
    });

    return NextResponse.json({ success: true });
}