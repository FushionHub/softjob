import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { safeSend, sendWithdrawalEmail } from '@/lib/email';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const rows = await query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (!rows.length) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    const withdrawal = rows[0];

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    if (status === 'approved') {
      const userRes = await query('SELECT balance FROM users WHERE id = $1', [withdrawal.user_id]);
      const currentBalance = parseFloat(userRes[0]?.balance || 0);
      const reqAmount = parseFloat(withdrawal.amount);

      if (currentBalance < reqAmount) {
        return NextResponse.json({
          error: `Cannot approve withdrawal: User balance ($${currentBalance.toFixed(2)}) is less than requested withdrawal amount ($${reqAmount.toFixed(2)}).`
        }, { status: 400 });
      }

      const updateRes = await query(
        `UPDATE users SET balance = balance - $1, total_withdrawal = COALESCE(total_withdrawal, 0) + $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
        [reqAmount, withdrawal.user_id]
      );

      if (!updateRes.length) {
        return NextResponse.json({ error: 'Failed to debit balance: Insufficient funds or concurrent update.' }, { status: 400 });
      }
    }

    await query(
      `UPDATE withdrawals SET status = $1, processed_at = NOW() WHERE id = $2`,
      [status, id]
    );

    const userRows = await query('SELECT id, name, email FROM users WHERE id = $1', [withdrawal.user_id]);
    if (userRows[0]) {
      const u = userRows[0];
      safeSend(sendWithdrawalEmail({
        to: u.email,
        name: u.name,
        amount: withdrawal.amount,
        walletAddress: withdrawal.wallet_address,
        network: withdrawal.network || 'bitcoin',
        status
      }));
    }

    await query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', [
      withdrawal.user_id,
      `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your withdrawal of $${withdrawal.amount} has been ${status}.${note ? ' Note: ' + note : ''}`,
      status === 'approved' ? 'success' : 'error'
    ]);

    await logAdminAction(admin.id, 'withdrawal_update', 'withdrawal', parseInt(id), { status, note });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
