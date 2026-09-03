import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET(request) {
    try {
        const admin = await getAdminSession(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: true, admin, ...admin });
    } catch (error) {
        console.error('Admin me error:', error);
        return NextResponse.json({ error: 'Failed to get admin session' }, { status: 500 });
    }
}
