import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, bankCode, accountName, accountNumber } = await req.json();

        if (!amount || amount <= 0 || !bankCode || !accountName || !accountNumber) {
            return NextResponse.json({ error: 'Invalid payout details specified' }, { status: 400 });
        }

        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment Gateway Configuration Error' }, { status: 500 });
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId: session.user.id }
        });

        if (!wallet || Number(wallet.balance) < amount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        const tx_ref = `TC-WITHDRAW-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Step 1: Atomically deduct balance and create pending transaction record
        const { updatedWallet, transactionRecord } = await prisma.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            });

            const record = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: amount,
                    balanceAfter: updated.balance,
                    description: `Withdrawal request to ${accountName}`,
                    referenceId: tx_ref,
                    paymentGateway: 'chapa',
                    paymentMetadata: { status: 'PENDING', bankCode, accountNumber, accountName }
                }
            });

            return { updatedWallet: updated, transactionRecord: record };
        });

        // Step 2: Trigger Chapa Transfer OUTSIDE the database transaction
        const payload = {
            account_name: accountName,
            account_number: accountNumber.toString(),
            amount: amount.toString(),
            currency: "ETB",
            reference: tx_ref,
            bank_code: bankCode
        };

        try {
            const chapaRes = await fetch('https://api.chapa.co/v1/transfers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${chapaSecretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const chapaData = await chapaRes.json();

            if (chapaData.status === 'success') {
                // Step 3a: Mark transaction as COMPLETED
                await prisma.transaction.update({
                    where: { id: transactionRecord.id },
                    data: {
                        paymentMetadata: { status: 'COMPLETED', chapaRef: chapaData.data?.reference, bankCode, accountNumber }
                    }
                });

                return NextResponse.json({ success: true, message: chapaData.message });
            } else {
                console.error("Chapa Transfer Failed:", chapaData);
                throw new Error(chapaData.message || 'Transfer failed at Gateway');
            }
        } catch (fetchError: any) {
            // Step 3b: If Chapa fails, refund the balance atomically
            await prisma.$transaction(async (tx) => {
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: amount } }
                });

                await tx.transaction.update({
                    where: { id: transactionRecord.id },
                    data: {
                        paymentMetadata: { status: 'FAILED', error: fetchError.message, bankCode, accountNumber }
                    }
                });
            });

            throw fetchError;
        }

    } catch (error: any) {
        console.error("Withdraw Route Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
