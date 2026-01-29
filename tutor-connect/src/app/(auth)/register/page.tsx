'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'role' | 'details'>('role');
    const [role, setRole] = useState<'STUDENT' | 'TUTOR' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Add role to data
        if (!role) {
            setError('Please select a role');
            setIsLoading(false);
            return;
        }

        const payload = {
            ...data,
            role,
            confirmPassword: data.confirmPassword
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                // Show validation errors if available
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat();
                    throw new Error(errorMessages.join(', ') || result.message || 'Registration failed');
                }
                throw new Error(result.message || 'Registration failed');
            }

            // Redirect to login on success
            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'role') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-main">Create an account</h2>
                    <p className="mt-2 text-sm text-text-sub">Choose how you want to use Tutor Connect</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            setRole('STUDENT');
                            setStep('details');
                        }}
                        className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="bg-blue-100 text-primary p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h3 className="font-bold text-text-main">Student</h3>
                        <p className="text-xs text-text-sub mt-1 text-center">I want to find a tutor to learn from</p>
                    </button>

                    <button
                        onClick={() => {
                            setRole('TUTOR');
                            setStep('details');
                        }}
                        className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">history_edu</span>
                        </div>
                        <h3 className="font-bold text-text-main">Tutor</h3>
                        <p className="text-xs text-text-sub mt-1 text-center">I want to teach and earn money</p>
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-text-sub">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <button
                    onClick={() => setStep('role')}
                    className="text-xs text-text-sub hover:text-primary mb-2 flex items-center justify-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Change Role
                </button>
                <h2 className="text-2xl font-bold text-text-main">
                    Join as a {role === 'STUDENT' ? 'Student' : 'Tutor'}
                </h2>
                <p className="mt-1 text-sm text-text-sub">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-main">Full Name</label>
                    <input
                        name="fullName"
                        type="text"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="e.g. Abebe Bikila"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-main">Email Address</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-main">Phone Number</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 sm:text-sm">
                            +251
                        </span>
                        <input
                            name="phone"
                            type="tel"
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-200 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="911 234 567"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-main">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-main">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                        Already have an account? Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}
