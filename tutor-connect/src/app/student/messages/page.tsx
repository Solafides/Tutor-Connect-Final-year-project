import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';

export const metadata = {
    title: 'Messages | Student Dashboard',
    description: 'Chat with your tutors and support staff',
};

export default async function StudentMessagesPage() {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
        redirect('/login');
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-500 mt-1">
                    Chat with tutors from your accepted bookings and our support team.
                </p>
            </div>
            
            <ChatLayout currentUserId={session.user.id} />
        </div>
    );
}
