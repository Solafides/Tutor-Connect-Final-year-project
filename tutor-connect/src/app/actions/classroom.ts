"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ClassroomData = {
    id: string;
    title: string; // Now we have title in DB
    subject: string; // And subject
    students: number;
    lastActive: string;
    progress: number;
    color: string;
    // Add other fields from UI mock if needed
};

// Map Prisma Classroom to UI Classroom
function mapClassroom(cls: any): ClassroomData {
    return {
        id: cls.id,
        title: cls.title || cls.booking?.subjectName || "Untitled Classroom",
        subject: cls.subject || cls.booking?.subjectName || "General",
        students: cls.booking ? 1 : (cls.students || 0), // Use real count if available
        lastActive: "Just now", // Placeholder
        progress: 0, // Placeholder
        color: "bg-emerald-500", // Placeholder
    };
}

export async function getClassrooms() {
    const session = await auth();
    if (!session?.user || session.user.role !== "TUTOR") {
        return [];
    }

    const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!tutor) return [];

    const classrooms = await prisma.classroom.findMany({
        where: {
            booking: { tutorId: tutor.id }
        },
        include: { booking: true },
        orderBy: { createdAt: "desc" },
    });

    return classrooms.map(mapClassroom);
}

export async function createClassroom(formData: FormData) {
    return { error: "Not implemented. Classroom creation requires a booking ID." };
}
