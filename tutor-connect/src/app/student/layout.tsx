import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    
    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/landing');
    }

    return <>{children}</>;
}
