import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/utils';
import { loginSchema } from '@/lib/validations';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = loginSchema.safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    const passwordsMatch = await verifyPassword(password, user.passwordHash);
                    if (passwordsMatch) return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    session: { strategy: 'jwt' },
});
