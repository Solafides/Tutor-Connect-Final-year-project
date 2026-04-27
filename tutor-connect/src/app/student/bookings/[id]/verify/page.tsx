'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { use } from 'react';

export default function VerifyBookingPayment(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const searchParams = useSearchParams();
    const tx_ref = searchParams.get('tx_ref');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!tx_ref) {
            setStatus('error');
            setMessage('No transaction reference found.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const res = await fetch(`/api/payment/chapa/verify-booking?tx_ref=${tx_ref}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Payment verified successfully! Your funds are securely held in escrow.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyPayment();
    }, [tx_ref, params.id]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-slate-900">Verifying Payment</h2>
                        <p className="text-slate-500 mt-2">{message}</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="rounded-full bg-green-100 p-3 inline-block mb-4">
                            <span className="material-symbols-outlined text-green-600 text-4xl block">
                                check_circle
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Payment Secured!</h2>
                        <p className="text-slate-600 mt-2 mb-6">{message}</p>
                        
                        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg text-left mb-6 flex gap-3">
                            <span className="material-symbols-outlined text-blue-600">info</span>
                            <p>Your payment is held in escrow. It will only be released to the tutor after the lesson is completed.</p>
                        </div>
                        
                        <Link href="/student/bookings" className="block w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition">
                            View My Bookings
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="rounded-full bg-red-100 p-3 inline-block mb-4">
                            <span className="material-symbols-outlined text-red-600 text-4xl block">
                                error
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
                        <p className="text-slate-600 mt-2 mb-6">{message}</p>
                        <div className="flex gap-4">
                            <Link href="/student/bookings" className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
                                Go to Bookings
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
