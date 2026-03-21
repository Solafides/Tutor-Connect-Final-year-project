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

        // Use Prisma transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId: session.user.id }
            });

            if (!wallet || Number(wallet.balance) < amount) {
                throw new Error('Insufficient balance');
            }

            // Deduct from wallet immediately
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            });

            const tx_ref = `TC-WITHDRAW-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

            // Create a withdrawal transaction record
            const transactionRecord = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: amount,
                    balanceAfter: updatedWallet.balance,
                    description: `Withdrawal request to ${accountName}`,
                    referenceId: tx_ref,
                    paymentGateway: 'chapa',
                    paymentMetadata: { status: 'PENDING', bankCode, accountNumber, accountName }
                }
            });

            // Trigger Chapa Transfer
            const payload = {
                account_name: accountName,
                account_number: accountNumber.toString(),
                amount: amount.toString(),
                currency: "ETB",
                reference: tx_ref,
                bank_code: bankCode
            };

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
                // Update the transaction to COMPLETED (or let it stay pending if async)
                // Chapa essentially queues the transfer and returns success strings
                await tx.transaction.update({
                    where: { id: transactionRecord.id },
                    data: {
                        paymentMetadata: { status: 'COMPLETED', chapaRef: chapaData.data?.reference, bankCode, accountNumber }
                    }
                });

                return { success: true, message: chapaData.message };
            } else {
                console.error("Chapa Transfer Failed:", chapaData);
                throw new Error(chapaData.message || 'Transfer failed at Gateway');
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Withdraw Route Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
