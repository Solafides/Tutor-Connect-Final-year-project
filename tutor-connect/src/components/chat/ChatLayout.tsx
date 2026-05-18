'use client';

import { useState, useEffect } from 'react';
import { getChatContacts } from '@/app/actions/chat';
import ContactList from './ContactList';
import ChatWindow from './ChatWindow';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatLayout({ currentUserId }: { currentUserId: string }) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const data = await getChatContacts();
                setContacts(data);
            } catch (error) {
                console.error('Failed to fetch contacts:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadContacts();
    }, []);

    const selectedContact = contacts.find(c => c.id === selectedContactId);

    const handleSelectContact = (id: string) => {
        setSelectedContactId(id);
        setContacts(prev => prev.map(c => 
            c.id === id ? { ...c, unreadCount: 0 } : c
        ));
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-white rounded-lg shadow-sm border">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Sidebar */}
            <div className={`w-full md:w-80 flex flex-col border-r bg-white ${selectedContactId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Messages
                    </h1>
                </div>
                <ContactList 
                    contacts={contacts} 
                    selectedContactId={selectedContactId}
                    onSelectContact={handleSelectContact}
                />
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex-col bg-slate-50 ${selectedContactId ? 'flex' : 'hidden md:flex'}`}>
                {selectedContactId && selectedContact ? (
                    <ChatWindow 
                        currentUserId={currentUserId}
                        contactId={selectedContactId}
                        contactName={selectedContact.name}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 mb-1">Your Messages</h3>
                        <p className="max-w-sm">Select a contact from the list to start chatting. You can chat with users if you have an accepted and paid booking.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
