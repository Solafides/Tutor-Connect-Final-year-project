'use client';

import { useEffect, useState, useRef } from 'react';
import { getMessages, markAsRead } from '@/app/actions/chat';
import MessageInput from './MessageInput';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatWindowProps {
    currentUserId: string;
    contactId: string;
    contactName: string;
}

export default function ChatWindow({ currentUserId, contactId, contactName }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const loadMessages = async () => {
        try {
            const data = await getMessages(contactId);
            setMessages(data);
            await markAsRead(contactId);
            
            // Dispatch event for client components (like Navigation) to update unread count
            window.dispatchEvent(new Event('messagesRead'));
            // Refresh router for server components (like Staff Dashboard sidebar) to update
            router.refresh();
            
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadMessages();
        
        // Subscribe to real-time changes
        const channel = supabase
            .channel(`chat_${currentUserId}_${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    // Only add if it's from the current contact
                    if (payload.new.sender_id === contactId) {
                        setMessages(prev => [...prev, payload.new]);
                        markAsRead(contactId).then(() => {
                            window.dispatchEvent(new Event('messagesRead'));
                            router.refresh();
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, contactId]);

    useEffect(() => {
        // Scroll to bottom when messages change
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b shadow-sm z-10">
                <h2 className="font-semibold text-lg">{contactName}</h2>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        No messages yet. Send a message to start chatting!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUserId || msg.sender_id === currentUserId; // handle raw DB and Prisma camelCase
                        return (
                            <div
                                key={msg.id || idx}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                        isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border shadow-sm rounded-bl-none'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words text-sm md:text-base">{msg.content}</p>
                                    <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
            
            {/* Input Area */}
            <div className="bg-white">
                <MessageInput receiverId={contactId} onMessageSent={loadMessages} />
            </div>
        </div>
    );
}
