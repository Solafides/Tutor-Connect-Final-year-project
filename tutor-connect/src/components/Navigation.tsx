'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect, useRef } from 'react';
import { getUnreadMessageCount } from '@/app/actions/chat';

interface NavigationProps {
    userRole?: UserRole;
    userName?: string;
    isLandingPageNav?: boolean;
}

export function Navigation({ userRole, userName, isLandingPageNav = false }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userRole === 'STUDENT' || userRole === 'TUTOR') {
            fetch('/api/notifications')
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    if (Array.isArray(data)) {
                        setNotifications(data);
                        setUnreadCount(data.filter((n: any) => !n.isRead).length);
                    }
                })
                .catch(err => console.error(err));
                
            getUnreadMessageCount()
                .then(count => setUnreadChatCount(count))
                .catch(err => console.error(err));
                
            const handleMessagesRead = () => {
                getUnreadMessageCount()
                    .then(count => setUnreadChatCount(count))
                    .catch(err => console.error(err));
            };
            
            window.addEventListener('messagesRead', handleMessagesRead);
            return () => window.removeEventListener('messagesRead', handleMessagesRead);
        }
    }, [userRole, pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleNotifications = async () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (!isNotificationsOpen && unreadCount > 0) {
            try {
                await fetch('/api/notifications', { method: 'PATCH' });
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (err) {
                console.error(err);
            }
        }
    };

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
        { href: '/student/wallet', label: 'Payment History', icon: 'receipt_long', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/bookings', label: 'My Bookings', icon: 'event', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/classroom', label: 'My Classrooms', icon: 'school', roles: ['STUDENT'] as UserRole[] },
        { href: '/student/messages', label: 'Messages', icon: 'chat', roles: ['STUDENT'] as UserRole[] },
        { href: '/tutor/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/profile', label: 'My Profile', icon: 'person', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/bookings', label: 'Bookings', icon: 'event', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/classroom', label: 'My Classrooms', icon: 'school', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/wallet', label: 'Earnings', icon: 'account_balance_wallet', roles: ['TUTOR'] as UserRole[] },
        { href: '/tutor/messages', label: 'Messages', icon: 'chat', roles: ['TUTOR'] as UserRole[] },
    ];

    const filteredNavItems = userRole
        ? navItems.filter(item => item.roles.includes(userRole))
        : [];

    return (
        <>
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
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                                            {item.label === 'Messages' && unreadChatCount > 0 && (
                                                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                                                    {unreadChatCount}
                                                </span>
                                            )}
                                        </div>
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
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    <span>Sign Out</span>
                                </button>

                                {/* Notification Bell */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={handleToggleNotifications}
                                        className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[26px]">notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                                )}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400">
                                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                                                        <p className="text-sm">You have no notifications.</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100">
                                                        {notifications.map(n => (
                                                            <div key={n.id} className={`p-4 transition-colors ${n.isRead ? 'bg-white' : 'bg-emerald-50/50'}`}>
                                                                <h4 className="text-sm font-bold text-slate-900 mb-1">{n.title}</h4>
                                                                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
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
                            </div>
                        )}
                        {/* Mobile menu button */}
                        <div className="flex md:hidden">
                            <button
                                type="button"
                                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span className="sr-only">Open main menu</span>
                                <span className="material-symbols-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden" role="dialog" aria-modal="true">
                <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                <div className="fixed inset-y-0 right-0 z-50 w-[70%] sm:max-w-sm overflow-y-auto bg-white px-6 py-6 sm:ring-1 sm:ring-slate-900/10 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <Link href={userRole ? `/${userRole.toLowerCase()}/dashboard` : "/"} className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                            <span className="sr-only">Tutor Connect</span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                                <span className="material-symbols-outlined text-xl">school</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">Tutor Connect</span>
                        </Link>
                        <button
                            type="button"
                            className="-m-2.5 rounded-md p-2.5 text-slate-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span className="sr-only">Close menu</span>
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-slate-500/10">
                            <div className="space-y-2 py-6">
                                {filteredNavItems.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 -mx-3 rounded-lg px-3 py-3 text-sm font-bold leading-7 transition-colors ${
                                                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="relative flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                                {item.label === 'Messages' && unreadChatCount > 0 && (
                                                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                        {unreadChatCount}
                                                    </span>
                                                )}
                                            </div>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="py-6 flex flex-col gap-4">
                                {userRole ? (
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleSignOut();
                                        }}
                                        className="-mx-3 flex items-center gap-3 w-full rounded-lg px-3 py-3 text-base font-bold text-slate-900 hover:bg-slate-50"
                                    >
                                        <span className="material-symbols-outlined text-xl">logout</span>
                                        Sign Out
                                    </button>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-bold leading-7 text-slate-900 hover:bg-slate-50">
                                            Sign In
                                        </Link>
                                        <Link href="/register" onClick={() => setIsMenuOpen(false)} className="-mx-3 flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-base font-bold text-white hover:bg-emerald-700 shadow-md">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {userRole && pathname !== `/${userRole.toLowerCase()}/dashboard` && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back
                </button>
            </div>
        )}
        </>
    );
}