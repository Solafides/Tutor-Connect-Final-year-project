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

        const { amount } = await req.json();
        
        if (!amount || amount < 10) {
            return NextResponse.json({ error: 'Minimum deposit is 10 ETB' }, { status: 400 });
        }

        // Generate unique transaction reference
        const tx_ref = `TC-WALLET-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // Define base URL for return
        // Ideally this comes from env var like NEXT_PUBLIC_APP_URL
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        const return_url = `${protocol}://${host}/student/wallet/verify?tx_ref=${tx_ref}`;

        // Create pending transaction in DB
        let wallet = await prisma.wallet.findUnique({
            where: { userId: session.user.id }
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { userId: session.user.id, balance: 0, currency: 'ETB' }
            });
        }

        const transaction = await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT',
                amount: amount,
                balanceAfter: wallet.balance, // will be updated upon verify
                referenceId: tx_ref,
                paymentGateway: 'chapa',
                description: 'Wallet Top-up via Chapa',
                paymentMetadata: { status: 'PENDING' }
            }
        });

        // Call Chapa API
        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            console.error('CHAPA_SECRET_KEY is missing from environment variables');
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        const chapaReqPayload = {
            amount: amount.toString(),
            currency: 'ETB',
            email: session.user.email,
            first_name: session.user.name?.split(' ')[0] || 'Student',
            last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
            tx_ref: tx_ref,
            return_url: return_url,
            customization: {
                title: 'Tutor Connect Wallet Top-up',
                description: 'Deposit funds to your wallet for tutoring sessions'
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
        console.error("Payment API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
