'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { sendMessage } from '@/app/actions/chat';

interface MessageInputProps {
    receiverId: string;
    onMessageSent?: () => void;
}

export default function MessageInput({ receiverId, onMessageSent }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        setError(null);
        try {
            await sendMessage(receiverId, content);
            setContent('');
            if (onMessageSent) onMessageSent();
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4 bg-white border-t">
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                    disabled={isSending}
                />
                <button
                    type="submit"
                    disabled={!content.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full disabled:opacity-50 transition-colors flex items-center justify-center w-10 h-10"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
