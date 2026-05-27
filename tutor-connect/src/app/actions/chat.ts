'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function getUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    
    // Fetch full user role
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
    });
    
    if (!user) throw new Error('User not found');
    return user;
}

export async function getUnreadMessageCount() {
    try {
        const user = await getUser();
        const count = await prisma.message.count({
            where: {
                receiverId: user.id,
                isRead: false
            }
        });
        return count;
    } catch {
        return 0;
    }
}

export async function getChatContacts() {
    const user = await getUser();
    
    let contacts: any[] = [];
    
    // Always fetch STAFF as contacts for everyone
    const staffMembers = await prisma.user.findMany({
        where: { role: 'STAFF' },
        select: { id: true, email: true, role: true }
    });
    
    if (user.role === 'STUDENT') {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
            include: {
                bookings: {
                    where: {
                        status: 'ACCEPTED',
                        isPaid: true
                    },
                    include: {
                        tutor: {
                            include: { user: true }
                        }
                    }
                }
            }
        });
        
        if (studentProfile) {
            const tutors = studentProfile.bookings.map(b => ({
                id: b.tutor.user.id,
                email: b.tutor.user.email,
                name: b.tutor.fullName,
                avatar: b.tutor.avatar,
                role: 'TUTOR'
            }));
            contacts = [...tutors];
        }
    } else if (user.role === 'TUTOR') {
        const tutorProfile = await prisma.tutorProfile.findUnique({
            where: { userId: user.id },
            include: {
                bookings: {
                    where: {
                        status: 'ACCEPTED',
                        isPaid: true
                    },
                    include: {
                        student: {
                            include: { user: true }
                        }
                    }
                }
            }
        });
        
        if (tutorProfile) {
            const students = tutorProfile.bookings.map(b => ({
                id: b.student.user.id,
                email: b.student.user.email,
                name: b.student.fullName,
                avatar: b.student.avatar,
                role: 'STUDENT'
            }));
            contacts = [...students];
        }
    } else if (user.role === 'STAFF' || user.role === 'ADMIN') {
        const messageContacts = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user.id },
                    { receiverId: user.id }
                ]
            },
            select: { senderId: true, receiverId: true }
        });

        const uniqueUserIds = new Set<string>();
        messageContacts.forEach((m) => {
            if (m.senderId !== user.id) uniqueUserIds.add(m.senderId);
            if (m.receiverId !== user.id) uniqueUserIds.add(m.receiverId);
        });

        const bookingUsers = await prisma.booking.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { include: { user: true } },
                tutor: { include: { user: true } }
            }
        });

        bookingUsers.forEach((booking) => {
            uniqueUserIds.add(booking.student.userId);
            uniqueUserIds.add(booking.tutor.userId);
        });

        const activeContacts = await prisma.user.findMany({
            where: {
                id: { in: Array.from(uniqueUserIds) },
                role: { in: ['STUDENT', 'TUTOR'] }
            },
            include: { studentProfile: true, tutorProfile: true }
        });

        contacts = activeContacts.map((c) => ({
            id: c.id,
            email: c.email,
            name: c.studentProfile?.fullName || c.tutorProfile?.fullName || c.email,
            avatar: c.studentProfile?.avatar || c.tutorProfile?.avatar,
            role: c.role
        }));
    }
    
    // Add staff to contacts for Students and Tutors
    if (user.role !== 'STAFF') {
        staffMembers.forEach(staff => {
            if (!contacts.find(c => c.id === staff.id)) {
                contacts.push({
                    id: staff.id,
                    email: staff.email,
                    name: 'Support Staff',
                    avatar: null,
                    role: 'STAFF'
                });
            }
        });
    }
    
    // Fetch unread counts
    const unreadCounts = await prisma.message.groupBy({
        by: ['senderId'],
        where: {
            receiverId: user.id,
            isRead: false
        },
        _count: { id: true }
    });

    const unreadMap = new Map(unreadCounts.map(u => [u.senderId, u._count.id]));
    
    // Deduplicate contacts and add unread count
    const uniqueContacts = [];
    const seen = new Set();
    for (const c of contacts) {
        if (!seen.has(c.id)) {
            seen.add(c.id);
            uniqueContacts.push({
                ...c,
                unreadCount: unreadMap.get(c.id) || 0
            });
        }
    }
    
    return uniqueContacts;
}

export async function getMessages(contactId: string) {
    const user = await getUser();
    
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: user.id, receiverId: contactId },
                { senderId: contactId, receiverId: user.id }
            ]
        },
        orderBy: {
            createdAt: 'asc'
        }
    });
    
    return messages;
}

export async function sendMessage(receiverId: string, content: string) {
    const user = await getUser();
    
    // Staff and admins can message any student or tutor
    if (user.role === 'STAFF' || user.role === 'ADMIN') {
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver || (receiver.role !== 'STUDENT' && receiver.role !== 'TUTOR')) {
            throw new Error('Staff can only message students and tutors.');
        }
    } else if (user.role === 'STUDENT' || user.role === 'TUTOR') {
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        
        if (receiver && receiver.role !== 'STAFF') {
            // Must have an ACCEPTED and PAID booking
            let validBooking = false;
            
            if (user.role === 'STUDENT' && receiver.role === 'TUTOR') {
                const booking = await prisma.booking.findFirst({
                    where: {
                        student: { userId: user.id },
                        tutor: { userId: receiverId },
                        status: 'ACCEPTED',
                        isPaid: true
                    }
                });
                validBooking = !!booking;
            } else if (user.role === 'TUTOR' && receiver.role === 'STUDENT') {
                const booking = await prisma.booking.findFirst({
                    where: {
                        tutor: { userId: user.id },
                        student: { userId: receiverId },
                        status: 'ACCEPTED',
                        isPaid: true
                    }
                });
                validBooking = !!booking;
            }
            
            if (!validBooking) {
                throw new Error("Chat is disabled or not allowed. Ensure the booking is accepted and paid, and class is not completed.");
            }
        }
    }
    
    const message = await prisma.message.create({
        data: {
            senderId: user.id,
            receiverId: receiverId,
            content
        }
    });
    
    return message;
}

export async function markAsRead(senderId: string) {
    const user = await getUser();
    
    await prisma.message.updateMany({
        where: {
            senderId: senderId,
            receiverId: user.id,
            isRead: false
        },
        data: {
            isRead: true
        }
    });
}
