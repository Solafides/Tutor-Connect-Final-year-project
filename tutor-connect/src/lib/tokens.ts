import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const generateVerificationToken = async (email: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => {
    let token: string;
    let expiresAt: Date;
    
    if (type === 'EMAIL_VERIFICATION' || type === 'PASSWORD_RESET') {
        // 6-digit OTP
        token = Math.floor(100000 + Math.random() * 900000).toString();
        // Expires in 15 minutes
        expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);
    }

    // Check if token already exists for this email and type, delete it
    const existingToken = await prisma.verificationToken.findFirst({
        where: { email, type }
    });

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: { id: existingToken.id }
        });
    }

    const verificationToken = await prisma.verificationToken.create({
        data: {
            email,
            token,
            type,
            expiresAt
        }
    });

    return verificationToken;
};

export const verifyToken = async (token: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => {
    const existingToken = await prisma.verificationToken.findFirst({
        where: { token, type }
    });

    if (!existingToken) {
        return { success: false, error: 'Invalid token' };
    }

    const hasExpired = new Date(existingToken.expiresAt) < new Date();

    if (hasExpired) {
        return { success: false, error: 'Token has expired' };
    }

    return { success: true, token: existingToken };
};

export const deleteToken = async (id: string) => {
    await prisma.verificationToken.delete({
        where: { id }
    });
};
