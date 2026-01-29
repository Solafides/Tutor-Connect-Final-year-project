'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import Link from 'next/link';

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-main">Welcome back</h2>
                <p className="mt-2 text-sm text-text-sub">Please sign in to your account</p>
            </div>

            <form action={dispatch} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-main">
                        Email address
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="you@example.com"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400 text-[20px]">mail</span>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-medium text-text-main">
                            Password
                        </label>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-primary hover:text-primary-dark">
                                Forgot password?
                            </a>
                        </div>
                    </div>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            minLength={6}
                            className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="••••••••"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400 text-[20px]">lock</span>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <p>{errorMessage}</p>
                    </div>
                )}

                <LoginButton />
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">New to Tutor Connect?</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/register" className="font-medium text-primary hover:text-primary-dark">
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
}
