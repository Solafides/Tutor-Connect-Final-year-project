import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import WalletTabs from './WalletTabs';

export default async function WalletPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    if (session.user.role !== 'STUDENT') {
        redirect('/');
    }

    // Ensure wallet exists
    let wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!wallet) {
        wallet = await prisma.wallet.create({
            data: {
                userId: session.user.id,
                balance: 0,
                currency: 'ETB',
            },
            include: {
                transactions: true,
            },
        });
    }

    // Get a list of users they can transfer to. Just students for now or any user except themselves.
    // In a real app we might want to let them search, but let's pass a few or handle it via API.
    // Passed as initial state stringified to avoid complex Prisma type issues sometimes in Next.js Server Components.
    const walletData = JSON.parse(JSON.stringify(wallet));

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Payment History</h1>
                <p className="mt-2 text-slate-600">
                    View your transaction history for tutoring sessions.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="p-6">
                    {/* Client component for tabs and interactive forms */}
                    <WalletTabs initialWallet={walletData} />
                </div>
            </div>
        </div>
    );
}
