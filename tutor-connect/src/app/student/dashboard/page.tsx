import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default async function StudentDashboardPage() {
    const session = await auth();
    
    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/landing');
    }

    // Fetch student profile first
    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!studentProfile) {
        redirect('/register');
    }

    // Fetch student data
    const [wallet, recentBookings] = await Promise.all([
        prisma.wallet.findUnique({
            where: { userId: session.user.id },
            include: {
                transactions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        }),
        prisma.booking.findMany({
            where: { studentId: studentProfile.id },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                tutor: {
                    include: {
                        user: true,
                    },
                },
            },
        }),
    ]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome back, {studentProfile?.fullName || 'Student'}!
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Manage your bookings, find tutors, and track your learning progress.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Wallet Balance</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {Number(wallet?.balance || 0).toFixed(2)} ETB
                                </p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3">
                                <span className="material-symbols-outlined text-primary text-2xl">
                                    account_balance_wallet
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/student/wallet"
                            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
                        >
                            Manage wallet →
                        </Link>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Active Bookings</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {recentBookings.filter(b => b.status === 'ACCEPTED').length}
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3">
                                <span className="material-symbols-outlined text-blue-600 text-2xl">
                                    event
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/student/bookings"
                            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
                        >
                            View all →
                        </Link>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Completed Sessions</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {recentBookings.filter(b => b.status === 'COMPLETED').length}
                                </p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3">
                                <span className="material-symbols-outlined text-green-600 text-2xl">
                                    check_circle
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Spent</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {recentBookings
                                        .filter(b => b.status === 'COMPLETED')
                                        .reduce((sum, b) => sum + Number(b.totalAmount), 0)
                                        .toFixed(2)} ETB
                                </p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3">
                                <span className="material-symbols-outlined text-purple-600 text-2xl">
                                    payments
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Bookings */}
                <div className="rounded-xl bg-white shadow-sm border border-slate-200">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
                            <Link
                                href="/student/bookings"
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
                                <Link
                                    href="/search"
                                    className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                                >
                                    Find a Tutor
                                </Link>
                            </div>
                        ) : (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">
                                                {booking.subjectName} with {booking.tutor.fullName}
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
                                                {Number(booking.totalAmount).toFixed(2)} ETB
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
                        href="/search"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    search
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Find a Tutor</h3>
                                <p className="text-sm text-slate-600">Search for tutors by subject</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/student/wallet"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    account_balance_wallet
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Manage Wallet</h3>
                                <p className="text-sm text-slate-600">Deposit funds or view transactions</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/student/bookings"
                        className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                    event
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">My Bookings</h3>
                                <p className="text-sm text-slate-600">View all your sessions</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
