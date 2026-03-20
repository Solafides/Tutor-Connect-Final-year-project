import React from 'react';
import {
    Users,
    ShieldCheck,
    CalendarCheck,
    Layout,
    Search,
    MoreVertical,
    CheckCircle,
    UserCheck,
    AlertCircle,
    Bell,
    LogOut,
    FileText,
    Check,
    X,
    Eye
} from 'lucide-react';

import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function StaffDashboardPage({ searchParams }: { searchParams: any }) {
    // 1. Authorization Check
    const session = await auth();
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    // 2. Parse Search Params
    const params = await searchParams;
    const activeTab = params?.tab || 'overview';
    const searchQuery = params?.q || '';

    // 3. Fetch Data from Database
    const [tutors, bookings] = await Promise.all([
        prisma.tutorProfile.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: true, subjects: { include: { subject: true } } }
        }),
        prisma.booking.findMany({
            orderBy: { scheduledFor: 'desc' },
            include: { tutor: true, student: true }
        })
    ]);

    // 4. Calculate Stats
    const pendingTutors = tutors.filter((t: any) => t.verificationStatus === 'PENDING');
    const activeBookings = bookings.filter((b: any) => b.status === 'ACCEPTED' || b.status === 'PENDING');

    // 5. Filter Data based on Search
    const filteredTutors = pendingTutors.filter((t: any) =>
        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBookings = bookings.filter((b: any) =>
        b.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tutor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 6. Server Actions for Staff Operations
    async function handleVerifyTutor(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        const action = formData.get('action') as 'APPROVE' | 'REJECT';

        if (action === 'APPROVE') {
            await prisma.tutorProfile.update({
                where: { id: tutorId },
                data: { verificationStatus: 'APPROVED' }
            });
        } else {
            await prisma.tutorProfile.update({
                where: { id: tutorId },
                data: { verificationStatus: 'REJECTED' }
            });
        }

        revalidatePath('/staff/dashboard');
        redirect('/staff/dashboard?tab=verifications');
    }

    async function handleCancelBooking(formData: FormData) {
        "use server";
        const bookingId = formData.get('bookingId') as string;

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        });

        revalidatePath('/staff/dashboard');
        redirect('/staff/dashboard?tab=bookings');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-20">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-200">
                        <Users size={22} />
                    </div>
                    <div>
                        <span className="font-bold text-slate-900 text-xl tracking-tight block leading-none">Staff Portal</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Operations</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-2">
                    <SidebarItem icon={<Layout size={18} />} label="Overview" tabName="overview" active={activeTab === 'overview'} />
                    <SidebarItem
                        icon={<UserCheck size={18} />}
                        label="Verifications"
                        tabName="verifications"
                        active={activeTab === 'verifications'}
                        badge={pendingTutors.length > 0 ? pendingTutors.length : undefined}
                    />
                    <SidebarItem icon={<CalendarCheck size={18} />} label="Manage Bookings" tabName="bookings" active={activeTab === 'bookings'} />
                    <SidebarItem icon={<AlertCircle size={18} />} label="Support Tickets" tabName="support" active={activeTab === 'support'} />
                </nav>

                <div className="p-4 border-t border-slate-100 mt-auto">
                    <form action={async () => {
                        "use server";
                        await signOut({ redirectTo: '/' });
                    }}>
                        <button type="submit" className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600 font-medium text-left">
                            <LogOut size={18} />
                            <span className="text-sm font-bold">Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                            {activeTab.replace('-', ' ')}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Hello, {session?.user?.name || 'Staff Member'}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <form method="GET" className="relative">
                            <input type="hidden" name="tab" value={activeTab} />
                            <input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="Search records..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 transition-all"
                            />
                            <button type="submit" className="absolute left-3.5 top-3 text-slate-400 hover:text-blue-600 transition-colors">
                                <Search size={16} />
                            </button>
                        </form>
                        <button className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Bell size={20} />
                            {pendingTutors.length > 0 && (
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard
                                    icon={<UserCheck />}
                                    label="Pending Verifications"
                                    value={pendingTutors.length}
                                    trend="Requires attention"
                                    urgent={pendingTutors.length > 0}
                                    color="blue"
                                />
                                <StatCard
                                    icon={<CalendarCheck />}
                                    label="Active Bookings"
                                    value={activeBookings.length}
                                    trend="Platform activity"
                                    color="emerald"
                                />
                                <StatCard
                                    icon={<AlertCircle />}
                                    label="Open Tickets"
                                    value={0}
                                    trend="All clear"
                                    color="slate"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Quick Action: Review Pending Tutors */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Needs Verification</h3>
                                        <Link href="/staff/dashboard?tab=verifications" className="text-blue-600 text-sm font-bold hover:underline">View All</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {pendingTutors.slice(0, 3).map((tutor: any) => (
                                            <div key={tutor.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                        {tutor.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-900">{tutor.fullName}</h4>
                                                        <p className="text-xs text-slate-500">{tutor.subjects?.[0]?.subject?.name || 'Various Subjects'}</p>
                                                    </div>
                                                </div>
                                                <Link href="/staff/dashboard?tab=verifications" className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
                                                    Review
                                                </Link>
                                            </div>
                                        ))}
                                        {pendingTutors.length === 0 && (
                                            <div className="text-center py-8 text-slate-500 font-medium">No pending verifications! 🎉</div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Action: Recent Bookings */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Recent Bookings</h3>
                                        <Link href="/staff/dashboard?tab=bookings" className="text-emerald-600 text-sm font-bold hover:underline">Manage</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {bookings.slice(0, 3).map((booking: any) => (
                                            <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900">{booking.subjectName}</h4>
                                                    <p className="text-xs text-slate-500">{booking.student.fullName} &rarr; {booking.tutor.fullName}</p>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: VERIFICATIONS (Tutor Management) */}
                    {activeTab === 'verifications' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Pending Tutor Applications</h3>
                                <p className="text-sm text-slate-500 mt-1">Review credentials and approve tutors to teach on the platform.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                            <th className="p-4 pl-6 font-medium">Applicant Info</th>
                                            <th className="p-4 font-medium">Subject Expertise</th>
                                            <th className="p-4 font-medium">Applied On</th>
                                            <th className="p-4 font-medium text-center">Documents</th>
                                            <th className="p-4 pr-6 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTutors.map((tutor: any) => (
                                            <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900">{tutor.fullName}</div>
                                                    <div className="text-xs text-slate-500">{tutor.user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">{tutor.subjects?.[0]?.subject?.name || 'Various Subjects'}</span>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600">
                                                    {tutor.createdAt ? new Date(tutor.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                                        <FileText size={14} /> View CV
                                                    </button>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <form action={handleVerifyTutor} className="flex justify-end gap-2">
                                                        <input type="hidden" name="tutorId" value={tutor.id} />
                                                        <button
                                                            type="submit"
                                                            name="action"
                                                            value="REJECT"
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                                            title="Reject Application"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            name="action"
                                                            value="APPROVE"
                                                            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                                                        >
                                                            <Check size={16} /> Approve
                                                        </button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTutors.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-slate-500">
                                                    <ShieldCheck size={48} className="mx-auto text-slate-300 mb-3" />
                                                    <p className="font-bold text-lg text-slate-700">All caught up!</p>
                                                    <p className="text-sm">No tutors are currently awaiting verification.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: MANAGE BOOKINGS */}
                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Platform Bookings</h3>
                                    <p className="text-sm text-slate-500 mt-1">Monitor all scheduled sessions and resolve disputes.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                            <th className="p-4 pl-6 font-medium">Session / Subject</th>
                                            <th className="p-4 font-medium">Participants</th>
                                            <th className="p-4 font-medium">Schedule</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 pr-6 text-right font-medium">Staff Override</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredBookings.map((booking: any) => (
                                            <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900">{booking.subjectName}</div>
                                                    <div className="text-xs font-medium text-emerald-600">{booking.totalAmount} ETB</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-slate-900"><span className="text-slate-400 text-xs">S:</span> {booking.student.fullName}</div>
                                                    <div className="text-sm font-medium text-slate-900 mt-0.5"><span className="text-slate-400 text-xs">T:</span> {booking.tutor.fullName}</div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600">
                                                    {booking.scheduledFor ? new Date(booking.scheduledFor).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={booking.status} />
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                                            <Eye size={18} />
                                                        </button>
                                                        {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                                                            <form action={handleCancelBooking}>
                                                                <input type="hidden" name="bookingId" value={booking.id} />
                                                                <button
                                                                    type="submit"
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Force Cancel (Staff Override)"
                                                                    onClick={(e) => {
                                                                        if (!confirm('Are you sure you want to forcibly cancel this booking? This should only be done if a dispute occurs.')) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredBookings.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-500">No bookings found matching your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

// Sub-components
function SidebarItem({ icon, label, tabName, active, badge }: { icon: React.ReactNode, label: string, tabName: string, active?: boolean, badge?: number }) {
    return (
        <Link
            href={`/staff/dashboard?tab=${tabName}`}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-600 font-bold border-r-4 border-blue-500' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
        >
            <div className="flex items-center gap-3 text-sm">
                {icon}
                <span>{label}</span>
            </div>
            {badge ? (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            ) : null}
        </Link>
    );
}

function StatCard({ icon, label, value, trend, urgent = false, color = 'blue' }: { icon: React.ReactNode, label: string, value: string | number, trend: string, urgent?: boolean, color?: 'blue' | 'emerald' | 'slate' }) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        slate: "bg-slate-100 text-slate-600"
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {urgent && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={`text-3xl font-black tracking-tight ${urgent ? 'text-red-600' : 'text-slate-900'}`}>
                    {value}
                </h3>
                <p className={`text-xs font-semibold mt-2 ${urgent ? 'text-red-500' : 'text-slate-500'}`}>{trend}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACCEPTED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        COMPLETED: "bg-blue-100 text-blue-700 border border-blue-200",
        PENDING: "bg-orange-100 text-orange-700 border border-orange-200",
        CANCELLED: "bg-red-100 text-red-700 border border-red-200"
    };
    return (
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
}