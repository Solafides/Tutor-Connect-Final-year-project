import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { BookingForm } from '@/components/BookingForm';
import { Navigation } from '@/components/Navigation';
import { UserRole } from '@prisma/client';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookSessionPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const session = await auth();

    const tutorId = typeof searchParams.tutorId === 'string' ? searchParams.tutorId : undefined;

    if (!session?.user) {
        if (tutorId) {
            redirect(`/login?callbackUrl=/book/create?tutorId=${tutorId}`);
        } else {
            redirect(`/login?callbackUrl=/search`);
        }
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/search');
    }

    if (!tutorId) {
        redirect('/search');
    }

    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
        include: {
            user: true,
            subjects: {
                include: {
                    subject: true,
                }
            }
        }
    });

    if (!tutor) {
        redirect('/search');
    }

    const userName = (session.user as any).name || (session.user as any).fullName || undefined;

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Book a Session</h1>
                    <p className="mt-2 text-slate-600">
                        Schedule a tutoring session with <span className="font-semibold text-slate-900">{tutor.fullName}</span>
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                    <div>
                        <BookingForm 
                            tutorId={tutor.id}
                            tutorName={tutor.fullName}
                            hourlyRate={Number(tutor.hourlyRate)}
                            subjects={tutor.subjects.map((s: any) => ({
                                id: s.subject.id,
                                name: s.subject.name
                            }))}
                        />
                    </div>

                    <div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                            <h3 className="font-semibold text-slate-900 mb-4">Tutor Details</h3>
                            
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {tutor.avatar ? (
                                        <img src={tutor.avatar} alt={tutor.fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-emerald-600">person</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">{tutor.fullName}</h4>
                                    <p className="text-sm text-slate-500">{Number(tutor.hourlyRate)} ETB / hour</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="material-symbols-outlined text-base">school</span>
                                    <span>{tutor.subjects.length} Subjects</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="material-symbols-outlined text-base">
                                        {tutor.tutoringMode === 'VIRTUAL' ? 'videocam' : 
                                         tutor.tutoringMode === 'IN_PERSON' ? 'home' : 'cast'}
                                    </span>
                                    <span>
                                        {tutor.tutoringMode === 'VIRTUAL' ? 'Virtual' : 
                                         tutor.tutoringMode === 'IN_PERSON' ? 'In-person' : 'Both types'}
                                    </span>
                                </div>
                                {tutor.locationCity && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <span className="material-symbols-outlined text-base">location_on</span>
                                        <span>{tutor.locationCity}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
