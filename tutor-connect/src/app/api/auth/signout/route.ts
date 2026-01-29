import { signOut } from '@/auth';

export async function POST() {
    await signOut({ redirectTo: '/landing' });
    return Response.json({ success: true });
}
