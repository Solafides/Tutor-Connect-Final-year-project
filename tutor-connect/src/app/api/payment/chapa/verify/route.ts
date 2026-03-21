import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tx_ref = searchParams.get('tx_ref');

        if (!tx_ref) {
            return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
        }

        // Find transaction
        const transaction = await prisma.transaction.findFirst({
            where: { referenceId: tx_ref, paymentGateway: 'chapa' },
            include: { wallet: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // If already completed, just return success to avoid double counting
        const metadata: any = transaction.paymentMetadata || {};
        if (metadata.status === 'COMPLETED') {
            return NextResponse.json({ success: true, message: 'Transaction already verified' });
        }

        // Call Chapa API to verify
        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${chapaSecretKey}`,
            }
        });

        const chapaData = await chapaRes.json();

        // Check if payment was actually successful in Chapa
        if (chapaData.status === 'success' && chapaData.data?.status === 'success') {
            // It's paid! Update wallet and transaction
            
            // Using a Prisma transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
                const updatedWallet = await tx.wallet.update({
                    where: { id: transaction.walletId },
                    data: { balance: { increment: transaction.amount } }
                });

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        balanceAfter: updatedWallet.balance,
                        paymentMetadata: { status: 'COMPLETED', chapaRef: chapaData.data.reference },
                    }
                });
            });

            return NextResponse.json({ success: true });
        } else {
            console.error("Chapa Verification Failed Data:", chapaData);
            
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    paymentMetadata: { status: 'FAILED' }
                }
            });

            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Verification API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
