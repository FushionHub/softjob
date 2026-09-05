import { NextResponse } from 'next/server';
import { query, getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendWithdrawalEmail, safeSend } from '@/lib/email';

export async function POST(req) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, walletAddress, network } = body;

        if (!amount || !walletAddress) {
            return NextResponse.json({ error: 'Amount and wallet address are required' }, { status: 400 });
        }

        if (parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
        }

        const userId = session.userId;

        // Idempotency + duplicate prevention
        const idempotencyKey = body.idempotencyKey || body.idempotency_key;
        if (idempotencyKey) {
            const existing = await query('SELECT * FROM withdrawals WHERE idempotency_key=$1 AND user_id=$2 LIMIT 1', [idempotencyKey, userId]);
            if (existing.length) return NextResponse.json({ success: true, duplicate: true, message: 'Duplicate prevented — withdrawal already requested', withdrawal: existing[0] });
        }
        const recentDup = await query(`SELECT id FROM withdrawals WHERE user_id=$1 AND amount=$2 AND wallet_address=$3 AND created_at > NOW() - INTERVAL '20 seconds' AND status != 'failed' LIMIT 1`, [userId, parseFloat(amount), walletAddress]);
        if (recentDup.length) return NextResponse.json({ error: 'Duplicate withdrawal detected. Please wait 20 seconds.' }, { status: 409 });

        const users = await query('SELECT balance, email, name FROM users WHERE id = $1', [userId]);
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const balance = parseFloat(users[0].balance || 0);
        const pendingRes = await query(
            "SELECT COALESCE(SUM(amount), 0) as pending_total FROM withdrawals WHERE user_id = $1 AND status = 'pending'",
            [userId]
        );
        const pendingAmount = parseFloat(pendingRes[0]?.pending_total || 0);
        const availableBalance = balance - pendingAmount;

        if (availableBalance < parseFloat(amount)) {
            return NextResponse.json({
                error: `Insufficient available balance. Pending withdrawals: $${pendingAmount.toFixed(2)}. Available: $${Math.max(0, availableBalance).toFixed(2)}`
            }, { status: 400 });
        }

        const amt = parseFloat(amount);
        const idemKey = idempotencyKey || `wd_${userId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        try {
            await query(
                'INSERT INTO withdrawals (user_id, amount, wallet_address, network, status, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, amt, walletAddress, network || 'bitcoin', 'pending', idemKey]
            );
        } catch (e) {
            if (String(e.message).includes('duplicate') || String(e.message).includes('unique')) {
                return NextResponse.json({ error: 'Duplicate transaction (idempotency)' }, { status: 409 });
            }
            throw e;
        }
        // Do not deduct immediately; mark as pending. Balance stays until admin approves.
        try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Withdrawal Requested', `Your withdrawal of $${amt.toFixed(2)} to ${network||'wallet'} is pending approval.`, 'info']); } catch {}

        // Email (non-blocking)
        safeSend(sendWithdrawalEmail({ to: users[0].email, name: users[0].name, amount: amt, walletAddress, network: network||'bitcoin', status: 'pending' }));
        // Admin email
        try {
            const admin = process.env.ADMIN_EMAIL;
            if (admin) safeSend(sendWithdrawalEmail({ to: admin, name: 'Admin', amount: amt, walletAddress: `${walletAddress} (user ${users[0].email})`, network: network||'bitcoin', status: 'pending' }));
        } catch {}

        return NextResponse.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
        });

    } catch (error) {
        console.error('Withdrawal Error:', error);
        return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;
        const withdrawals = await query(
            'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return NextResponse.json({ withdrawals });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }
}
