import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const plans = await query('SELECT * FROM investment_plans ORDER BY min_investment ASC');
        return NextResponse.json({ plans });
    } catch (error) {
        console.error('Error fetching investment plans:', error);
        return NextResponse.json({ error: 'Failed to fetch investment plans' }, { status: 500 });
    }
}
