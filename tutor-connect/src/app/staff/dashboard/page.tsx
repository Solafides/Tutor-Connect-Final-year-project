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
    MessageSquare,
    UserMinus,
    BookOpen,
    Send,
    Settings,
    Download
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
    const manageTutorId = params?.manageId || null;
    const viewFilesId = params?.viewFiles || null;
    const rejectTutorId = params?.rejectId || null; // NEW: For Rejection Modal
    const successMessage = params?.msg || null;

    // 3. Fetch Data from Database (Optimized with 'take: 100' to prevent 86s freezing timeouts)
    const [tutors, bookings, allSubjects] = await Promise.all([
        prisma.tutorProfile.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: true, subjects: { include: { subject: true } }, verificationDocs: true },
            take: 200 // Prevent memory leaks
        }),
        prisma.booking.findMany({
            orderBy: { scheduledFor: 'desc' },
            include: { tutor: true, student: true },
            take: 200 // Prevent memory leaks
        }),
        prisma.subject.findMany({
            orderBy: { name: 'asc' }
        })
    ]);

    // 4. Calculate Stats
    const pendingTutors = tutors.filter((t: any) => t.verificationStatus === 'PENDING');
    const verifiedTutors = tutors.filter((t: any) => t.verificationStatus === 'APPROVED');
    const activeBookings = bookings.filter((b: any) => b.status === 'ACCEPTED' || b.status === 'PENDING');

    // 5. Filter Data based on Search (Using ?. to safely prevent crashes on null data)
    const filteredPending = pendingTutors.filter((t: any) =>
        t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredVerified = verifiedTutors.filter((t: any) =>
        t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBookings = bookings.filter((b: any) =>
        b.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tutor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subjectName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tutorToManage = manageTutorId ? tutors.find((t: any) => t.id === manageTutorId) : null;
    const tutorToViewFiles = viewFilesId ? tutors.find((t: any) => t.id === viewFilesId) : null;
    const tutorToReject = rejectTutorId ? tutors.find((t: any) => t.id === rejectTutorId) : null;

    // ==========================================
    // 6. SERVER ACTIONS FOR STAFF OPERATIONS
    // ==========================================
    
    async function handleVerifyTutor(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        const action = formData.get('action') as 'APPROVE' | 'REJECT';
        const reason = formData.get('reason') as string | null; // Get reason from modal

        await prisma.tutorProfile.update({
            where: { id: tutorId },
            data: { 
                verificationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                rejectionReason: action === 'REJECT' ? reason : null // Save reason to DB!
            }
        });

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
    }

    async function handleToggleAccountStatus(formData: FormData) {
        "use server";
        const userId = formData.get('userId') as string;
        const currentStatus = formData.get('currentStatus') as string;
        const newStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
        
        await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus }
        });
        revalidatePath('/staff/dashboard');
    }

    async function handleSendMessage(formData: FormData) {
        "use server";
        const userId = formData.get('userId') as string;
        const message = formData.get('message') as string;
        
        console.warn(`Notifications not implemented in schema. Attempted to send to ${userId}: ${message}`);
        revalidatePath('/staff/dashboard');
    }

    async function handleAddSubject(formData: FormData) {
        "use server";
        const tutorId = formData.get('tutorId') as string;
        const subjectNameInput = formData.get('subjectName') as string;

        if (!subjectNameInput || !subjectNameInput.trim() || !tutorId) return;

        const subjectName = subjectNameInput.trim();

        try {
            let subject = await prisma.subject.findFirst({
                where: { name: { equals: subjectName, mode: 'insensitive' } }
            });

            if (!subject) {
                subject = await prisma.subject.create({
                    data: { name: subjectName }
                });
            }

            const exists = await prisma.tutorSubject.findFirst({ 
                where: { tutorId: tutorId, subjectId: subject.id } 
            });
            
            if (!exists) {
                await prisma.tutorSubject.create({
                    data: { tutorId: tutorId, subjectId: subject.id }
                });
            }
        } catch (error) {
            console.error("Prisma Error adding subject:", error);
            return;
        }

        redirect(`/staff/dashboard?tab=tutors&manageId=${tutorId}&msg=Subject added successfully`);
    }

    async function handleRemoveSubject(formData: FormData) {
        "use server";
        const tutorSubjectId = formData.get('tutorSubjectId') as string;
        await prisma.tutorSubject.delete({
            where: { id: tutorSubjectId }
        });
        revalidatePath('/staff/dashboard');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-20">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-200">
                        <Users size={22} />
                    </div>
                    <div>
                        <span className="font-bold text-slate-900 text-xl tracking-tight block leading-none">Staff Portal</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Operations</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-2">
                    <SidebarItem icon={<Layout size={18} />} label="Overview" tabName="overview" active={activeTab === 'overview'} />
                    <SidebarItem
                        icon={<ShieldCheck size={18} />}
                        label="Verifications"
                        tabName="verifications"
                        active={activeTab === 'verifications'}
                        badge={pendingTutors.length > 0 ? pendingTutors.length : undefined}
                    />
                    <SidebarItem icon={<UserCheck size={18} />} label="Manage Tutors" tabName="tutors" active={activeTab === 'tutors'} />
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
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64 transition-all"
                            />
                            <button type="submit" className="absolute left-3.5 top-3 text-slate-400 hover:text-emerald-600 transition-colors">
                                <Search size={16} />
                            </button>
                        </form>
                        <button className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <Bell size={20} />
                            {pendingTutors.length > 0 && (
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 relative">

                    {/* --- REJECTION MODAL OVERLAY --- */}
                    {tutorToReject && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200 p-6">
                            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-900">
                                    <div>
                                        <h2 className="text-xl font-black">Reject Application</h2>
                                        <p className="text-sm font-medium text-red-700">{tutorToReject.fullName}</p>
                                    </div>
                                    <Link href="/staff/dashboard?tab=verifications" className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600">
                                        <X size={20} />
                                    </Link>
                                </div>
                                <form action={handleVerifyTutor} className="p-6 space-y-4">
                                    <input type="hidden" name="tutorId" value={tutorToReject.id} />
                                    <input type="hidden" name="action" value="REJECT" />
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Rejection</label>
                                        <textarea 
                                            name="reason" 
                                            required 
                                            rows={4} 
                                            placeholder="E.g., University ID is missing or too blurry to read."
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                                        ></textarea>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">This exact reason will be shown on the tutor's dashboard so they can correct their application.</p>
                                    </div>
                                    <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md">
                                        Confirm Rejection
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW FILES MODAL OVERLAY --- */}
                    {tutorToViewFiles && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200 p-6">
                            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Verification Documents</h2>
                                        <p className="text-sm text-slate-500">{tutorToViewFiles.fullName}</p>
                                    </div>
                                    <Link href="/staff/dashboard?tab=verifications" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                        <X size={20} />
                                    </Link>
                                </div>
                                <div className="p-6 space-y-4 bg-slate-50/30">
                                    <DocumentRow title="National / University ID" url={tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'ID')?.fileUrl || '#'} isMissing={!tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'ID')?.fileUrl} />
                                    <DocumentRow title="Academic Transcript" url={tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'TRANSCRIPT')?.fileUrl || '#'} isMissing={!tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'TRANSCRIPT')?.fileUrl} />
                                    <DocumentRow title="Teaching Certificate" url={tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'CERTIFICATE')?.fileUrl || '#'} isMissing={!tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'CERTIFICATE')?.fileUrl} />
                                    
                                    {(!tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'ID')?.fileUrl && !tutorToViewFiles.verificationDocs?.find((d: any) => d.docType === 'TRANSCRIPT')?.fileUrl) && (
                                        <div className="mt-4 p-4 bg-orange-50 text-orange-700 rounded-xl text-sm border border-orange-200 flex items-start gap-3">
                                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                            <p>This tutor has not uploaded any physical documents yet. You may need to request them via direct message.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <Link href="/staff/dashboard?tab=verifications" className="w-full block text-center bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                        Close Window
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- MANAGEMENT MODAL OVERLAY --- */}
                    {tutorToManage && (
                        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
                            <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col slide-in-from-right duration-300">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">{tutorToManage.fullName}</h2>
                                        <p className="text-sm text-slate-500">{tutorToManage.user.email}</p>
                                    </div>
                                    <Link href={`/staff/dashboard?tab=${activeTab}`} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                        <X size={20} />
                                    </Link>
                                </div>

                                {/* Success Toast Notification */}
                                {successMessage && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 mx-6 mt-6 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                        {successMessage}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    
                                    {/* 1. Account Status */}
                                    <section>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Account Security</h3>
                                        <div className="p-5 border border-slate-200 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900">Platform Access</p>
                                                <p className="text-xs text-slate-500 mt-1">Status: <span className={`font-bold ${tutorToManage.user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{tutorToManage.user.status || 'ACTIVE'}</span></p>
                                            </div>
                                            <form action={handleToggleAccountStatus}>
                                                <input type="hidden" name="userId" value={tutorToManage.user.id} />
                                                <input type="hidden" name="currentStatus" value={tutorToManage.user.status || 'ACTIVE'} />
                                                <button type="submit" className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${tutorToManage.user.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                                    {tutorToManage.user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                                </button>
                                            </form>
                                        </div>
                                    </section>

                                    {/* 2. Direct Message */}
                                    <section>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><MessageSquare size={14}/> Send Notification</h3>
                                        <form action={handleSendMessage} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                            <input type="hidden" name="userId" value={tutorToManage.user.id} />
                                            <textarea 
                                                name="message" 
                                                required 
                                                rows={3} 
                                                placeholder="Write a message to this tutor..." 
                                                className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            ></textarea>
                                            <button type="submit" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                                                <Send size={16} /> Send Message
                                            </button>
                                        </form>
                                    </section>

                                    {/* 3. Subject Management */}
                                    <section>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><BookOpen size={14}/> Approved Subjects</h3>
                                        <div className="space-y-3">
                                            {tutorToManage.subjects.map((ts: any) => (
                                                <div key={ts.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                                                    <span className="text-sm font-bold text-slate-700">{ts.subject.name}</span>
                                                    <form action={handleRemoveSubject}>
                                                        <input type="hidden" name="tutorSubjectId" value={ts.id} />
                                                        <button type="submit" className="text-slate-400 hover:text-red-500 p-1"><X size={16}/></button>
                                                    </form>
                                                </div>
                                            ))}
                                            {tutorToManage.subjects.length === 0 && <p className="text-sm text-slate-500 italic">No subjects added.</p>}
                                            
                                            {/* Add Subject Form with Text Input */}
                                            <form action={handleAddSubject} className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                                <input type="hidden" name="tutorId" value={tutorToManage.id} />
                                                <input 
                                                    type="text" 
                                                    name="subjectName" 
                                                    required
                                                    placeholder="Type a subject (e.g. Biology)" 
                                                    className="flex-1 text-sm border border-slate-200 rounded-xl p-2 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                                                />
                                                <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors">Add</button>
                                            </form>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    color="emerald"
                                />
                                <StatCard
                                    icon={<CalendarCheck />}
                                    label="Active Bookings"
                                    value={activeBookings.length}
                                    trend="Platform activity"
                                    color="emerald"
                                />
                                <StatCard
                                    icon={<Users />}
                                    label="Verified Tutors"
                                    value={verifiedTutors.length}
                                    trend="Approved professionals"
                                    color="slate"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Quick Action: Review Pending Tutors */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Needs Verification</h3>
                                        <Link href="/staff/dashboard?tab=verifications" className="text-emerald-600 text-sm font-bold hover:underline">View All</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {pendingTutors.slice(0, 3).map((tutor: any) => (
                                            <div key={tutor.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                                                        {tutor.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-900">{tutor.fullName}</h4>
                                                        <p className="text-xs text-slate-500">{tutor.subjects?.[0]?.subject?.name || 'Various Subjects'}</p>
                                                    </div>
                                                </div>
                                                <Link href="/staff/dashboard?tab=verifications" className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-emerald-300 hover:text-emerald-600 transition-colors">
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
                                                    <p className="text-xs text-slate-500">{booking.student?.fullName} &rarr; {booking.tutor?.fullName}</p>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        ))}
                                        {bookings.length === 0 && (
                                            <div className="text-center py-8 text-slate-500 font-medium">No recent bookings.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: VERIFICATIONS */}
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
                                            <th className="p-4 font-medium">Applied On</th>
                                            <th className="p-4 font-medium text-center">Documents</th>
                                            <th className="p-4 pr-6 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPending.map((tutor: any) => (
                                            <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900">{tutor.fullName}</div>
                                                    <div className="text-xs text-slate-500">{tutor.user?.email}</div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600">
                                                    {tutor.createdAt ? new Date(tutor.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Link 
                                                        href={`/staff/dashboard?tab=verifications&viewFiles=${tutor.id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <FileText size={14} /> View Files
                                                    </Link>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {/* REJECT BUTTON (Opens Modal) */}
                                                        <Link
                                                            href={`/staff/dashboard?tab=verifications&rejectId=${tutor.id}`}
                                                            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors shadow-sm active:scale-95"
                                                        >
                                                            <X size={16} /> Reject
                                                        </Link>
                                                        {/* APPROVE BUTTON (Direct Action) */}
                                                        <form action={handleVerifyTutor}>
                                                            <input type="hidden" name="tutorId" value={tutor.id} />
                                                            <input type="hidden" name="action" value="APPROVE" />
                                                            <button
                                                                type="submit"
                                                                className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                                                            >
                                                                <Check size={16} /> Approve
                                                            </button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredPending.length === 0 && (
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

                    {/* TAB: MANAGE VERIFIED TUTORS */}
                    {activeTab === 'tutors' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Manage Verified Tutors</h3>
                                <p className="text-sm text-slate-500 mt-1">Suspend accounts, manage subjects, and send notifications to approved tutors.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                            <th className="p-4 pl-6 font-medium">Tutor Info</th>
                                            <th className="p-4 font-medium">Subjects</th>
                                            <th className="p-4 font-medium">Account Status</th>
                                            <th className="p-4 pr-6 text-right font-medium">Admin Options</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredVerified.map((tutor: any) => (
                                            <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900">{tutor.fullName}</div>
                                                    <div className="text-xs text-slate-500">{tutor.user?.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {tutor.subjects?.slice(0,2).map((ts: any) => (
                                                            <span key={ts.id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                                                                {ts.subject?.name}
                                                            </span>
                                                        ))}
                                                        {tutor.subjects?.length > 2 && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">+{tutor.subjects.length - 2} more</span>}
                                                        {tutor.subjects?.length === 0 && <span className="text-xs text-red-400 italic">No Subjects</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest ${tutor.user?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {tutor.user?.status || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <Link 
                                                        href={`/staff/dashboard?tab=tutors&manageId=${tutor.id}`}
                                                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Settings size={14} className="text-slate-300" /> Manage
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredVerified.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-500">No verified tutors found.</td>
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
                                                    <div className="text-sm font-medium text-slate-900"><span className="text-slate-400 text-xs">S:</span> {booking.student?.fullName}</div>
                                                    <div className="text-sm font-medium text-slate-900 mt-0.5"><span className="text-slate-400 text-xs">T:</span> {booking.tutor?.fullName}</div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-600">
                                                    {booking.scheduledFor ? new Date(booking.scheduledFor).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge status={booking.status} />
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Details">
                                                            <Eye size={18} />
                                                        </button>
                                                        {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                                                            <form action={handleCancelBooking}>
                                                                <input type="hidden" name="bookingId" value={booking.id} />
                                                                <button
                                                                    type="submit"
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Force Cancel (Staff Override)"
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
function DocumentRow({ title, url, isMissing }: { title: string, url: string, isMissing: boolean }) {
    if (isMissing) {
        return (
            <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50 opacity-60">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-slate-400" />
                    <span className="font-medium text-slate-500 text-sm line-through">{title}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-1 rounded">Not Uploaded</span>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center p-4 border border-emerald-100 rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <FileText size={20} className="text-emerald-500" />
                <span className="font-bold text-slate-700 text-sm">{title}</span>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm">
                <Download size={14} /> Open
            </a>
        </div>
    );
}

function SidebarItem({ icon, label, tabName, active, badge }: { icon: React.ReactNode, label: string, tabName: string, active?: boolean, badge?: number }) {
    return (
        <Link
            href={`/staff/dashboard?tab=${tabName}`}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 font-bold border-r-4 border-emerald-500' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
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

function StatCard({ icon, label, value, trend, urgent = false, color = 'emerald' }: { icon: React.ReactNode, label: string, value: string | number, trend: string, urgent?: boolean, color?: 'emerald' | 'slate' }) {
    const colorStyles = {
        emerald: "bg-emerald-50 text-emerald-600",
        slate: "bg-slate-100 text-slate-600"
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {urgent && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorStyles[color as keyof typeof colorStyles]}`}>
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