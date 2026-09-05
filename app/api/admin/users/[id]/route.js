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

    const userResult = await query(
      `SELECT id, name, email, username, balance, total_deposit, total_withdrawal,
              kyc_status, is_active, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const transactionsResult = await query(
      `(
        SELECT 'deposit' as type, id, amount, status, created_at
        FROM deposits WHERE user_id = $1
       )
       UNION ALL
       (
        SELECT 'withdrawal' as type, id, amount, status, created_at
        FROM withdrawals WHERE user_id = $1
       )
       UNION ALL
       (
        SELECT 'trade' as type, id, amount, status, created_at
        FROM trades WHERE user_id = $1
       )
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    await logAdminAction(admin.id, 'view_user', 'user', id, {});

    return NextResponse.json({
      user: userResult[0],
      recent_transactions: transactionsResult
    });
  } catch (error) {
    console.error('Get user error:', error);
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

    const allowedFields = [
      'name', 'email', 'balance', 'kyc_status', 'is_active', 'username'
    ];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    const changes = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        changes[field] = body[field];
        paramIndex++;
      }
    }

    if (body.add_balance !== undefined) {
      updates.push(`balance = balance + $${paramIndex}`);
      values.push(body.add_balance);
      changes.add_balance = body.add_balance;
      paramIndex++;
    }

    // NOTE: per-coin balance columns (coins_*) do not exist in the schema.
    // The injectable dynamic-column branch was removed. Use the atomic
    // POST /api/admin/users/[id]/balance endpoint for balance adjustments.
    if (body.coin !== undefined || body.coin_amount !== undefined) {
      return NextResponse.json({ error: 'Per-coin balances are not supported. Use add_balance or the /balance endpoint.' }, { status: 400 });
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} RETURNING id`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await logAdminAction(admin.id, 'update_user', 'user', id, { changes });

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      await query('DELETE FROM users WHERE id = $1', [id]);
    } else {
      await query(
        'UPDATE users SET is_active = false, deleted_at = NOW() WHERE id = $1',
        [id]
      );
    }

    await logAdminAction(admin.id, 'delete_user', 'user', id, { hard_delete: hardDelete });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
