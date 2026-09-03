import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const plan = await query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM user_investments i WHERE i.plan_id = p.id AND i.status = 'active') as active_investments,
              (SELECT SUM(amount) FROM user_investments i WHERE i.plan_id = p.id AND i.status = 'active') as total_invested
       FROM investment_plans p 
       WHERE p.id = $1`,
      [id]
    );

    if (!plan.length) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan: plan[0] });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, percentage, duration, min_investment, max_investment, description, color, featured } = body;

    const plan = await query('SELECT * FROM investment_plans WHERE id = $1', [id]);
    if (!plan.length) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const updates = [];
    const updateParams = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      updateParams.push(name);
    }

    if (percentage !== undefined) {
      updates.push(`percentage = $${paramIndex++}`);
      updateParams.push(percentage);
    }

    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      updateParams.push(duration);
    }

    if (min_investment !== undefined) {
      updates.push(`min_investment = $${paramIndex++}`);
      updateParams.push(min_investment);
    }

    if (max_investment !== undefined) {
      updates.push(`max_investment = $${paramIndex++}`);
      updateParams.push(max_investment);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      updateParams.push(description);
    }

    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      updateParams.push(color);
    }

    if (featured !== undefined) {
      updates.push(`featured = $${paramIndex++}`);
      updateParams.push(featured);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    updateParams.push(id);

    await query(
      `UPDATE investment_plans SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      updateParams
    );

    await logAdminAction(admin.id, 'plan_update', 'plan', id, {
      fields: Object.keys(body)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const plan = await query('SELECT * FROM investment_plans WHERE id = $1', [id]);
    if (!plan.length) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const activeInvestments = await query(
      'SELECT COUNT(*) as count FROM user_investments WHERE plan_id = $1 AND status = $2',
      [id, 'active']
    );

    if (activeInvestments[0].count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active investments' 
      }, { status: 400 });
    }

    await query('DELETE FROM investment_plans WHERE id = $1', [id]);

    await logAdminAction(admin.id, 'plan_delete', 'plan', id, {
      planName: plan[0].name
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
