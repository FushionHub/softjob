import { NextResponse } from 'next/server';
import { authenticateAdmin, setAdminSessionCookie } from '@/lib/admin-auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const admin = await authenticateAdmin(email, password);
        if (!admin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await setAdminSessionCookie(admin.id);

        return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
