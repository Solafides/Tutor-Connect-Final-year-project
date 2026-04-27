'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function payForBooking(bookingId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
        throw new Error('Unauthorized');
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId, studentId: session.user.studentProfile?.id }
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    if (booking.isPaid) {
        throw new Error('Booking is already paid');
    }

    if (booking.status !== 'ACCEPTED') {
        throw new Error('Booking must be accepted by the tutor before payment');
    }

    // Initialize Chapa
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : 'localhost:3000';
    
    const tx_ref = `TC-BOOKING-${booking.id}-${crypto.randomBytes(4).toString('hex')}`;
    const return_url = `${protocol}://${host}/student/bookings/${booking.id}/verify?tx_ref=${tx_ref}`;

    // Ledger Entry (To track payment history)
    let wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet) {
        wallet = await prisma.wallet.create({ data: { userId: session.user.id, balance: 0, currency: 'ETB' } });
    }

    await prisma.transaction.create({
        data: {
            walletId: wallet.id,
            type: 'PAYMENT',
            amount: booking.totalAmount,
            balanceAfter: wallet.balance, // Balance is unchanged for direct payment
            referenceId: tx_ref,
            paymentGateway: 'chapa',
            description: `Payment for ${booking.subjectName}`,
            paymentMetadata: { status: 'PENDING', bookingId: booking.id }
        }
    });

    let checkoutUrl: string | null = null;
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    if (chapaSecretKey) {
        const chapaReqPayload = {
            amount: booking.totalAmount.toString(),
            currency: 'ETB',
            email: session.user.email,
            first_name: session.user.name?.split(' ')[0] || 'Student',
            last_name: session.user.name?.split(' ').slice(1).join(' ') || 'User',
            tx_ref: tx_ref,
            return_url: return_url,
            customization: {
                title: 'TutorConnect pay',
                description: `Payment for ${booking.subjectName} with Tutor`
            }
        };

        try {
            const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${chapaSecretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chapaReqPayload)
            });

            const chapaData = await chapaRes.json();
            if (chapaData.status === 'success' && chapaData.data?.checkout_url) {
                checkoutUrl = chapaData.data.checkout_url;
            } else {
                console.error("Chapa API Initialization Failed:", JSON.stringify(chapaData, null, 2));
                let errorMsg = chapaData.message || chapaData.errors || chapaData;
                const formattedError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg, null, 2);
                throw new Error(`CHAPA_ERROR: ${formattedError}`);
            }
        } catch (e: any) {
            console.error("Failed to initialize Chapa checkout:", e);
            // If it's our custom Chapa error, rethrow it directly
            if (e.message && e.message.startsWith('CHAPA_ERROR:')) {
                throw new Error(e.message.replace('CHAPA_ERROR: ', 'Chapa API Error: '));
            }
            throw new Error(`Failed to initialize payment gateway: ${e.message}`);
        }
    }

    if (checkoutUrl) {
        redirect(checkoutUrl);
    }

    throw new Error('Failed to initialize payment gateway');
}
