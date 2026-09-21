import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { sendDepositEmail, safeSend } from '@/lib/email';

async function handleDepositUpdate(request, { params }) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, note } = body;

    const rawStatus = (status || '').toLowerCase().trim();
    const validStatuses = ['pending', 'confirmed', 'approved', 'completed', 'rejected'];
    if (!rawStatus || !validStatuses.includes(rawStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, confirmed, or rejected' },
        { status: 400 }
      );
    }

    const isApprove = ['confirmed', 'approved', 'completed'].includes(rawStatus);
    const newStatus = isApprove ? 'approved' : rawStatus;

    let depositResult;
    try {
      depositResult = await query(
        'SELECT id, user_id, amount, payment, reference, status as current_status, plan_id FROM deposits WHERE id = $1',
        [id]
      );
    } catch {
      depositResult = await query(
        'SELECT id, user_id, amount, payment, reference, status as current_status FROM deposits WHERE id = $1',
        [id]
      );
    }

    if (!depositResult || depositResult.length === 0) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const deposit = depositResult[0];
    const previousStatus = deposit.current_status;
    const isPreviouslyApproved = ['confirmed', 'approved', 'completed'].includes(previousStatus);

    await query(
      'UPDATE deposits SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    // Fetch user details for notification and email
    let userRecord = null;
    try {
      const uRows = await query('SELECT id, name, email, balance, total_deposit FROM users WHERE id = $1', [deposit.user_id]);
      if (uRows.length) userRecord = uRows[0];
    } catch {}

    if (isApprove && !isPreviouslyApproved) {
      const depAmt = parseFloat(deposit.amount);

      if (deposit.plan_id) {
        // Confirmed deposit for an investment plan
        const plans = await query('SELECT * FROM investment_plans WHERE id = $1', [deposit.plan_id]);
        if (plans.length > 0) {
          const planData = plans[0];
          const startDate = new Date();
          const endDate = new Date(startDate);
          if (planData.duration.includes('hours')) {
            const hours = parseInt(planData.duration, 10);
            endDate.setHours(endDate.getHours() + hours);
          } else if (planData.duration.includes('days')) {
            const days = parseInt(planData.duration, 10);
            endDate.setDate(endDate.getDate() + days);
          }

          await query(
            'UPDATE users SET total_deposit = COALESCE(total_deposit, 0) + $1 WHERE id = $2',
            [depAmt, deposit.user_id]
          );

          await query(
            'INSERT INTO user_investments (user_id, plan_id, amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [deposit.user_id, deposit.plan_id, depAmt, startDate.toISOString(), endDate.toISOString(), 'active']
          );

          try {
            await query(
              'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
              [deposit.user_id, 'Deposit & Investment Confirmed', `Your deposit of $${depAmt.toFixed(2)} was approved and your ${planData.name} plan is now active.`, 'success', '/investment-history']
            );
          } catch {}
        } else {
          await query(
            'UPDATE users SET balance = balance + $1, total_deposit = COALESCE(total_deposit, 0) + $1 WHERE id = $2',
            [depAmt, deposit.user_id]
          );
          try {
            await query(
              'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
              [deposit.user_id, 'Deposit Confirmed', `Your deposit of $${depAmt.toFixed(2)} has been approved and credited to your balance.`, 'success', '/dashboard']
            );
          } catch {}
        }
      } else {
        // Regular confirmed deposit: credit balance and total_deposit
        await query(
          'UPDATE users SET balance = balance + $1, total_deposit = COALESCE(total_deposit, 0) + $1 WHERE id = $2',
          [depAmt, deposit.user_id]
        );
        try {
          await query(
            'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
            [deposit.user_id, 'Deposit Confirmed', `Your deposit of $${depAmt.toFixed(2)} has been approved and credited to your account.`, 'success', '/dashboard']
          );
        } catch {}
      }

      // Send confirmation email with security advisory
      if (userRecord?.email) {
        safeSend(sendDepositEmail({
          to: userRecord.email,
          name: userRecord.name || 'Trader',
          amount: depAmt,
          method: deposit.payment || 'Crypto Deposit',
          reference: deposit.reference || `DEP-${id}`,
          status: 'approved'
        }));
      }

      // Award 5% referral bonus if referred
      try {
        const ref = await query('SELECT referrer_id FROM referrals WHERE referred_id = $1 LIMIT 1', [deposit.user_id]);
        if (ref.length) {
          const referrerId = ref[0].referrer_id;
          const bonusAmt = depAmt * 0.05;
          await query('UPDATE users SET total_bonus = COALESCE(total_bonus, 0) + $1, balance = balance + $1 WHERE id = $2', [bonusAmt, referrerId]);
          await query('UPDATE referrals SET bonus_amount = COALESCE(bonus_amount, 0) + $1, status = $2 WHERE referred_id = $3', [bonusAmt, 'active', deposit.user_id]);
          await query('INSERT INTO profit_history (user_id, amount, type, description) VALUES ($1, $2, $3, $4)', [referrerId, bonusAmt, 'referral', `5% referral bonus from deposit $${depAmt.toFixed(2)}`]);
          await query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', [referrerId, 'Referral Bonus Earned!', `You earned $${bonusAmt.toFixed(2)} (5%) from your referral's confirmed deposit of $${depAmt.toFixed(2)}.`, 'success']);
        }
      } catch (refErr) {
        console.error('Deposit confirmation referral bonus error:', refErr);
      }
    }

    if (newStatus === 'rejected') {
      if (isPreviouslyApproved) {
        await query(
          'UPDATE users SET balance = GREATEST(0, balance - $1), total_deposit = GREATEST(0, total_deposit - $1) WHERE id = $2',
          [deposit.amount, deposit.user_id]
        );
      }
      try {
        await query(
          'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
          [deposit.user_id, 'Deposit Rejected', `Your deposit request of $${Number(deposit.amount).toFixed(2)} was rejected.${note ? ' Reason: ' + note : ''}`, 'error', '/deposit']
        );
      } catch {}

      if (userRecord?.email) {
        safeSend(sendDepositEmail({
          to: userRecord.email,
          name: userRecord.name || 'Trader',
          amount: deposit.amount,
          method: deposit.payment || 'Crypto',
          reference: deposit.reference || `DEP-${id}`,
          status: 'rejected'
        }));
      }
    }

    await logAdminAction(admin.id, 'update_deposit', 'deposit', id, {
      user_id: deposit.user_id,
      amount: deposit.amount,
      previous_status: previousStatus,
      new_status: newStatus,
      note
    });

    return NextResponse.json({
      success: true,
      deposit_id: id,
      previous_status: previousStatus,
      new_status: newStatus,
      amount: deposit.amount
    });
  } catch (error) {
    console.error('Update deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  return handleDepositUpdate(request, context);
}

export async function PATCH(request, context) {
  return handleDepositUpdate(request, context);
}
