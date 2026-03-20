import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // 1. Hash a secure password for the admin
        const hashedPassword = await bcrypt.hash('AdminSecure123!', 10);

        // 2. Create the user directly in the database with the ADMIN role
        const admin = await prisma.user.create({
            data: {
                email: 'admin@tutorconnect.com', // Updated to a default admin email
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
            }
        });

        return NextResponse.json({
            message: 'Super Admin created successfully! PLEASE DELETE THIS FILE NOW.',
            email: admin.email
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to create admin',
            details: error.message
        }, { status: 500 });
    }
}