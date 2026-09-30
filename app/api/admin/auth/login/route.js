import { NextResponse } from 'next/server';
import { authenticateAdmin, signAdminToken, setAdminSessionCookie } from '@/lib/admin-auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const admin = await authenticateAdmin(email, password);
        if (!admin) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const token = await signAdminToken({ adminId: admin.id });
        await setAdminSessionCookie(admin.id);

        const response = NextResponse.json({
            success: true,
            redirect: '/admin',
            admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
        });

        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24
        });

        return response;
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
