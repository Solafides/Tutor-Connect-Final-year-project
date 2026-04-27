import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;
        
        // Find the booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { student: true, tutor: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only the student who made the booking or an admin should release it
        if (booking.student.userId !== session.user.id && session.user.role !== 'ADMIN') {
             return NextResponse.json({ error: 'Unauthorized to release this booking' }, { status: 403 });
        }

        if (booking.escrowStatus !== 'HELD') {
            return NextResponse.json({ error: 'Booking escrow is not currently held' }, { status: 400 });
        }

        if (booking.status !== 'COMPLETED' && booking.status !== 'ACCEPTED') {
            return NextResponse.json({ error: 'Booking must be accepted or completed to release funds' }, { status: 400 });
        }

        // Release the escrow, credit the tutor's wallet
        await prisma.$transaction(async (tx) => {
            // Update booking status
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    escrowStatus: 'RELEASED',
                    completedByStudent: true,
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // Make sure tutor has a wallet
            let tutorWallet = await tx.wallet.findUnique({
                where: { userId: booking.tutor.userId }
            });

            if (!tutorWallet) {
                tutorWallet = await tx.wallet.create({
                    data: { userId: booking.tutor.userId, balance: 0, currency: 'ETB' }
                });
            }

            // Credit the tutor's wallet with their earnings
            const updatedTutorWallet = await tx.wallet.update({
                where: { id: tutorWallet.id },
                data: { balance: { increment: booking.tutorEarning } }
            });

            // Record transaction for Tutor earnings
            await tx.transaction.create({
                data: {
                    walletId: tutorWallet.id,
                    type: 'DEPOSIT', // It's a deposit into their available release balance
                    amount: booking.tutorEarning,
                    balanceAfter: updatedTutorWallet.balance,
                    description: `Escrow release for booking ${booking.id}`,
                    referenceId: `RELEASE-${booking.id}`,
                }
            });

            // We log the platform fee virtually using a dummy transaction if we wanted, 
            // but the 'platformFee' field on the Booking itself acts as our ledger.
        });

        return NextResponse.json({ success: true, message: 'Funds released to tutor wallet successfully.' });

    } catch (error: any) {
        console.error("Escrow Release API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
