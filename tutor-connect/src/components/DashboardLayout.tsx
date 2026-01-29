import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { auth } from '@/auth';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const session = await auth();
    
    if (!session?.user) {
        return null;
    }

    const userName = session.user.email?.split('@')[0] || 'User';
    const userRole = session.user.role as any;

    return (
        <div className="min-h-screen bg-background-light">
            <Navigation userRole={userRole} userName={userName} />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
