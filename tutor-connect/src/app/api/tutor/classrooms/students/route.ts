import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tutor = await prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
        }

        const url = new URL(request.url);
        const classroomId = url.searchParams.get('classroomId');

        if (!classroomId) {
            return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
        }

        // Verify classroom belongs to tutor
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
        });

        if (!classroom || classroom.tutorId !== tutor.id) {
            return NextResponse.json({ error: 'Classroom not found or access denied' }, { status: 404 });
        }

        // Get enrolled students
        const enrollments = await prisma.studentEnrollment.findMany({
            where: { classroomId },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });

        const students = enrollments.map((enrollment) => ({
            enrollmentId: enrollment.id,
            studentId: enrollment.student.id,
            userId: enrollment.student.userId,
            email: enrollment.student.user.email,
            fullName: enrollment.student.fullName,
            phone: enrollment.student.phone,
            gradeLevel: enrollment.student.gradeLevel,
            locationCity: enrollment.student.locationCity,
            locationArea: enrollment.student.locationArea,
            avatar: enrollment.student.avatar,
            enrolledAt: enrollment.enrolledAt.toISOString(),
        }));

        return NextResponse.json({ students });
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'TUTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tutor = await prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
        }

        const url = new URL(request.url);
        const enrollmentId = url.searchParams.get('enrollmentId');
        const classroomId = url.searchParams.get('classroomId');

        if (!enrollmentId || !classroomId) {
            return NextResponse.json({ error: 'Enrollment ID and Classroom ID are required' }, { status: 400 });
        }

        // Verify classroom belongs to tutor
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
        });

        if (!classroom || classroom.tutorId !== tutor.id) {
            return NextResponse.json({ error: 'Classroom not found or access denied' }, { status: 404 });
        }

        // Verify enrollment belongs to classroom
        const enrollment = await prisma.studentEnrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment || enrollment.classroomId !== classroomId) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        // Delete enrollment
        await prisma.studentEnrollment.delete({
            where: { id: enrollmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing student from classroom:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
