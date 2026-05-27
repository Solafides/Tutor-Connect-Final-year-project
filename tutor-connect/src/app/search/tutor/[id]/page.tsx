import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

function formatDay(day: string) {
    return day.charAt(0) + day.slice(1).toLowerCase();
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TutorProfilePage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    const tutor = await prisma.tutorProfile.findUnique({
        where: { id, verificationStatus: 'APPROVED' },
        include: {
            user: true,
            subjects: { include: { subject: true } },
            availability: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
            reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { student: true }
            }
        }
    });

    if (!tutor) {
        notFound();
    }

    const availabilityByDay = DAY_ORDER.map((day) => ({
        day,
        slots: tutor.availability.filter((slot) => slot.dayOfWeek === day)
    })).filter((entry) => entry.slots.length > 0);

    const canBook = session?.user?.role === 'STUDENT';
    const rating = tutor.rating ? Number(tutor.rating).toFixed(1) : 'New';

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <Link href="/search" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to search
                </Link>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                            {tutor.avatar ? (
                                <img src={tutor.avatar} alt={tutor.fullName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-emerald-600 text-4xl">person</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900">{tutor.fullName}</h1>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-base">star</span>
                                    {rating} ({tutor.totalReviews} reviews)
                                </span>
                                <span>{Number(tutor.hourlyRate).toFixed(0)} ETB / hour</span>
                                {tutor.locationCity && <span>{tutor.locationCity}</span>}
                            </div>
                            {tutor.bio && <p className="mt-4 text-slate-600 leading-relaxed">{tutor.bio}</p>}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {tutor.subjects.map((entry) => (
                                    <span key={entry.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                        {entry.subject.name}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-6">
                                {canBook ? (
                                    <Link href={`/book/create?tutorId=${tutor.id}`} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                                        Book Session
                                    </Link>
                                ) : (
                                    <Link href={`/login?callbackUrl=/search/tutor/${tutor.id}`} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                                        Sign in to Book
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Weekly Availability</h2>
                    <p className="text-sm text-slate-500 mb-6">Times when this tutor is available for sessions.</p>
                    {availabilityByDay.length === 0 ? (
                        <p className="text-slate-500 text-sm">This tutor has not set their availability yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {availabilityByDay.map(({ day, slots }) => (
                                <div key={day} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3">{formatDay(day)}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {slots.map((slot) => (
                                            <span key={slot.id} className="inline-flex items-center rounded-xl bg-white border border-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}