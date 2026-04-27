import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId } = await req.json();
        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId, student: { userId: session.user.id } }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Generate unique transaction reference
        const tx_ref = `TC-BOOKING-${booking.id}-${crypto.randomBytes(4).toString('hex')}`;
        
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        
        // This is the page the student will be redirected to after checking out on Chapa
        const return_url = `${protocol}://${host}/student/bookings/${booking.id}/verify?tx_ref=${tx_ref}`;

        // We use the Transaction log to keep a ledger of the payment initiation
        let wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
        if (!wallet) {
            wallet = await prisma.wallet.create({ data: { userId: session.user.id, balance: 0, currency: 'ETB' } });
        }

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: 'PAYMENT',
                amount: booking.totalAmount,
                balanceAfter: wallet.balance, // Virtual balance is unaffected
                referenceId: tx_ref,
                paymentGateway: 'chapa',
                description: `Escrow payment for booking ${booking.id}`,
                paymentMetadata: { status: 'PENDING', bookingId: booking.id }
            }
        });

        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        const chapaReqPayload = {
            amount: booking.totalAmount.toString(),
            currency: 'ETB',
            email: session.user.email,
            first_name: session.user.name?.split(' ')[0] || 'Student',
            last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
            tx_ref: tx_ref,
            return_url: return_url,
            customization: {
                title: 'Tutor Connect Escrow',
                description: `Payment securely held for ${booking.subjectName}`
            }
        };

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
            return NextResponse.json({ checkout_url: chapaData.data.checkout_url });
        } else {
            console.error("Chapa Initialization Error:", chapaData);
            return NextResponse.json({ error: 'Failed to initialize payment with Chapa' }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Escrow Checkout API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
