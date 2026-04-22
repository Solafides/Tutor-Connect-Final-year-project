// app/tutor/wallet/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardLayout from '@/components/DashboardLayout';

export default async function TutorWalletPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TUTOR') redirect('/login');

    const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    const balance = wallet ? Number(wallet.balance) : 0;
    const transactions = wallet?.transactions || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Wallet & Earnings</h1>
                    <p className="mt-2 text-slate-600">Manage your balance and request withdrawals.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Balance & Withdraw Form */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Balance Card */}
                        <div className="bg-primary p-6 rounded-xl text-white shadow-md">
                            <p className="text-primary-100 text-sm font-medium">Available Balance</p>
                            <h2 className="text-4xl font-bold mt-2">{balance.toFixed(2)} ETB</h2>
                            <p className="text-xs text-primary-200 mt-4">
                                *Funds are available to withdraw once classes are completed.
                            </p>
                        </div>

                        {/* Withdrawal Request Form */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Withdrawal</h3>

                            <form className="space-y-4" action="/api/wallet/withdraw" method="POST">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ETB)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        max={balance}
                                        min="100"
                                        placeholder="e.g. 500"
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Method</label>
                                    <select name="provider" className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary">
                                        <option value="telebirr">Telebirr</option>
                                        <option value="cbe">CBE</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-semibold">
                                    Withdraw Funds
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}