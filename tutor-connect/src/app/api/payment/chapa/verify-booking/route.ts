import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tx_ref = searchParams.get('tx_ref');

        if (!tx_ref || !tx_ref.startsWith('TC-BOOKING-')) {
            return NextResponse.json({ error: 'Invalid transaction reference' }, { status: 400 });
        }

        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Verify with Chapa API
        const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${chapaSecretKey}`
            }
        });

        const chapaData = await chapaRes.json();

        if (chapaData.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        // Get the pending transaction
        const transaction = await prisma.transaction.findFirst({
            where: { referenceId: tx_ref, paymentGateway: 'chapa' }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found in our records' }, { status: 404 });
        }

        // Get the booking
        const bookingId = (transaction.paymentMetadata as any)?.bookingId;
        if (!bookingId) {
            return NextResponse.json({ error: 'Associated booking not found in transaction metadata' }, { status: 404 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
             return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only update if it hasn't been verified yet
        const isAlreadyVerified = (transaction.paymentMetadata as any)?.status === 'SUCCESS';
        
        if (!isAlreadyVerified) {
            // Use transaction block for atomicity
            await prisma.$transaction(async (tx) => {
                // Update transaction
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paymentMetadata: { 
                            ...(transaction.paymentMetadata as any), 
                            status: 'SUCCESS',
                            chapaRef: chapaData.data.reference
                        }
                    }
                });

                // Update booking to escrow condition
                // If it was PENDING it becomes ACCEPTED (or stays PENDING waiting for tutor, but usually payment implies confirmed)
                // We'll set the status to ACCEPTED since the payment is locked
                await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: 'ACCEPTED',
                        escrowStatus: 'HELD',
                        isPaid: true
                    }
                });
            });
        }

        // We could redirect, but usually this is called by the frontend or webhook.
        // It's a GET, so it might be triggered by the user landing on the verification page.
        return NextResponse.json({ 
            message: 'Payment verified and escrow locked successfully', 
            bookingId: booking.id,
            status: 'ACCEPTED'
        });

    } catch (error: any) {
        console.error("Escrow Verify API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
