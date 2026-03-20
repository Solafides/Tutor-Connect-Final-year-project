'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InternalLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Invalid email or password. Please try again.');
                setIsLoading(false);
            } else {
                if (role === 'ADMIN') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/staff/dashboard');
                }
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-emerald-600 mb-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                        {role === 'ADMIN' ? <ShieldCheck size={32} /> : <Users size={32} />}
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
                    Internal Portal
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    Sign in to manage the Tutor-Connect platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-200">

                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('STAFF')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'STAFF'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Support Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ADMIN')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'ADMIN'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            System Admin
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-in fade-in">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-all focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter your internal email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-all focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Sign in to {role === 'ADMIN' ? 'Admin' : 'Staff'} Portal
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                            &larr; Back to Student/Tutor Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}