import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, deleteToken } from '@/lib/tokens';

export async function POST(req: Request) {
    try {
        const { email, token } = await req.json();

        if (!email || !token) {
            return NextResponse.json({ message: 'Missing email or token' }, { status: 400 });
        }

        const result = await verifyToken(token, 'EMAIL_VERIFICATION');

        if (!result.success || !result.token) {
            return NextResponse.json({ message: result.error }, { status: 400 });
        }

        // Token is valid. Update user status.
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                status: user.role === 'TUTOR' ? 'PENDING' : 'ACTIVE', // Tutors stay pending for manual approval
            }
        });

        await deleteToken(result.token.id);

        return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
