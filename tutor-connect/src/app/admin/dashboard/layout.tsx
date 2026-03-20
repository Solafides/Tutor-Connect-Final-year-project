import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // If the user is not logged in, or their role is NOT 'ADMIN' or 'STAFF', kick them out.
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        redirect('/admin/login');
    }

    return <>{children}</>;
}