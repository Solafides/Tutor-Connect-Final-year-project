import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
        if (!chapaSecretKey) {
            return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
        }

        // Call Chapa API to get supported banks
        const chapaRes = await fetch('https://api.chapa.co/v1/banks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${chapaSecretKey}`
            }
        });

        const chapaData = await chapaRes.json();

        if (chapaData.data) {
            return NextResponse.json({ banks: chapaData.data });
        } else {
            console.error("Chapa Banks Fetch Data:", chapaData);
            return NextResponse.json({ error: 'Failed to fetch banks from Chapa' }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
