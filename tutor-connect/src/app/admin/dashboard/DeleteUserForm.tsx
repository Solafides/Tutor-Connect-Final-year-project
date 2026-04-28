"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteUserForm({ 
    id, 
    tab, 
    action, 
    disabled 
}: { 
    id: string, 
    tab: string, 
    action: (formData: FormData) => void, 
    disabled?: boolean 
}) {
    return (
        <form 
            action={action} 
            onSubmit={(e) => {
                if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.')) {
                    e.preventDefault();
                }
            }}
        >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="tab" value={tab} />
            <button 
                type="submit" 
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={disabled}
            >
                <Trash2 size={18} />
            </button>
        </form>
    );
}
