import { NextResponse } from 'next/server';
import { query, getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendDepositEmail, sendInvestmentEmail, safeSend } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, paymentMethod, planId, idempotencyKey } = body;

        if (!amount || !paymentMethod) {
            return NextResponse.json({ error: 'Amount and payment method are required' }, { status: 400 });
        }

        const reference = crypto.randomBytes(16).toString('hex').toUpperCase();
        const userId = session.userId;

        // Validate amount
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

        // Idempotency: check key
        if (idempotencyKey) {
            const existing = await query('SELECT * FROM deposits WHERE idempotency_key=$1 AND user_id=$2 LIMIT 1', [idempotencyKey, userId]);
            if (existing.length) {
                return NextResponse.json({ success: true, duplicate: true, reference: existing[0].reference, message: 'Duplicate prevented — deposit already recorded', deposit: existing[0] });
            }
        }
        // Prevent dual submission within 15s same amount+method
        const recent = await query(`SELECT id FROM deposits WHERE user_id=$1 AND amount=$2 AND payment=$3 AND date > NOW() - INTERVAL '15 seconds' AND status != 'failed' LIMIT 1`, [userId, amt, paymentMethod]);
        if (recent.length) {
            return NextResponse.json({ error: 'Duplicate deposit detected. Please wait 15 seconds before retrying.' }, { status: 409 });
        }

        const idemKey = idempotencyKey || `dep_${userId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        // Create deposit record with idempotency
        try {
            await query(
                'INSERT INTO deposits (user_id, amount, type, payment, reference, status, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [userId, amt, 'deposit', paymentMethod, reference, 'pending', idemKey]
            );
        } catch (e) {
            if (String(e.message).includes('duplicate') || String(e.message).includes('unique')) {
                const dupe = await query('SELECT * FROM deposits WHERE idempotency_key=$1 LIMIT 1', [idemKey]);
                if (dupe.length) return NextResponse.json({ success: true, duplicate: true, reference: dupe[0].reference, message: 'Duplicate prevented (idempotency)' });
                return NextResponse.json({ error: 'Duplicate transaction' }, { status: 409 });
            }
            throw e;
        }

        // Create notification for realtime feedback
        try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Deposit Initiated', `Your deposit of $${amt.toFixed(2)} via ${paymentMethod} is pending confirmation. Ref: ${reference}`, 'info']); } catch {}

        // Email for deposit initiated (both user + admin) — non-blocking
        try {
            const u = await query('SELECT email, name FROM users WHERE id=$1', [userId]);
            if (u.length) {
                safeSend(sendDepositEmail({ to: u[0].email, name: u[0].name, amount: amt, method: paymentMethod, reference, status: 'pending' }));
                // also notify admin via existing admin flow? sendDepositEmail to admin as well
                const admin = process.env.ADMIN_EMAIL;
                if (admin) safeSend(sendDepositEmail({ to: admin, name: 'Admin', amount: amt, method: `${paymentMethod} (user ${u[0].email})`, reference, status: 'pending' }));
            }
        } catch {}

        // Handle reinvest from balance (real-time deduction) with atomic SQL check
        if (paymentMethod === 'balance') {
            const deductRes = await query(
                'UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance, email, name',
                [amt, userId]
            );
            if (!deductRes.length) {
                return NextResponse.json({ error: 'Insufficient balance for reinvestment' }, { status: 400 });
            }
            const uUser = deductRes[0];
            try {
                await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Reinvestment Started', `$${amt.toFixed(2)} reinvested from balance • Awaiting profit accrual`, 'success']);
            } catch {}
            // email
            safeSend(sendDepositEmail({ to: uUser.email, name: uUser.name, amount: amt, method: 'balance reinvest', reference, status: 'initiated' }));
        }

        // If planId is provided, create investment
        if (planId) {
            const plan = await query('SELECT * FROM investment_plans WHERE id = $1', [planId]);
            if (plan && plan.length > 0) {
                const planData = plan[0];
                // Validate amount against plan limits
                if (amt < Number(planData.min_investment) || amt > Number(planData.max_investment)) {
                    return NextResponse.json({ error: `Amount must be $${planData.min_investment} - $${planData.max_investment} for ${planData.name}` }, { status: 400 });
                }
                const startDate = new Date();
                const endDate = new Date(startDate);
                if (planData.duration.includes('hours')) {
                    const hours = parseInt(planData.duration);
                    endDate.setHours(endDate.getHours() + hours);
                } else if (planData.duration.includes('days')) {
                    const days = parseInt(planData.duration);
                    endDate.setDate(endDate.getDate() + days);
                }

                await query(
                    'INSERT INTO user_investments (user_id, plan_id, amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [userId, planId, amt, startDate.toISOString(), endDate.toISOString(), 'active']
                );

                let referrerId = null;
                let bonusAmt = 0;
                try {
                    const ref = await query('SELECT referrer_id FROM referrals WHERE referred_id=$1 LIMIT 1', [userId]);
                    if (ref.length) {
                        referrerId = ref[0].referrer_id;
                        bonusAmt = amt * 0.05;
                        await query('UPDATE users SET total_bonus = total_bonus + $1, balance = balance + $1 WHERE id=$2', [bonusAmt, referrerId]);
                        await query('UPDATE referrals SET bonus_amount = bonus_amount + $1, status=$2 WHERE referred_id=$3', [bonusAmt, 'active', userId]);
                        await query('INSERT INTO profit_history (user_id, amount, type, description) VALUES ($1,$2,$3,$4)', [referrerId, bonusAmt, 'referral', `5% referral bonus from user ${userId} investment $${amt}`]);
                        await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [referrerId, 'Referral Bonus Earned!', `You earned $${bonusAmt.toFixed(2)} (5%) from your referral's investment of $${amt.toFixed(2)} - credited instantly`, 'success']);
                    }
                } catch (e) {
                    console.error('Referral bonus error:', e.message);
                }
                // Emails (non-blocking, after commit)
                try {
                    const u = await query('SELECT email, name FROM users WHERE id=$1', [userId]);
                    if (u.length) safeSend(sendInvestmentEmail({ to: u[0].email, name: u[0].name, planName: planData.name, amount: amt, percentage: planData.percentage, duration: planData.duration }));
                } catch {}
                if (referrerId) {
                    try {
                        const rUser = await query('SELECT email, name FROM users WHERE id=$1', [referrerId]);
                        if (rUser.length) safeSend(sendInvestmentEmail({ to: rUser[0].email, name: rUser[0].name, planName: `Referral Bonus from ${userId}`, amount: bonusAmt, percentage: 5, duration: 'instant' }));
                    } catch {}
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            reference,
            message: 'Deposit created successfully' 
        });

    } catch (error) {
        console.error('Deposit Error:', error);
        return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;
        const deposits = await query('SELECT * FROM deposits WHERE user_id = $1 ORDER BY date DESC', [userId]);

        return NextResponse.json({ deposits });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
    }
}
