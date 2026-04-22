'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { tutorProfileSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function updateTutorProfile(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TUTOR') {
        throw new Error('Unauthorized');
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!tutorProfile) {
        throw new Error('Tutor profile not found');
    }

    const data = {
        fullName: formData.get('fullName') as string,
        phone: formData.get('phone') as string || undefined,
        bio: formData.get('bio') as string || undefined,
        hourlyRate: Number(formData.get('hourlyRate')),
        gender: formData.get('gender') as any || undefined,
        locationCity: formData.get('locationCity') as string || undefined,
        locationArea: formData.get('locationArea') as string || undefined,
        tutoringMode: formData.get('tutoringMode') as any,
    };

    const subjectIds = formData.getAll('subjects') as string[];

    const result = tutorProfileSchema.safeParse(data);

    if (!result.success) {
        const errorMessages = result.error.errors.map(err => err.message).join(', ');
        throw new Error(`Profile validation failed: ${errorMessages}`);
    }

    // Update the profile and subjects inside a transaction
    await prisma.$transaction(async (tx) => {
        // 1. Update basic profile info
        await tx.tutorProfile.update({
            where: { id: tutorProfile.id },
            data: {
                ...result.data,
            }
        });

        // 2. Clear old subjects
        await tx.tutorSubject.deleteMany({
            where: { tutorId: tutorProfile.id }
        });

        // 3. Insert new subjects
        if (subjectIds.length > 0) {
            await tx.tutorSubject.createMany({
                data: subjectIds.map((subjectId) => ({
                    tutorId: tutorProfile.id,
                    subjectId,
                }))
            });
        }
    });

    revalidatePath('/tutor/dashboard');
    revalidatePath('/tutor/profile');
    revalidatePath('/search');

    return { success: true };
}
