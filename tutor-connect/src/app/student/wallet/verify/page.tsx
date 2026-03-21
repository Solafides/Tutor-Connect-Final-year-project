"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tx_ref = searchParams.get('tx_ref');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!tx_ref) {
            setStatus('error');
            setMessage('Invalid transaction reference.');
            return;
        }

        const verifyTransaction = async () => {
            try {
                const res = await fetch(`/api/payment/chapa/verify?tx_ref=${tx_ref}`);
                const data = await res.json();
                
                if (res.ok && data.success) {
                    setStatus('success');
                    setMessage('Your wallet has been successfully credited!');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Payment verification failed. Please contact support.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An error occurred while verifying the payment.');
            }
        };

        verifyTransaction();
    }, [tx_ref]);

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
            {status === 'loading' && (
                <div>
                    <span className="material-symbols-outlined text-6xl text-slate-400 animate-spin">
                        refresh
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Verifying Payment</h2>
                    <p className="mt-2 text-slate-600">{message}</p>
                </div>
            )}
            
            {status === 'success' && (
                <div>
                    <span className="material-symbols-outlined text-6xl text-emerald-500">
                        check_circle
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Payment Successful!</h2>
                    <p className="mt-2 text-slate-600">{message}</p>
                    <Link 
                        href="/student/wallet"
                        className="mt-6 inline-block rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Return to Wallet
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div>
                    <span className="material-symbols-outlined text-6xl text-red-500">
                        error
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Verification Failed</h2>
                    <p className="mt-2 text-slate-600">{message}</p>
                    <Link 
                        href="/student/wallet"
                        className="mt-6 inline-block rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                    >
                        Return to Wallet
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
            <VerifyPaymentContent />
        </Suspense>
    );
}
