import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, bankAccount } = await req.json();

        if (!amount || amount <= 0 || !bankAccount) {
            return NextResponse.json({ error: 'Invalid amount or bank details' }, { status: 400 });
        }

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

            // Create a withdrawal transaction record
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: amount,
                    balanceAfter: updatedWallet.balance,
                    description: `Withdrawal request to ${bankAccount}`,
                    paymentMetadata: { status: 'PENDING', bankAccount }
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
