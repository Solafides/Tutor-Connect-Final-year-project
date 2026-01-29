import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        newUser: '/register',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/student') ||
                nextUrl.pathname.startsWith('/tutor') ||
                nextUrl.pathname.startsWith('/staff') ||
                nextUrl.pathname.startsWith('/admin');

            const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnAuth) {
                // Redirect authenticated users to their specific dashboard
                const role = auth.user.role?.toLowerCase();
                if (role) {
                    return Response.redirect(new URL(`/${role}/dashboard`, nextUrl));
                }
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.status = user.status;
            }

            // Update session if trigger is update
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
                session.user.status = token.status as any;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
