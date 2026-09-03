import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import crypto from 'crypto';

// Live-only helper to create pending deposit record
async function createPendingDeposit(userId, amount, paymentMethod, checkoutId) {
  const reference = checkoutId ? `BACHS-${checkoutId.slice(0,12).toUpperCase()}` : crypto.randomBytes(8).toString('hex').toUpperCase();
  const res = await query(
    'INSERT INTO deposits (user_id, amount, type, payment, reference, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [userId, amount, 'deposit', paymentMethod, reference, 'pending']
  );
  const depositId = res[0]?.id;
  try {
    await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [userId, 'Deposit Checkout Created', `Your $${Number(amount).toFixed(2)} deposit via ${paymentMethod} checkout ${checkoutId || reference} is open. Complete payment on Bachs.`, 'info']);
  } catch {}
  return { depositId, reference };
}

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRows = await query('SELECT id,email,name,username FROM users WHERE id=$1', [session.userId]);
    if (!userRows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userRows[0];

    const body = await req.json();
    const { amount, paymentMethod = 'card', currency = 'USD', coin } = body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (amt < 10) return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 });

    // Live-only — no demo fallback. Bachs live key required for every deposit.
    const bachsKey = process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY;
    const baseUrl = process.env.BACHS_API_BASE || 'https://api.bachs.io';
    const hasKey = !!bachsKey && !bachsKey.startsWith('sk_sandbox_') && !bachsKey.startsWith('sk_test_');

    if (!hasKey) {
      return NextResponse.json({ error: 'Live checkout unavailable — BACHS_API_KEY (sk_live_...) not configured. Set it in .env to enable real-time deposits via Bachs.io.' }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/deposit?success=1`;
    const cancelUrl = `${appUrl}/deposit?canceled=1`;

    const amountStr = amt.toFixed(2);
    const payload = {
      pricing: {
        amount: amountStr,
        currency: (currency || 'USD').toUpperCase(),
        price_type: 'fixed',
      },
      customer: {
        email: user.email,
        name: user.name || user.username,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      reference: `emp-${session.userId}-${Date.now()}`.slice(0, 128),
      metadata: {
        user_id: String(session.userId),
        coin: coin || '',
        payment_method: paymentMethod,
      },
      expires_in_minutes: 60,
    };

    const res = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bachsKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errDetail = data?.detail || data?.message || data?.error || `Bachs returned ${res.status}`;
      const fieldErrors = data?.errors ? ` | fields: ${data.errors.map(e=>`${e.field}:${e.message}`).join(', ')}` : '';
      const code = data?.error_code ? ` [${data.error_code}]` : '';
      console.error('Bachs live checkout failed (real-time, no fallback)', res.status, JSON.stringify(data));
      return NextResponse.json({ error: `${errDetail}${code}${fieldErrors}`, details: data, error_code: data?.error_code }, { status: res.status });
    }

    const checkoutId = data.checkout_id || data.id || data.checkoutId;
    const checkoutUrl = data.checkout_url || data.checkoutUrl || data.url;

    if (!checkoutUrl) {
      console.error('Bachs missing checkout_url (real-time)', data);
      return NextResponse.json({ error: 'Bachs did not return checkout URL — no demo fallback. Check BACHS_API_KEY and try again.', details: data }, { status: 500 });
    }

    // Create pending deposit linked to this live checkout
    const { reference } = await createPendingDeposit(session.userId, amt, paymentMethod + (coin ? `-${coin}` : ''), checkoutId);

    return NextResponse.json({
      mode: 'live',
      checkout_id: checkoutId,
      checkout_url: checkoutUrl,
      reference,
      expires_at: data.expires_at,
      status: data.status || 'open',
    });
  } catch (e) {
    console.error('Bachs live create-checkout error', e);
    return NextResponse.json({ error: e.message || 'Failed to create live checkout' }, { status: 500 });
  }
}
