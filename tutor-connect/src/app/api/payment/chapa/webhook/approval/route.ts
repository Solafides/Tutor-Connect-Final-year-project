import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const secretHash = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
        if (!secretHash) {
            console.error('Missing Chapa Webhook Secret or Secret Key');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const signature = req.headers.get('chapa-signature') || req.headers.get('x-chapa-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing Signature' }, { status: 400 });
        }

        const textBody = await req.text();
        const hash = crypto.createHmac('sha256', secretHash).update(textBody).digest('hex');

        if (hash === signature) {
            // Signature is valid. Parse body if needed.
            // const data = JSON.parse(textBody);
            // In an approval URL, Chapa is just asking for a 200 OK to instantly queue the transfer
            return NextResponse.json({ status: 'success', message: 'Approved' }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Chapa Approval Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
