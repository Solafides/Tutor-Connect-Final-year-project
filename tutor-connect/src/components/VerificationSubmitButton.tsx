'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function VerificationSubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-12 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {pending ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                </>
            ) : (
                'Submit Documents'
            )}
        </button>
    );
}