import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/utils';
import { registerSchema } from '@/lib/validations';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            const formattedErrors = result.error.flatten().fieldErrors;
            const errorMessages = Object.entries(formattedErrors)
                .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
                .join('; ');
            
            return NextResponse.json(
                { 
                    message: errorMessages || 'Invalid input', 
                    errors: formattedErrors 
                },
                { status: 400 }
            );
        }

        const { email, password, fullName, role, phone } = result.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        // Create user and profile in a transaction
        const newUser = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash: await hashPassword(password),
                    role: role as UserRole,
                    status: role === 'TUTOR' ? 'PENDING' : 'ACTIVE', // Tutors need approval
                },
            });

            // 2. Create Profile based on role
            if (role === 'STUDENT') {
                await tx.studentProfile.create({
                    data: {
                        userId: user.id,
                        fullName,
                        phone,
                    },
                });

                // Create initial wallet for student
                await tx.wallet.create({
                    data: {
                        userId: user.id,
                    }
                });
            } else if (role === 'TUTOR') {
                await tx.tutorProfile.create({
                    data: {
                        userId: user.id,
                        fullName,
                        phone,
                        hourlyRate: 0, // Set default or force update later
                        verificationStatus: 'PENDING',
                    },
                });

                // Create wallet for tutor
                await tx.wallet.create({
                    data: {
                        userId: user.id,
                    }
                });
            }

            return user;
        });

        return NextResponse.json(
            { message: 'User created successfully', userId: newUser.id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        
        // Provide more detailed error messages
        if (error.code === 'P2002') {
            return NextResponse.json(
                { message: 'Email already exists' },
                { status: 409 }
            );
        }
        
        return NextResponse.json(
            { 
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
