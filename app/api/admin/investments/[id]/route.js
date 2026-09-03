import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, profit, end_date } = body;

    const investment = await query('SELECT * FROM user_investments WHERE id = $1', [id]);
    if (!investment.length) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    const updates = [];
    const updateParams = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      updateParams.push(status);
    }

    if (profit !== undefined) {
      updates.push(`profit = $${paramIndex++}`);
      updateParams.push(profit);
    }

    if (end_date) {
      updates.push(`end_date = $${paramIndex++}`);
      updateParams.push(end_date);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    updateParams.push(id);

    await query(
      `UPDATE user_investments SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      updateParams
    );

    await logAdminAction(admin.id, 'investment_update', 'investment', id, {
      status,
      profit,
      end_date
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating investment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
