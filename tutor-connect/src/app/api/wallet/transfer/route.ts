import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, recipientEmail } = await req.json();

        if (!amount || amount <= 0 || !recipientEmail) {
            return NextResponse.json({ error: 'Invalid amount or recipient' }, { status: 400 });
        }

        if (session.user.email === recipientEmail) {
            return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 });
        }

        // Use Prisma transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Find sender wallet
            const senderWallet = await tx.wallet.findUnique({
                where: { userId: session.user.id }
            });

            if (!senderWallet || Number(senderWallet.balance) < amount) {
                throw new Error('Insufficient balance');
            }

            // Find recipient user and wallet
            const recipientUser = await tx.user.findUnique({
                where: { email: recipientEmail }
            });

            if (!recipientUser) {
                throw new Error('Recipient not found');
            }

            let recipientWallet = await tx.wallet.findUnique({
                where: { userId: recipientUser.id }
            });

            // If recipient doesn't have a wallet, create one
            if (!recipientWallet) {
                recipientWallet = await tx.wallet.create({
                    data: {
                        userId: recipientUser.id,
                        balance: 0,
                        currency: 'ETB',
                    }
                });
            }

            // Perform transfer updates
            const updatedSenderWallet = await tx.wallet.update({
                where: { id: senderWallet.id },
                data: { balance: { decrement: amount } }
            });

            const updatedRecipientWallet = await tx.wallet.update({
                where: { id: recipientWallet.id },
                data: { balance: { increment: amount } }
            });

            // Record Transactions
            await tx.transaction.create({
                data: {
                    walletId: senderWallet.id,
                    type: 'PAYMENT',
                    amount: amount,
                    balanceAfter: updatedSenderWallet.balance,
                    description: `Transfer to ${recipientEmail}`,
                }
            });

            await tx.transaction.create({
                data: {
                    walletId: recipientWallet.id,
                    type: 'DEPOSIT',
                    amount: amount,
                    balanceAfter: updatedRecipientWallet.balance,
                    description: `Transfer from ${session.user.email}`,
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
