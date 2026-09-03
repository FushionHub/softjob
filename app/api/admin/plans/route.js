import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM user_investments i WHERE i.plan_id = p.id AND i.status = 'active') as active_investments,
              (SELECT SUM(amount) FROM user_investments i WHERE i.plan_id = p.id AND i.status = 'active') as total_invested
       FROM investment_plans p 
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, percentage, duration, min_investment, max_investment, description, color, featured } = body;

    if (!name || !percentage || !duration || !min_investment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO investment_plans (name, percentage, duration, min_investment, max_investment, description, color, featured, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [name, percentage, duration, min_investment, max_investment || null, description || null, color || '#3B82F6', featured || false]
    );

    await logAdminAction(admin.id, 'plan_create', 'plan', result[0].id, {
      name,
      percentage,
      duration
    });

    return NextResponse.json({ 
      success: true, 
      planId: result[0].id 
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
