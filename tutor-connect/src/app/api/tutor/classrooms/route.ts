import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
                    tutorId: session.user.id,
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
                        tutorId: session.user.id,
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
                        tutorId: session.user.id,
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