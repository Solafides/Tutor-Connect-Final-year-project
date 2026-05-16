import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVerificationToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
        }

        const token = await generateVerificationToken(email, 'PASSWORD_RESET');
        await sendPasswordResetEmail(email, token.token);

        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
