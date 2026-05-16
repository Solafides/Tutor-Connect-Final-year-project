import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.status === 'ACTIVE' || (user.status === 'PENDING' && user.emailVerified)) {
             return NextResponse.json({ message: 'Email is already verified' }, { status: 400 });
        }

        const token = await generateVerificationToken(email, 'EMAIL_VERIFICATION');
        await sendVerificationEmail(email, token.token);

        return NextResponse.json({ message: 'A new verification code has been sent to your email.' }, { status: 200 });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
