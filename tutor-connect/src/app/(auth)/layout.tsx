import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light p-4 relative">
            <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Home
            </Link>
            <Link href="/" className="mb-8 flex items-center gap-2 mt-12 sm:mt-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                    <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-text-main">Tutor Connect</span>
            </Link>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-8">
                {children}
            </div>
            <div className="mt-8 text-center text-sm text-text-sub">
                &copy; {new Date().getFullYear()} Tutor Connect. All rights reserved.
            </div>
        </div>
    );
}
