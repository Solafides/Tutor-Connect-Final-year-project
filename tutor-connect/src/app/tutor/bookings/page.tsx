// app/tutor/bookings/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default async function TutorBookingsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TUTOR') {
        redirect('/login');
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!tutorProfile) redirect('/tutor/profile');

    // Fetch all bookings for this tutor
    const bookings = await prisma.booking.findMany({
        where: { tutorId: tutorProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
            student: {
                include: { user: true },
            },
        },
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
                    <p className="mt-2 text-slate-600">Manage your upcoming and past tutoring sessions.</p>
                </div>

                <div className="rounded-xl bg-white shadow-sm border border-slate-200">
                    {bookings.length === 0 ? (
                        // EMPTY STATE UI
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                                calendar_today
                            </span>
                            <h3 className="text-xl font-semibold text-slate-700">No active bookings currently</h3>
                            <p className="text-slate-500 mt-2 text-center max-w-md">
                                You don't have any booking requests yet. Make sure your availability is set and your profile is verified to attract students!
                            </p>
                            <Link href="/tutor/dashboard" className="mt-6 text-primary font-medium hover:underline">
                                ← Back to Dashboard
                            </Link>
                        </div>
                    ) : (
                        // LIST OF BOOKINGS
                        <div className="divide-y divide-slate-200">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {booking.subjectName}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Student: <span className="font-medium text-slate-800">{booking.student.fullName}</span>
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Scheduled for: {new Date(booking.scheduledFor).toLocaleDateString()} at {new Date(booking.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Duration: {booking.duration} mins • Mode: {booking.tutoringMode || 'Virtual'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:items-end gap-2">
                                        <p className="text-lg font-bold text-slate-900">
                                            {Number(booking.tutorEarning).toFixed(2)} ETB
                                        </p>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/tutor/bookings/${booking.id}`}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                                            >
                                                View Details
                                            </Link>
                                            {booking.status === 'PENDING' && (
                                                <Link
                                                    href={`/tutor/bookings/${booking.id}`}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
                                                >
                                                    Respond
                                                </Link>
                                            )}
                                        </div>
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