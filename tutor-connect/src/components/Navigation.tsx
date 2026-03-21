'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface NavigationProps {
    userRole?: UserRole;
    userName?: string;
    isLandingPageNav?: boolean;
}

export function Navigation({ userRole, userName, isLandingPageNav = false }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();

    // FIXED: Now we also check if the user is on the /login or /register page
    // This completely removes the "Tutor Connect" top header on these pages so your sidebar fits perfectly
    const isHiddenRoute = (!isLandingPageNav && pathname === '/') || pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/register');

    if (isHiddenRoute || userRole === 'ADMIN' || userRole === 'STAFF') {
        return null;
    }

    const handleSignOut = async () => {
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
            });
            if (response.ok) {
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const navItems = [
        { href: '/search', label: 'Find Tutors', icon: 'search', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/wallet', label: 'Wallet', icon: 'account_balance_wallet', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/bookings', label: 'My Bookings', icon: 'event', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/classroom', label: 'My Classrooms', icon: 'school', roles: ['STUDENT'] as UserRole[] },
        { href: '/tutor/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/profile', label: 'My Profile', icon: 'person', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/bookings', label: 'Bookings', icon: 'event', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/classroom', label: 'My Classrooms', icon: 'school', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/wallet', label: 'Earnings', icon: 'account_balance_wallet', roles: ['TUTOR'] as UserRole[] },
    ];

    const filteredNavItems = userRole
        ? navItems.filter(item => item.roles.includes(userRole))
        : [];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href={userRole ? `/${userRole.toLowerCase()}/dashboard` : "/"} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                <span className="material-symbols-outlined text-xl">school</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900">Tutor Connect</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {filteredNavItems.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {userRole ? (
                            <>
                                <span className="hidden sm:block text-sm text-slate-600">
                                    {userName && `Hello, ${userName}`}
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}