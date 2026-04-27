import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ConfirmLessonButton from '@/components/ConfirmLessonButton';
import { payForBooking } from '@/app/actions/payment';

export default async function StudentBookingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/');
    }

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!studentProfile) {
        redirect('/register');
    }

    const bookings = await prisma.booking.findMany({
        where: { studentId: studentProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
            tutor: {
                include: {
                    user: true,
                },
            },
        },
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
                <p className="mt-2 text-slate-600">
                    View and manage all your tutoring sessions.
                </p>
            </div>

            <div className="rounded-xl bg-white shadow-sm border border-slate-200">
                <div className="divide-y divide-slate-200">
                    {bookings.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">
                                event_busy
                            </span>
                            <p className="text-slate-600">You have no bookings yet.</p>
                            <Link
                                href="/search"
                                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                                Find a Tutor
                            </Link>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div key={booking.id} className="px-6 py-6 sm:flex sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="text-lg font-medium text-slate-900">
                                        {booking.subjectName} with {booking.tutor.fullName}
                                    </h3>
                                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6 text-sm text-slate-600">
                                        <p className="flex items-center">
                                            <span className="material-symbols-outlined text-sm mr-1.5 text-slate-400">calendar_today</span>
                                            {new Date(booking.scheduledFor).toLocaleDateString()} at {new Date(booking.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="mt-2 sm:mt-0 flex items-center">
                                            <span className="material-symbols-outlined text-sm mr-1.5 text-slate-400">schedule</span>
                                            {booking.duration} minutes
                                        </p>
                                        <p className="mt-2 sm:mt-0 flex items-center">
                                            <span className="material-symbols-outlined text-sm mr-1.5 text-slate-400">payments</span>
                                            {Number(booking.totalAmount).toFixed(2)} ETB
                                        </p>
                                    </div>
                                    {/* Removed meeting link conditionally since schema shows classroom? instead of meetingLink string */}
                                </div>
                                <div className="flex flex-col items-end space-y-3">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                            booking.status === 'ACCEPTED'
                                                ? 'bg-green-100 text-green-800'
                                                : booking.status === 'COMPLETED'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : booking.status === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {booking.status}
                                    </span>
                                    {booking.status === 'ACCEPTED' && !booking.isPaid && (
                                        <form action={payForBooking.bind(null, booking.id)}>
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                                            >
                                                Pay Now
                                            </button>
                                        </form>
                                    )}
                                    {booking.status === 'ACCEPTED' && booking.isPaid && (
                                        <ConfirmLessonButton bookingId={booking.id} />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
