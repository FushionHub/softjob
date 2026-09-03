import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/admin-auth';

export async function POST() {
    try {
        await clearAdminSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
