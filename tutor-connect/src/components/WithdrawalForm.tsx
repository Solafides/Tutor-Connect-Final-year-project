'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WithdrawalForm({ balance }: { balance: number }) {
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
        
        const formData = new FormData(e.currentTarget);
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
                setSuccessMessage(data.message || 'Withdrawal initiated successfully!');
                e.currentTarget.reset();
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
                <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg">
                    {successMessage}
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
