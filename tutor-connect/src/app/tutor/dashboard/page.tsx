import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default async function TutorDashboardPage() {
    const session = await auth();
    
    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'TUTOR') {
        redirect('/landing');
    }

    // Fetch tutor profile first
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            subjects: {
                include: {
                    subject: true,
                },
            },
        },
    });

    if (!tutorProfile) {
        redirect('/tutor/profile');
    }

    // Fetch tutor data
    const [wallet, recentBookings, pendingBookings] = await Promise.all([
        prisma.wallet.findUnique({
            where: { userId: session.user.id },
            include: {
                transactions: {
                    where: {
                        type: 'PAYMENT',
                    },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        }),
        prisma.booking.findMany({
            where: { tutorId: tutorProfile.id },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        }),
        prisma.booking.findMany({
            where: { 
                tutorId: tutorProfile.id,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        }),
    ]);

    const totalEarnings = wallet?.transactions
        .filter(t => t.type === 'PAYMENT')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const availableBalance = wallet ? Number(wallet.balance) : 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome back, {tutorProfile.fullName}!
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Manage your bookings, earnings, and tutoring sessions.
                    </p>
                </div>

                {/* Verification Status */}
                {tutorProfile.verificationStatus !== 'APPROVED' && (
                    <div className={`rounded-xl p-4 border-2 ${
                        tutorProfile.verificationStatus === 'PENDING'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    {tutorProfile.verificationStatus === 'PENDING' 
                                        ? 'Verification Pending' 
                                        : 'Verification Rejected'}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    {tutorProfile.verificationStatus === 'PENDING'
                                        ? 'Your profile is under review. You can still update your profile.'
                                        : tutorProfile.rejectionReason || 'Your verification was rejected. Please update your profile and resubmit.'}
                                </p>
                            </div>
                            <Link
                                href="/tutor/profile"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                            >
                                Update Profile
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Available Balance</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {availableBalance.toFixed(2)} ETB
                                </p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <span className="material-symbols-outlined text-primary text-2xl">
                                    account_balance_wallet
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/tutor/wallet"
                            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
                        >
                            Withdraw earnings →
                        </Link>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Earnings</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {totalEarnings.toFixed(2)} ETB
                                </p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3">
                                <span className="material-symbols-outlined text-green-600 text-2xl">
                                    trending_up
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Pending Requests</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {pendingBookings.length}
                                </p>
                            </div>
                            <div className="rounded-full bg-yellow-100 p-3">
                                <span className="material-symbols-outlined text-yellow-600 text-2xl">
                                    pending
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/tutor/bookings"
                            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
                        >
                            Review requests →
                        </Link>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Hourly Rate</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {Number(tutorProfile.hourlyRate).toFixed(0)} ETB
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3">
                                <span className="material-symbols-outlined text-blue-600 text-2xl">
                                    attach_money
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/tutor/profile"
                            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
                        >
                            Update rate →
                        </Link>
                    </div>
                </div>

                {/* Pending Bookings Alert */}
                {pendingBookings.length > 0 && (
                    <div className="rounded-xl bg-white shadow-sm border border-slate-200">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Pending Booking Requests ({pendingBookings.length})
                                </h2>
                                <Link
                                    href="/tutor/bookings"
                                    className="text-sm font-medium text-primary hover:text-primary-dark"
                                >
                                    View all →
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-200">
                            {pendingBookings.slice(0, 3).map((booking) => (
                                <div key={booking.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">
                                                {booking.subjectName} - {booking.student.fullName}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {new Date(booking.scheduledFor).toLocaleDateString()} • {booking.duration} minutes
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-900">
                                                {Number(booking.tutorEarning).toFixed(2)} ETB
                                            </p>
                                            <Link
                                                href={`/tutor/bookings/${booking.id}`}
                                                className="mt-2 inline-block rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                                            >
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Bookings */}
                <div className="rounded-xl bg-white shadow-sm border border-slate-200">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
                            <Link
                                href="/tutor/bookings"
                                className="text-sm font-medium text-primary hover:text-primary-dark"
                            >
                                View all →
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {recentBookings.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">
                                    event_busy
                                </span>
                                <p className="text-slate-600">No bookings yet</p>
                                <p className="text-sm text-slate-500 mt-2">Students will find you when you complete your profile!</p>
                            </div>
                        ) : (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">
                                                {booking.subjectName} with {booking.student.fullName}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {new Date(booking.scheduledFor).toLocaleDateString()} • {booking.duration} minutes
                                            </p>
                                        </div>
                                        <div className="text-right">
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
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {Number(booking.tutorEarning).toFixed(2)} ETB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/tutor/profile"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    person
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Update Profile</h3>
                                <p className="text-sm text-slate-600">Edit your profile and subjects</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/tutor/bookings"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    event
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Manage Bookings</h3>
                                <p className="text-sm text-slate-600">Accept or decline requests</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/tutor/wallet"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    account_balance_wallet
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Withdraw Earnings</h3>
                                <p className="text-sm text-slate-600">Transfer funds to your account</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
