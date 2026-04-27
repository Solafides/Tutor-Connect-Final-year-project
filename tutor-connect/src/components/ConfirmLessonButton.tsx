'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfirmLessonButton({ bookingId, disabled = false }: { bookingId: string, disabled?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/release`, {
                method: 'POST',
            });
            const data = await res.json();
            
            if (res.ok) {
                setShowConfirm(false);
                router.refresh();
            } else {
                alert(`Error: ${data.error || 'Failed to release funds'}`);
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isLoading || disabled}
                className={`w-full sm:w-auto mt-2 inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                    isLoading || disabled ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                }`}
            >
                Confirm class end
            </button>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden transform transition-all">
                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                                <span className="material-symbols-outlined text-emerald-600 text-2xl">
                                    task_alt
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                                Are you sure?
                            </h3>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                Confirming the end of the class will release the funds to the tutor's wallet. This action cannot be undone.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                                >
                                    {isLoading ? 'Confirming...' : 'Yes, end class'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
