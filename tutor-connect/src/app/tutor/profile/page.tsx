import { redirect } from 'next/navigation';
import { auth } from '@/auth';
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

    // Fetch tutor profile and all subjects safely
    const [tutorProfile, allSubjects] = await Promise.all([
        prisma.tutorProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                subjects: true,
            },
        }),
        prisma.subject.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!tutorProfile) {
        // Technically, a profile should be created upon sign up,
        // but if it's not, we shouldn't throw an unhandled 500 error here.
        redirect('/login');
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
