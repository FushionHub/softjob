import { NextResponse } from 'next/server';
import { query, getDb } from '@/lib/db';
import { sendDepositEmail, safeSend } from '@/lib/email';
import crypto from 'crypto';

// Verify Bachs webhook signature with HMAC-SHA256
function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sig = signature.replace(/^sha256=/, '').trim();
    if (expected.length !== sig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch { return false; }
}

export async function POST(req) {
  const raw = await req.text();
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const sig = req.headers.get('x-bachs-signature') || req.headers.get('bachs-signature') || req.headers.get('X-Bachs-Signature') || req.headers.get('signature') || '';
  const secret = process.env.BACHS_WEBHOOK_SECRET || process.env.BACHS_WEBHOOK_KEY || '';

  if (!secret) {
    console.error('Bachs webhook error: BACHS_WEBHOOK_SECRET is not configured in .env');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 503 });
  }

  if (!sig || !verifySignature(raw, sig, secret)) {
    console.error('Bachs webhook error: Invalid or missing signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const type = event.type || event.event || '';
  // Expect collection.succeeded per docs
  if (type !== 'collection.succeeded' && type !== 'checkout.completed' && !type.includes('succeeded')) {
    // Acknowledge other events but no action
    return NextResponse.json({ received: true, ignored: type });
  }

  const data = event.data || event.object || event;
  const checkoutId = data.checkout_id || data.checkoutId || event.checkout_id;
  const amountStr = data.amount || data.pricing?.amount;
  const currency = data.currency || data.pricing?.currency || 'USD';
  const amount = amountStr ? parseFloat(amountStr) : null;

  // Reference is our emp-{userId}-{ts} or deposit reference
  const reference = checkoutId ? `BACHS-${String(checkoutId).slice(0, 12).toUpperCase()}` : null;

  try {
    // Find pending deposits matching this checkout
    // We stored reference as BACHS-<prefix>
    let deposits = [];
    if (checkoutId) {
      const prefix = `BACHS-${String(checkoutId).slice(0, 12).toUpperCase()}`;
      deposits = await query("SELECT * FROM deposits WHERE reference=$1 AND status='pending' ORDER BY date DESC LIMIT 5", [prefix]);
      if (!deposits.length) {
        // fallback: find most recent pending deposit for the user derived from metadata if present
        const userId = data.metadata?.user_id || event.metadata?.user_id;
        if (userId) {
          deposits = await query("SELECT * FROM deposits WHERE user_id=$1 AND status='pending' ORDER BY date DESC LIMIT 1", [userId]);
        }
      }
    }

    let fulfilled = 0;
    for (const dep of deposits) {
      // Atomic fulfilment: only updates if deposit status is currently 'pending'.
      // If a concurrent request or retry already processed it, 0 rows are returned.
      const updatedDeposits = await query(
        "UPDATE deposits SET status = 'approved', updated_at = NOW() WHERE id = $1 AND status = 'pending' RETURNING id, user_id, amount, payment, reference",
        [dep.id]
      );
      if (!updatedDeposits.length) {
        continue;
      }
      const credited = updatedDeposits[0];
      await query(
        'UPDATE users SET balance = balance + $1, total_deposit = COALESCE(total_deposit, 0) + $1 WHERE id = $2',
        [credited.amount, credited.user_id]
      );
      fulfilled++;

      // Side effects below run only after money moved — safe to retry.
      // Referral bonus 5% if applicable
      try {
        const ref = await query('SELECT referrer_id FROM referrals WHERE referred_id=$1 LIMIT 1', [credited.user_id]);
        if (ref.length) {
          const bonus = Number(credited.amount) * 0.05;
          await query('UPDATE users SET total_bonus = total_bonus + $1, balance = balance + $1 WHERE id=$2', [bonus, ref[0].referrer_id]);
          await query('UPDATE referrals SET bonus_amount = bonus_amount + $1, status=$2 WHERE referred_id=$3', [bonus, 'active', credited.user_id]);
          await query('INSERT INTO profit_history (user_id, amount, type, description) VALUES ($1,$2,$3,$4)', [ref[0].referrer_id, bonus, 'referral', `5% bonus from deposit $${credited.amount}`]);
          await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [ref[0].referrer_id, 'Referral Bonus!', `+$${bonus.toFixed(2)} from your referral's $${Number(credited.amount).toFixed(2)} deposit (approved via Bachs)`, 'success']);
        }
      } catch {}

      await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [credited.user_id, 'Deposit Approved ✓', `Your $${Number(credited.amount).toFixed(2)} deposit ${reference || ''} via Bachs is approved and credited.`, 'success']);
      await query('INSERT INTO profit_history (user_id, amount, type, description) VALUES ($1,$2,$3,$4)', [credited.user_id, credited.amount, 'deposit', `Bachs deposit approved ${reference || credited.reference} ${amount ? `amount ${amount} ${currency}` : ''}`]);
      // Email for approved deposit (non-blocking)
      try {
        const u = await query('SELECT email, name FROM users WHERE id=$1', [credited.user_id]);
        if (u.length) safeSend(sendDepositEmail({ to: u[0].email, name: u[0].name, amount: credited.amount, method: credited.payment || 'Bachs', reference: credited.reference, status: 'approved' }));
      } catch {}
    }

    return NextResponse.json({ received: true, fulfilled });
  } catch (e) {
    console.error('Bachs webhook fulfil error', e);
    return NextResponse.json({ error: 'Fulfilment failed' }, { status: 500 });
  }
}

// Allow GET for verification/ping
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'bachs webhook', expects: 'collection.succeeded POST' });
}
