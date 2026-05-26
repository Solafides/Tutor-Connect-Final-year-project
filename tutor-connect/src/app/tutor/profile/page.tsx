import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import { TutorProfileForm } from '@/components/TutorProfileForm';

export default async function TutorProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'TUTOR') {
        redirect('/');
    }

    let [tutorProfile, allSubjects] = await Promise.all([
        prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                subjects: true,
                availability: true,
            },
        }),
        prisma.subject.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!tutorProfile) {
        // Check if the user still exists in the database (handles stale JWT sessions after a DB reset)
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!userExists) {
            await signOut({ redirectTo: '/login' });
        }

        // Technically, a profile should be created upon sign up,
        // but if it's missing, create it to prevent an infinite redirect loop.
        tutorProfile = await prisma.tutorProfile.create({
            data: {
                userId: session.user.id,
                fullName: session.user.name || session.user.email?.split('@')[0] || 'Tutor',
                hourlyRate: 0,
                verificationStatus: 'PENDING',
            },
            include: {
                subjects: true,
                availability: true,
            },
        });
        
        // Also ensure wallet exists
        await prisma.wallet.upsert({
            where: { userId: session.user.id },
            update: {},
            create: { userId: session.user.id },
        });
    }

    const selectedSubjectIds = tutorProfile.subjects.map(ts => ts.subjectId);

    return (
        <DashboardLayout>
            <div className="space-y-6 py-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Update Profile</h1>
                    <p className="mt-2 text-slate-600">
                        Adjust your hourly rate, subjects, and bio to attract more students.
                    </p>
                </div>

                <div className="mt-8">
                    <TutorProfileForm 
                        profile={tutorProfile} 
                        allSubjects={allSubjects} 
                        selectedSubjectIds={selectedSubjectIds} 
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
