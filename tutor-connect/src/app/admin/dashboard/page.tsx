import React from 'react';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import bcrypt from 'bcryptjs';
import {
    Users,
    ShieldCheck,
    DollarSign,
    Activity,
    Layout,
    Settings,
    Search,
    MoreVertical,
    CheckCircle,
    UserCheck,
    GraduationCap,
    Bell,
    LogOut,
    UserCog,
    UserPlus,
    Briefcase,
    X,
    Download
} from 'lucide-react';

/**
 * Tutor-Connect Admin Dashboard
 * Path: src/app/admin/dashboard/page.tsx
 * Theme: Standard Project Theme (Light + Emerald)
 */

export default async function AdminDashboardPage({ searchParams }: { searchParams: any }) {
    // 1. Authorization Check
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        redirect('/admin/login');
    }

    // 2. Safely parse searchParams
    const params = await searchParams;
    const activeTab = params?.tab || 'overview';
    const searchQuery = params?.q || '';
    const showCreateStaffModal = params?.modal === 'new-staff';

    // 3. Fetch Dynamic Data from Database (Includes Profiles to get real names)
    const allUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            studentProfile: true,
            tutorProfile: true
        }
    });

    // 4. Calculate Stats
    const stats = {
        totalUsers: allUsers.length,
        activeTutors: allUsers.filter((u: any) => u.role === 'TUTOR').length,
        activeStudents: allUsers.filter((u: any) => u.role === 'STUDENT').length,
        totalStaff: allUsers.filter((u: any) => u.role === 'ADMIN' || u.role === 'STAFF').length,
        revenue: 45200.00 // Placeholder for future integration
    };

    // 5. Filter Data based on Search
    const filteredUsers = allUsers.filter((u: any) => {
        const fullName = u.name || u.studentProfile?.fullName || u.tutorProfile?.fullName || '';
        return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    });

    const staffMembers = filteredUsers.filter((u: any) => u.role === 'ADMIN' || u.role === 'STAFF');

    // 6. Server Action to Create Staff
    async function handleCreateStaff(formData: FormData) {
        "use server";
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // Hash the custom password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: 'STAFF', // Hardcoded to STAFF as requested
            }
        });

        // Refresh the page and close the modal
        revalidatePath('/admin/dashboard');
        redirect('/admin/dashboard?tab=staff');
    }

    // 7. Server Action to Export CSV
    async function handleExportCSV() {
        "use server";
        const users = await prisma.user.findMany({
            where: { role: { in: ['STUDENT', 'TUTOR'] } },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                studentProfile: { select: { fullName: true } },
                tutorProfile: { select: { fullName: true } }
            }
        });

        const header = "ID,Name,Email,Role,Joined Date\n";
        const rows = users.map((u: any) => {
            const displayName = u.name || u.studentProfile?.fullName || u.tutorProfile?.fullName || 'Unnamed User';
            return `"${u.id}","${displayName}","${u.email}","${u.role}","${u.createdAt.toISOString().split('T')[0]}"`;
        }).join("\n");

        const csvContent = header + rows;

        console.log("--- CSV EXPORT DATA ---");
        console.log(csvContent);
        console.log("-----------------------");

        redirect('/admin/dashboard?tab=users&exported=true');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-20">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-200">
                        <ShieldCheck size={22} />
                    </div>
                    <span className="font-bold text-slate-900 text-xl tracking-tight">Admin Panel</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-2">
                    <SidebarItem icon={<Layout size={18} />} label="Overview" tabName="overview" active={activeTab === 'overview'} />
                    <SidebarItem icon={<Users size={18} />} label="User Management" tabName="users" active={activeTab === 'users'} />
                    <SidebarItem icon={<UserCog size={18} />} label="Staff Management" tabName="staff" active={activeTab === 'staff'} />
                    <SidebarItem icon={<DollarSign size={18} />} label="Financials" tabName="financials" active={activeTab === 'financials'} />
                    <SidebarItem icon={<Settings size={18} />} label="Platform Settings" tabName="settings" active={activeTab === 'settings'} />
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Administration</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <form method="GET" className="relative">
                            <input type="hidden" name="tab" value={activeTab} />
                            <input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="Search users..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64 transition-all"
                            />
                            <button type="submit" className="absolute left-3.5 top-3 text-slate-400 hover:text-emerald-600 transition-colors">
                                <Search size={16} />
                            </button>
                        </form>
                        <button className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard icon={<Users />} label="Total Users" value={stats.totalUsers} trend="Active ecosystem" />
                                <StatCard icon={<GraduationCap />} label="Active Students" value={stats.activeStudents} trend="Learning currently" />
                                <StatCard icon={<UserCheck />} label="Verified Tutors" value={stats.activeTutors} trend="Approved to teach" />
                                <StatCard icon={<Briefcase />} label="Total Staff" value={stats.totalStaff} trend="System Admins & Support" />
                            </div>

                            {/* Recent Activity & Quick Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Platform Activity</h3>
                                        <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
                                    </div>
                                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                                        <div className="text-center">
                                            <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-slate-400 font-bold text-sm">Activity Chart Visualization</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
                                    <div className="space-y-4 flex-1">
                                        <Link href="/admin/dashboard?tab=staff&modal=new-staff" className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl flex items-center gap-4 transition-colors group">
                                            <div className="bg-emerald-600 text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                                                <UserPlus size={20} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-emerald-900">Add New Staff</h4>
                                                <p className="text-xs text-emerald-700/70 font-medium mt-0.5">Create a support staff account</p>
                                            </div>
                                        </Link>
                                        <Link href="/admin/dashboard?tab=staff" className="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-2xl flex items-center gap-4 transition-colors group">
                                            <div className="bg-blue-600 text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                                                <UserCog size={20} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-blue-900">Manage Staff Accounts</h4>
                                                <p className="text-xs text-blue-700/70 font-medium mt-0.5">View internal team members</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: USERS (Students & Tutors) */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Student & Tutor Directory</h3>
                                <form action={handleExportCSV}>
                                    <button type="submit" className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm active:scale-95">
                                        <Download size={16} /> Export CSV
                                    </button>
                                </form>
                            </div>

                            {params?.exported === 'true' && (
                                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium animate-in fade-in">
                                    CSV Data generated successfully! (Check server console for output).
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                            <th className="p-4 pl-6 font-medium">Name</th>
                                            <th className="p-4 font-medium">Role</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Joined</th>
                                            <th className="p-4 pr-6 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredUsers.filter((u: any) => u.role === 'STUDENT' || u.role === 'TUTOR').map((user: any) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900">{user.name || user.studentProfile?.fullName || user.tutorProfile?.fullName || 'Unnamed User'}</div>
                                                    <div className="text-xs text-slate-500">{user.email || 'No email'}</div>
                                                </td>
                                                <td className="p-4"><RoleBadge role={user.role} /></td>
                                                <td className="p-4"><StatusBadge status="ACTIVE" /></td>
                                                <td className="p-4 text-sm font-medium text-slate-600">
                                                    {user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A'}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: STAFF MANAGEMENT */}
                    {activeTab === 'staff' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Internal Staff Directory</h2>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Manage administrators, support agents, and internal team members.</p>
                                </div>
                                <Link href="/admin/dashboard?tab=staff&modal=new-staff" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md shadow-emerald-100 active:scale-95">
                                    <UserPlus size={18} /> Add Staff
                                </Link>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200">
                                                <th className="p-4 pl-6 font-medium">Staff Member</th>
                                                <th className="p-4 font-medium">Role Level</th>
                                                <th className="p-4 font-medium">Status</th>
                                                <th className="p-4 font-medium">Added On</th>
                                                <th className="p-4 pr-6 text-right font-medium">Manage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {staffMembers.map((staff: any) => (
                                                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                                                {(staff.name || staff.studentProfile?.fullName || staff.tutorProfile?.fullName || staff.email || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900">{staff.name || staff.studentProfile?.fullName || staff.tutorProfile?.fullName || 'Unnamed Staff'}</div>
                                                                <div className="text-xs text-slate-500">{staff.email || 'No email'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4"><RoleBadge role={staff.role} /></td>
                                                    <td className="p-4"><StatusBadge status="ACTIVE" /></td>
                                                    <td className="p-4 text-sm font-medium text-slate-600">
                                                        {staff.createdAt ? new Date(staff.createdAt).toISOString().split('T')[0] : 'N/A'}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                            <Settings size={18} />
                                                        </button>
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

                {/* Create Staff Modal */}
                {showCreateStaffModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Staff</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Internal Team Member</p>
                                </div>
                                <Link href="/admin/dashboard?tab=staff" className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors">
                                    <X size={20} />
                                </Link>
                            </div>

                            <form action={handleCreateStaff} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <input required name="name" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="e.g. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                    <input required type="email" name="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="jane@tutorconnect.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Account Password</label>
                                    <input required type="password" name="password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="Create a password" />
                                </div>

                                {/* Hidden input replaces the role dropdown, automatically assigning the STAFF role */}
                                <input type="hidden" name="role" value="STAFF" />

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]">
                                        Create Staff Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

// Sub-components
function SidebarItem({ icon, label, tabName, active, badge }: { icon: React.ReactNode, label: string, tabName: string, active?: boolean, badge?: number }) {
    return (
        <Link
            href={`/admin/dashboard?tab=${tabName}`}
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

function StatCard({ icon, label, value, trend, isCurrency }: { icon: React.ReactNode, label: string, value: string | number, trend: string, isCurrency?: boolean }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isCurrency ? '' : ''}{value}
                </h3>
                <p className="text-xs font-semibold text-emerald-600 mt-2">{trend}</p>
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const styles: Record<string, string> = {
        ADMIN: "bg-purple-100 text-purple-700",
        STAFF: "bg-blue-100 text-blue-700",
        TUTOR: "bg-orange-100 text-orange-700",
        STUDENT: "bg-slate-100 text-slate-700"
    };
    return (
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest ${styles[role] || styles.STUDENT}`}>
            {role}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        PENDING: "bg-orange-100 text-orange-700 border border-orange-200",
        SUSPENDED: "bg-red-100 text-red-700 border border-red-200"
    };
    return (
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest ${styles[status]}`}>
            {status}
        </span>
    );
}