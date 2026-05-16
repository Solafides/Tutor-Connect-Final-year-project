'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WithdrawalForm({ balance, userName }: { balance: number, userName?: string }) {
    const [banks, setBanks] = useState<any[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch('/api/payment/chapa/banks');
                if (res.ok) {
                    const data = await res.json();
                    if (data.banks) {
                        setBanks(data.banks);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch banks:', err);
            } finally {
                setIsLoadingBanks(false);
            }
        };

        fetchBanks();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        const form = e.currentTarget;
        const formData = new FormData(form);
        const amount = Number(formData.get('amount'));
        const bankCode = formData.get('bankCode') as string;
        const accountName = formData.get('accountName') as string;
        const accountNumber = formData.get('accountNumber') as string;

        if (amount < 100) {
            setError('Minimum withdrawal amount is 100 ETB.');
            return;
        }

        if (amount > balance) {
            setError('Insufficient balance.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount,
                    bankCode,
                    accountName,
                    accountNumber
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(`Dear ${userName || 'User'}, you have withdrawn ${amount} ETB successfully.`);
                form.reset();
                router.refresh();
            } else {
                setError(data.error || 'Failed to process withdrawal.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}
            
            {successMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                                <span className="material-symbols-outlined text-emerald-600 text-2xl">
                                    check_circle
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Withdrawal Initiated</h3>
                            <p className="text-slate-600 mb-6">{successMessage}</p>
                            <button
                                type="button"
                                onClick={() => setSuccessMessage(null)}
                                className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ETB)</label>
                <input
                    type="number"
                    name="amount"
                    max={balance}
                    min="100"
                    placeholder="e.g. 500"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
                <select 
                    name="bankCode" 
                    required 
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    disabled={isLoadingBanks}
                >
                    <option value="">Select a Bank...</option>
                    {banks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input
                    type="text"
                    name="accountName"
                    placeholder="John Doe"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                <input
                    type="text"
                    name="accountNumber"
                    placeholder="1000123456789"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting || isLoadingBanks || balance < 100} 
                className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
                {isSubmitting ? 'Processing...' : 'Withdraw Funds'}
            </button>
        </form>
    );
}
