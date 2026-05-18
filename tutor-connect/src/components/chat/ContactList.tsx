'use client';

import { User } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
    unreadCount?: number;
}

interface ContactListProps {
    contacts: Contact[];
    selectedContactId: string | null;
    onSelectContact: (id: string) => void;
}

export default function ContactList({ contacts, selectedContactId, onSelectContact }: ContactListProps) {
    if (contacts.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
                No active conversations. Bookings must be accepted and paid to chat.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
                <button
                    key={contact.id}
                    onClick={() => onSelectContact(contact.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b relative ${selectedContactId === contact.id ? "bg-slate-100" : ""}`}
                >
                    <div className="relative">
                        {contact.avatar ? (
                            <img
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-500" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="font-semibold truncate">{contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.role.charAt(0) + contact.role.slice(1).toLowerCase()}</div>
                    </div>
                    {contact.unreadCount && contact.unreadCount > 0 ? (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                            {contact.unreadCount}
                        </div>
                    ) : null}
                </button>
            ))}
        </div>
    );
}
