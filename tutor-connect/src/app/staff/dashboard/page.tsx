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
    Eye,
    Plus,
    Trash2,
    MessageSquare,
    BookOpen,
    Send,
    Settings,
    Download,
    ExternalLink,
    ChevronRight,
    Filter,
    ArrowUpRight,
    Clock,
    UserPlus,
    Flag,
    Calendar,
    Menu
} from 'lucide-react';

import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function StaffDashboardPage({ searchParams }: { searchParams: any }) {
    // 1. Authorization & Session Check
    const session = await auth();
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    // 2. Parse Search Params (Awaited for Next.js 15 compatibility)
    const params = await searchParams;
    const activeTab = params?.tab || 'overview';
    const searchQuery = params?.q || '';
    const manageTutorId = params?.manageId || null;
    const viewFilesId = params?.viewFiles || null;
    const rejectTutorId = params?.rejectId || null;
    const isMenuOpen = params?.menu === 'open';

    // 3. Comprehensive Database Fetch
    // We fetch everything needed for all tabs to ensure no "null" errors
    const [tutors, bookings, allSubjects, stats] = await Promise.all([
        prisma.tutorProfile.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                user: true, 
                subjects: { 
                    include: { subject: true } 
                }, 
                verificationDocs: true 
            }
        }),
        prisma.booking.findMany({
            orderBy: { scheduledFor: 'desc' },
            include: { 
                tutor: true, 
                student: true 
            }
        }),
        prisma.subject.findMany({ 
            orderBy: { name: 'asc' } 
        }),
        prisma.booking.aggregate({
            _sum: { totalAmount: true },
            _count: { id: true }
        })
    ]);

    // 4. Data Filtering & Logic
    const pendingTutors = tutors.filter((t: any) => t.verificationStatus === 'PENDING');
    const verifiedTutors = tutors.filter((t: any) => t.verificationStatus === 'APPROVED');
    const activeBookings = bookings.filter((b: any) => b.status === 'ACCEPTED' || b.status === 'PENDING');

    const filteredPending = pendingTutors.filter((t: any) =>
        t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredVerified = verifiedTutors.filter((t: any) =>
        t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBookings = bookings.filter((b: any) =>
        b.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tutor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Context objects for Modals/Drawers
    const tutorToManage = manageTutorId ? tutors.find(t => t.id === manageTutorId) : null;
    const tutorToViewFiles = viewFilesId ? tutors.find(t => t.id === viewFilesId) : null;
    const tutorToReject = rejectTutorId ? tutors.find(t => t.id === rejectTutorId) : null;

    // ==========================================
    // 5. SERVER ACTIONS (Staff Operations)
    // ==========================================

    async function handleVerifyTutor(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        const action = formData.get('action') as 'APPROVE' | 'REJECT';
        const reason = formData.get('reason') as string | null;

        await prisma.tutorProfile.update({
            where: { id: tutorId },
            data: { 
                verificationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                rejectionReason: action === 'REJECT' ? reason : null 
            }
        });
        revalidatePath('/staff/dashboard');
        redirect('/staff/dashboard?tab=verifications');
    }

    async function handleAddSubject(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        const subjectId = formData.get('subjectId') as string;
        const customSubject = formData.get('customSubject') as string;

        if (!tutorId) return;

        let finalSubjectId = subjectId;

        // If staff typed a custom subject name
        if (customSubject && customSubject.trim() !== "") {
            const newSub = await prisma.subject.upsert({
                where: { name: customSubject.trim() },
                update: {},
                create: { name: customSubject.trim() }
            });
            finalSubjectId = newSub.id;
        }

        if (!finalSubjectId) return;

        try {
            await prisma.tutorSubject.create({
                data: {
                    tutorId: tutorId,
                    subjectId: finalSubjectId
                }
            });
        } catch (e) {
            console.error("Subject might already be assigned");
        }

        revalidatePath('/staff/dashboard');
        redirect(`/staff/dashboard?tab=tutors&manageId=${tutorId}`);
    }

    async function handleUpdateBookingStatus(formData: FormData) {
        "use server";
        const bookingId = formData.get('bookingId') as string;
        const status = formData.get('status') as any;

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: status }
        });

        revalidatePath('/staff/dashboard');
    }

    async function handleToggleAccountStatus(formData: FormData) {
        "use server";
        const userId = formData.get('userId') as string;
        const currentStatus = formData.get('currentStatus') as string;
        
        await prisma.user.update({
            where: { id: userId },
            data: { status: currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' }
        });
        
        revalidatePath('/staff/dashboard');
    }

    async function handleDeleteTutor(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        // Caution: This may fail if there are active bookings due to foreign key constraints
        await prisma.tutorProfile.delete({ where: { id: tutorId } });
        revalidatePath('/staff/dashboard');
        redirect('/staff/dashboard?tab=tutors');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <Link href={`/staff/dashboard?tab=${activeTab}`} className="fixed inset-0 bg-slate-900/50 z-[50] md:hidden backdrop-blur-sm"></Link>
            )}

            {/* --- SIDEBAR (EMERALD THEME) --- */}
            <aside className={`w-64 bg-white border-r border-slate-200 flex-col h-screen z-[60] ${isMenuOpen ? 'fixed inset-y-0 left-0 flex shadow-2xl' : 'hidden md:flex sticky top-0'}`}>
                {isMenuOpen && (
                    <Link href={`/staff/dashboard?tab=${activeTab}`} className="absolute top-4 right-4 p-2 text-slate-700 rounded-md md:hidden">
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </Link>
                )}
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-100">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <span className="font-black text-slate-900 text-xl tracking-tight block leading-none">Staff Portal</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">System Control</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
                    <SidebarItem icon={<Layout size={20} />} label="Overview" tabName="overview" active={activeTab === 'overview'} />
                    <SidebarItem 
                        icon={<UserCheck size={20} />} 
                        label="Verifications" 
                        tabName="verifications" 
                        active={activeTab === 'verifications'} 
                        badge={pendingTutors.length > 0 ? pendingTutors.length : undefined} 
                    />
                    <SidebarItem icon={<Users size={20} />} label="Manage Tutors" tabName="tutors" active={activeTab === 'tutors'} />
                    <SidebarItem icon={<CalendarCheck size={20} />} label="All Bookings" tabName="bookings" active={activeTab === 'bookings'} />
                    <SidebarItem icon={<AlertCircle size={20} />} label="Support Tickets" tabName="support" active={activeTab === 'support'} />
                    {session.user.role === 'ADMIN' && (
                        <SidebarItem icon={<Settings size={20} />} label="System Settings" tabName="settings" active={activeTab === 'settings'} />
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 mt-auto">
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logged in as</p>
                        <p className="text-xs font-black text-slate-700 truncate">{session?.user?.email}</p>
                    </div>
                    <form action={async () => { "use server"; await signOut({ redirectTo: '/' }); }}>
                        <button type="submit" className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-red-50 transition-all text-slate-500 hover:text-red-600 font-bold group">
                            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                            <span className="text-sm">Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href={`/staff/dashboard?tab=${activeTab}&menu=open`} className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700">
                            <span className="material-symbols-outlined text-3xl">menu</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                                {activeTab.replace('-', ' ')}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                                    Live System Monitor • {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <form method="GET" className="relative group hidden lg:block">
                            <input type="hidden" name="tab" value={activeTab} />
                            <input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="Search everything..."
                                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 w-80 transition-all outline-none"
                            />
                            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                        </form>
                        
                        <button className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
                            <Bell size={22} />
                            {pendingTutors.length > 0 && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard 
                                    icon={<UserCheck size={24}/>} 
                                    label="Verification Tasks" 
                                    value={pendingTutors.length} 
                                    trend="Action Required" 
                                    urgent={pendingTutors.length > 0}
                                    color="emerald" 
                                />
                                <StatCard 
                                    icon={<CalendarCheck size={24}/>} 
                                    label="Active Bookings" 
                                    value={activeBookings.length} 
                                    trend="Total platform volume"
                                    color="emerald" 
                                />
                                <StatCard 
                                    icon={<Users size={24}/>} 
                                    label="Verified Tutors" 
                                    value={verifiedTutors.length} 
                                    trend="Total growth +12%"
                                    color="emerald" 
                                />
                                <StatCard 
                                    icon={<Flag size={24}/>} 
                                    label="Open Tickets" 
                                    value={0} 
                                    trend="All clear today"
                                    color="slate" 
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {/* Recent Verifications */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black text-slate-900">Pending Review</h3>
                                        <Link href="/staff/dashboard?tab=verifications" className="text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline">View All Tasks</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {pendingTutors.slice(0, 4).map((tutor: any) => (
                                            <div key={tutor.id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-lg">
                                                        {tutor.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{tutor.fullName}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tutor.user.email}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/staff/dashboard?tab=verifications&viewFiles=${tutor.id}`} className="p-3 bg-white rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 border border-transparent transition-all">
                                                    <ChevronRight size={20} />
                                                </Link>
                                            </div>
                                        ))}
                                        {pendingTutors.length === 0 && (
                                            <div className="text-center py-12 text-slate-400 font-bold italic">No pending tasks! 🎉</div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black text-slate-900">Live Activity</h3>
                                        <Link href="/staff/dashboard?tab=bookings" className="text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline">Monitor Bookings</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {bookings.slice(0, 4).map((booking: any) => (
                                            <div key={booking.id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                                                        <ArrowUpRight size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">{booking.subjectName}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate w-40">
                                                            {booking.student.fullName} → {booking.tutor.fullName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: VERIFICATIONS */}
                    {activeTab === 'verifications' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tutor Application Queue</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-1">Review credentials and verify National/University IDs.</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                                            <tr>
                                                <th className="p-6 pl-8">Applicant Info</th>
                                                <th className="p-6">Submission Date</th>
                                                <th className="p-6 text-center">Credentials</th>
                                                <th className="p-6 pr-8 text-right">Decision</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredPending.map((tutor: any) => (
                                                <tr key={tutor.id} className="hover:bg-emerald-50/20 transition-colors">
                                                    <td className="p-6 pl-8">
                                                        <div className="font-black text-slate-900">{tutor.fullName}</div>
                                                        <div className="text-xs text-slate-400 font-bold">{tutor.user.email}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            <Clock size={14} className="text-slate-300"/>
                                                            {new Date(tutor.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <Link 
                                                            href={`/staff/dashboard?tab=verifications&viewFiles=${tutor.id}`}
                                                            className="inline-flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                                                        >
                                                            <FileText size={14} /> 
                                                            View Docs ({tutor.verificationDocs?.length || 0})
                                                        </Link>
                                                    </td>
                                                    <td className="p-6 pr-8 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <Link 
                                                                href={`/staff/dashboard?tab=verifications&rejectId=${tutor.id}`}
                                                                className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                                                                title="Reject with Reason"
                                                            >
                                                                <X size={22} />
                                                            </Link>
                                                            <form action={handleVerifyTutor}>
                                                                <input type="hidden" name="tutorId" value={tutor.id} />
                                                                <input type="hidden" name="action" value="APPROVE" />
                                                                <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                                                                    Verify & Approve
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredPending.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-20 text-center">
                                                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                                        <p className="text-lg font-black text-slate-400 uppercase tracking-widest italic">All applications reviewed!</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MANAGE TUTORS (ACTIVE DIRECTORY) */}
                    {activeTab === 'tutors' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verified Professional Network</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-1">Manage teaching subjects and account permissions.</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                                            <tr>
                                                <th className="p-6 pl-8">Expert Identity</th>
                                                <th className="p-6">Teaching Capacity</th>
                                                <th className="p-6">Current Status</th>
                                                <th className="p-6 pr-8 text-right">Management</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredVerified.map((tutor: any) => (
                                                <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-6 pl-8">
                                                        <div className="font-black text-slate-900">{tutor.fullName}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tutor.user.email}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {tutor.subjects.length > 0 ? (
                                                                tutor.subjects.map((s: any) => (
                                                                    <span key={s.id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                                                                        {s.subject.name}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                                                            tutor.user.status === 'ACTIVE' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {tutor.user.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 pr-8 text-right">
                                                        <Link 
                                                            href={`/staff/dashboard?tab=tutors&manageId=${tutor.id}`}
                                                            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                                                        >
                                                            <Settings size={14} /> Configure
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MANAGE BOOKINGS */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Platform Transaction Monitor</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Review all scheduled sessions and manually resolve disputes.</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                                            <tr>
                                                <th className="p-6 pl-8">Session Details</th>
                                                <th className="p-6">Participants</th>
                                                <th className="p-6 text-center">Schedule</th>
                                                <th className="p-6">Current State</th>
                                                <th className="p-6 pr-8 text-right">Override Control</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredBookings.map((booking: any) => (
                                                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-6 pl-8">
                                                        <div className="font-black text-slate-900">{booking.subjectName}</div>
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                                                            {booking.totalAmount.toString()} ETB Transaction
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="text-xs font-bold text-slate-700 leading-relaxed">
                                                            T: {booking.tutor.fullName}<br/>
                                                            S: {booking.student.fullName}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-xl">
                                                            <Calendar size={14} className="text-emerald-500"/>
                                                            {new Date(booking.scheduledFor).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <StatusBadge status={booking.status} />
                                                    </td>
                                                    <td className="p-6 pr-8 text-right">
                                                        <form action={handleUpdateBookingStatus} className="flex justify-end gap-2">
                                                            <input type="hidden" name="bookingId" value={booking.id} />
                                                            <select 
                                                                name="status" 
                                                                className="text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl px-2 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                                defaultValue={booking.status}
                                                            >
                                                                <option value="PENDING">Set Pending</option>
                                                                <option value="ACCEPTED">Set Accepted</option>
                                                                <option value="COMPLETED">Set Completed</option>
                                                                <option value="CANCELLED">Force Cancel</option>
                                                            </select>
                                                            <button className="bg-slate-900 text-white p-2 rounded-xl hover:bg-emerald-600 transition-all shadow-md">
                                                                <Check size={16} />
                                                            </button>
                                                        </form>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* --- FLOATING MODALS & DRAWERS --- */}

                {/* 1. DOCUMENT VIEWER MODAL */}
                {tutorToViewFiles && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-6 animate-in fade-in duration-300">
                        <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Credential Review</h2>
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">{tutorToViewFiles.fullName}</p>
                                </div>
                                <Link href={`/staff/dashboard?tab=${activeTab}`} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={24}/></Link>
                            </div>
                            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                                {tutorToViewFiles.verificationDocs.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="font-bold text-slate-400 italic">No files have been uploaded to the system yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tutorToViewFiles.verificationDocs.map((doc: any) => (
                                            <div key={doc.id} className="p-6 border border-emerald-100 rounded-[2rem] bg-emerald-50/20 flex flex-col justify-between group hover:bg-emerald-50 transition-all">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-4 bg-white rounded-2xl text-emerald-600 shadow-sm"><FileText size={24}/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{doc.docType.replace('_', ' ')}</p>
                                                        <p className="text-sm font-bold text-slate-700 truncate w-40">{doc.fileName}</p>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={doc.fileUrl} 
                                                    target="_blank" 
                                                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                                                >
                                                    <Download size={14}/> Open Document
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 border-t border-slate-100 bg-slate-50/30 grid grid-cols-2 gap-4">
                                <Link href={`/staff/dashboard?tab=verifications&rejectId=${tutorToViewFiles.id}`} className="w-full py-4 text-red-600 font-black uppercase tracking-widest text-xs text-center border border-red-100 rounded-2xl hover:bg-red-50">Reject</Link>
                                <form action={handleVerifyTutor}>
                                    <input type="hidden" name="tutorId" value={tutorToViewFiles.id} />
                                    <input type="hidden" name="action" value="APPROVE" />
                                    <button className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-200">Approve Application</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. REJECTION MODAL */}
                {tutorToReject && (
                    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-6 animate-in zoom-in-95 duration-200">
                        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="p-8 bg-red-50 text-red-900 border-b border-red-100">
                                <h2 className="text-xl font-black uppercase tracking-tight">Decline Verification</h2>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Applicant: {tutorToReject.fullName}</p>
                            </div>
                            <form action={handleVerifyTutor} className="p-8 space-y-6">
                                <input type="hidden" name="tutorId" value={tutorToReject.id} />
                                <input type="hidden" name="action" value="REJECT" />
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Rejection</label>
                                    <textarea 
                                        name="reason" 
                                        required 
                                        placeholder="Explain what was wrong with the documents..." 
                                        className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Link href="/staff/dashboard?tab=verifications" className="flex-1 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</Link>
                                    <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all">Confirm Reject</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. MANAGE TUTOR DRAWER (CONFIG DRAWER) */}
                {tutorToManage && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
                        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter truncate w-64">{tutorToManage.fullName}</h2>
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Verified Expert Management</p>
                                </div>
                                <Link href="/staff/dashboard?tab=tutors" className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm"><X/></Link>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Account Control Section */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Settings className="text-slate-400" size={18}/>
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account Visibility & Security</h3>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-6 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-slate-600">Current Login Status:</span>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase ${tutorToManage.user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {tutorToManage.user.status}
                                            </span>
                                        </div>
                                        <form action={handleToggleAccountStatus}>
                                            <input type="hidden" name="userId" value={tutorToManage.user.id} />
                                            <input type="hidden" name="currentStatus" value={tutorToManage.user.status} />
                                            <button className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                                tutorToManage.user.status === 'ACTIVE' 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                                            }`}>
                                                {tutorToManage.user.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                                            </button>
                                        </form>
                                    </div>
                                </section>

                                {/* Subject Management Section */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="text-slate-400" size={18}/>
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Authorized Teaching Subjects</h3>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {tutorToManage.subjects.map((s: any) => (
                                            <div key={s.id} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
                                                {s.subject.name}
                                                <button className="hover:text-red-500 transition-colors"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* FIXED ADD SUBJECT FORM */}
                                    <form action={handleAddSubject} className="space-y-4 pt-4">
                                        <input type="hidden" name="tutorId" value={tutorToManage.id} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Existing Subject</label>
                                            <select name="subjectId" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="">-- Choose from library --</option>
                                                {allSubjects.map((s: any) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="relative py-2 flex items-center">
                                            <div className="flex-1 h-[1px] bg-slate-100"></div>
                                            <span className="px-4 text-[10px] font-black text-slate-300 uppercase">Or Add New</span>
                                            <div className="flex-1 h-[1px] bg-slate-100"></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                name="customSubject" 
                                                placeholder="Type custom subject name..." 
                                                className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button type="submit" className="bg-slate-900 text-white px-6 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all">
                                                <Plus size={20}/>
                                            </button>
                                        </div>
                                    </form>
                                </section>

                                {/* Danger Zone Section */}
                                <section className="pt-10 border-t border-slate-100">
                                    <form action={handleDeleteTutor} onSubmit={(e) => {
                                        if(!confirm("DANGER: This will permanently erase this tutor. Continue?")) e.preventDefault();
                                    }}>
                                        <input type="hidden" name="tutorId" value={tutorToManage.id} />
                                        <button className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                                            <Trash2 size={16}/> Permanent Deletion
                                        </button>
                                    </form>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

// --- SHARED UI SUB-COMPONENTS ---

function SidebarItem({ icon, label, tabName, active, badge }: { icon: React.ReactNode, label: string, tabName: string, active?: boolean, badge?: number }) {
    return (
        <Link
            href={`/staff/dashboard?tab=${tabName}`}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
                active 
                ? 'bg-emerald-50 text-emerald-700 font-black shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'
            }`}
        >
            <div className="flex items-center gap-4 text-sm tracking-tight">
                <span className={`${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`}>{icon}</span>
                <span>{label}</span>
            </div>
            {badge ? (
                <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce">
                    {badge}
                </span>
            ) : null}
        </Link>
    );
}

function StatCard({ icon, label, value, trend, urgent = false, color = 'emerald' }: any) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-200 transition-all">
            {urgent && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>}
            <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <h3 className={`text-4xl font-black tracking-tighter ${urgent ? 'text-red-600' : 'text-slate-900'}`}>
                    {value}
                </h3>
                <p className={`text-[10px] font-bold mt-2 ${urgent ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-50",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-200 shadow-sm shadow-blue-50",
        PENDING: "bg-orange-100 text-orange-700 border-orange-200 shadow-sm shadow-orange-50",
        CANCELLED: "bg-red-100 text-red-700 border-red-200 shadow-sm shadow-red-50"
    };
    return (
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
}