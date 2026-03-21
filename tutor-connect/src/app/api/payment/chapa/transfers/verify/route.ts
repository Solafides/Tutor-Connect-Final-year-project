import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tx_ref = searchParams.get('tx_ref');

        if (!tx_ref) {
            return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
        }

        const transaction = await prisma.transaction.findFirst({
            where: { referenceId: tx_ref, type: 'WITHDRAWAL', paymentGateway: 'chapa' },
            include: { wallet: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
        }

        const metadata: any = transaction.paymentMetadata || {};
        if (metadata.status === 'COMPLETED' || metadata.status === 'FAILED' || metadata.status === 'REVERSED') {
            return NextResponse.json({ status: metadata.status, message: `Transaction already processed as ${metadata.status}` });
        }

        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Call Chapa Transfers Verify API
        const chapaRes = await fetch(`https://api.chapa.co/v1/transfers/verify/${tx_ref}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${chapaSecretKey}`,
            }
        });

        const chapaData = await chapaRes.json();

        // Interpret Chapa's response
        // Note: The structure depends on whether the status is on the top level or within data
        const txStatus = chapaData.data?.status?.toUpperCase() || chapaData.status?.toUpperCase() || 'PENDING';

        await prisma.$transaction(async (tx) => {
            if (txStatus === 'SUCCESS' || txStatus === 'SUCCESSFUL') {
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { paymentMetadata: { ...metadata, status: 'COMPLETED' } }
                });
            } else if (txStatus === 'FAILED' || txStatus === 'REVERSED') {
                // Refund the user's wallet because the withdrawal failed
                await tx.wallet.update({
                    where: { id: transaction.walletId },
                    data: { balance: { increment: transaction.amount } }
                });
                
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { paymentMetadata: { ...metadata, status: 'FAILED', reason: chapaData.message } }
                });
            } else {
                // Still pending or queued, no action needed
            }
        });

        return NextResponse.json({ success: true, status: txStatus === 'SUCCESSFUL' ? 'SUCCESS' : txStatus });
    } catch (error: any) {
        console.error("Payout Verification API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
