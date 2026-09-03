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
    const { status, note } = await request.json();

    if (!status || !['pending', 'confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, confirmed, or rejected' },
        { status: 400 }
      );
    }

    const depositResult = await query(
      'SELECT id, user_id, amount, status as current_status FROM deposits WHERE id = $1',
      [id]
    );

    if (depositResult.length === 0) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const deposit = depositResult[0];
    const previousStatus = deposit.current_status;

    await query(
      'UPDATE deposits SET status = $1 WHERE id = $2',
      [status, id]
    );

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      await query(
        'UPDATE users SET balance = balance + $1, total_deposit = total_deposit + $1 WHERE id = $2',
        [deposit.amount, deposit.user_id]
      );
      try {
        await query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [deposit.user_id, 'Deposit Confirmed', `Your deposit of $${deposit.amount} has been approved and credited to your account.`, 'success']
        );
      } catch {}
    }

    if (status === 'rejected') {
      if (previousStatus === 'confirmed') {
        await query(
          'UPDATE users SET balance = GREATEST(0, balance - $1), total_deposit = GREATEST(0, total_deposit - $1) WHERE id = $2',
          [deposit.amount, deposit.user_id]
        );
      }
      try {
        await query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [deposit.user_id, 'Deposit Rejected', `Your deposit request of $${deposit.amount} was rejected.${note ? ' Reason: ' + note : ''}`, 'error']
        );
      } catch {}
    }

    await logAdminAction(admin.id, 'update_deposit', 'deposit', id, {
      user_id: deposit.user_id,
      amount: deposit.amount,
      previous_status: previousStatus,
      new_status: status,
      note
    });

    return NextResponse.json({
      success: true,
      deposit_id: id,
      previous_status: previousStatus,
      new_status: status,
      amount: deposit.amount
    });
  } catch (error) {
    console.error('Update deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
