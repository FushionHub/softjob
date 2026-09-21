import { NextResponse } from 'next/server';
import { authenticateAdmin, setAdminSessionCookie } from '@/lib/admin-auth';

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Add 12-second timeout guard to prevent connection hanging during cold starts
        const authPromise = authenticateAdmin(email, password);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DB_TIMEOUT')), 12000)
        );

        const admin = await Promise.race([authPromise, timeoutPromise]);
        if (!admin) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        await setAdminSessionCookie(admin.id);

        return NextResponse.json({
            success: true,
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        if (error.message === 'DB_TIMEOUT') {
            return NextResponse.json({
                error: 'Database connection is waking up. Please wait a few seconds and try again.'
            }, { status: 504 });
        }
        return NextResponse.json({ error: 'Login failed. Please check credentials and try again.' }, { status: 500 });
    }
}
