import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { amount, coin, type, note } = await request.json();

    if (!amount || !type || !['add', 'deduct'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid amount or type' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (type === 'deduct') {
      const userCheck = await query('SELECT balance FROM users WHERE id = $1', [id]);
      if (userCheck.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const currentBalance = parseFloat(userCheck[0].balance || 0);
      if (currentBalance < numericAmount) {
        return NextResponse.json(
          { error: `Insufficient balance. Current user balance is $${currentBalance.toFixed(2)}.` },
          { status: 400 }
        );
      }

      const result = await query(
        `UPDATE users SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND balance >= $1
         RETURNING id, balance`,
        [numericAmount, id]
      );

      if (result.length === 0) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      const newBalance = parseFloat(result[0].balance);
      await logAdminAction(admin.id, 'adjust_balance', 'user', id, {
        amount: numericAmount,
        coin: coin || 'USD',
        type,
        note,
        new_balance: newBalance
      });

      return NextResponse.json({
        success: true,
        new_balance: newBalance,
        adjustment: numericAmount,
        type
      });
    } else {
      const result = await query(
        `UPDATE users SET balance = balance + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, balance`,
        [numericAmount, id]
      );

      if (result.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const newBalance = parseFloat(result[0].balance);
      await logAdminAction(admin.id, 'adjust_balance', 'user', id, {
        amount: numericAmount,
        coin: coin || 'USD',
        type,
        note,
        new_balance: newBalance
      });

      return NextResponse.json({
        success: true,
        new_balance: newBalance,
        adjustment: numericAmount,
        type
      });
    }
  } catch (error) {
    console.error('Adjust balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
