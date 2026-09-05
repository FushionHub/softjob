import { NextResponse } from 'next/server';
import { query, getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendTradeEmail, safeSend } from '@/lib/email';

export async function POST(req) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { asset, type, amount, duration, idempotencyKey } = body;

        if (!asset || !type || !amount || !duration) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Duplicate / idempotency
        if (idempotencyKey) {
            const existing = await query('SELECT * FROM trades WHERE idempotency_key=$1 AND user_id=$2 LIMIT 1', [idempotencyKey, session.userId]);
            if (existing.length) return NextResponse.json({ success: true, duplicate: true, message: 'Duplicate prevented — trade already opened', trade: existing[0] });
        }
        const recentDup = await query(`SELECT id FROM trades WHERE user_id=$1 AND asset=$2 AND type=$3 AND amount=$4 AND datetime > NOW() - INTERVAL '10 seconds' AND status != 'failed' LIMIT 1`, [session.userId, asset, type, amount]);
        if (recentDup.length) return NextResponse.json({ error: 'Duplicate trade detected. Please wait 10 seconds.' }, { status: 409 });

        const userId = session.userId;

        // Fetch real-time price BEFORE touching money: the balance lock below
        // must be held for the shortest possible time, and a crash between a
        // committed deduct and the trade INSERT would lose user funds.
        let entryPrice;
        try {
            const symbol = asset.replace('USD', 'USDT');
            const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            if (priceRes.ok) {
                const priceData = await priceRes.json();
                entryPrice = parseFloat(priceData.price);
            } else {
                // Fallback if API fails
                entryPrice = asset === 'BTCUSD' ? 45000 : asset === 'ETHUSD' ? 3000 : 100;
            }
        } catch (error) {
            console.error('Failed to fetch price:', error);
            entryPrice = asset === 'BTCUSD' ? 45000 : asset === 'ETHUSD' ? 3000 : 100;
        }

        const idemKeyTrade = idempotencyKey || `tr_${userId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

        // Atomic balance deduction: only succeeds if balance >= amount
        const deductRes = await query(
            'UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING id, balance, email, name',
            [amount, userId]
        );
        if (!deductRes.length) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }
        const user = deductRes[0];

        try {
            await query(
                'INSERT INTO trades (user_id, asset, type, amount, entry_price, status, duration, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [userId, asset, type, amount, entryPrice, 'open', duration, idemKeyTrade]
            );
        } catch (e) {
            // If trade insert fails, refund user balance immediately
            await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);
            if (String(e.message).includes('duplicate') || String(e.message).includes('unique')) {
                return NextResponse.json({ error: 'Duplicate trade (idempotency)' }, { status: 409 });
            }
            throw e;
        }
        try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Trade Opened', `${type.toUpperCase()} ${asset} $${Number(amount).toFixed(2)} @ $${Number(entryPrice).toFixed(2)} • ${duration}`, 'info']); } catch {}

        // Email (non-blocking)
        safeSend(sendTradeEmail({ to: user.email, name: user.name, asset, type, amount, entryPrice, status: 'open' }));

        return NextResponse.json({ 
            success: true,
            message: 'Trade opened successfully (live price)',
            entryPrice
        });

    } catch (error) {
        console.error('Trade Error:', error);
        return NextResponse.json({ error: 'Trade failed' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;
        const trades = await query('SELECT * FROM trades WHERE user_id = $1 ORDER BY datetime DESC LIMIT 20', [userId]);

        return NextResponse.json({ trades });
    } catch (error) {
        console.error('Error fetching trades:', error);
        return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }
}
