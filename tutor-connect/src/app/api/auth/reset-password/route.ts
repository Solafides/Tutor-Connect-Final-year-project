import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, deleteToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/utils';

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const result = await verifyToken(token, 'PASSWORD_RESET');

        if (!result.success || !result.token) {
            return NextResponse.json({ message: result.error }, { status: 400 });
        }

        const email = result.token.email;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        await deleteToken(result.token.id);

        return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
