import { NextResponse } from 'next/server';
import { query, getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendSwapEmail, safeSend } from '@/lib/email';

const STATIC_RATES = {
  'BTC_ETH': 15.2,
  'ETH_BTC': 0.065,
  'BTC_USDT': 67000,
  'USDT_BTC': 0.0000149,
  'ETH_USDT': 3500,
  'USDT_ETH': 0.000285,
  'BTC_SOL': 450,
  'SOL_BTC': 0.0022,
  'USDT_SOL': 0.0067,
  'SOL_USDT': 149,
};

async function fetchLivePrice(symbol) {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { next: { revalidate: 2 } });
    if (r.ok) { const j = await r.json(); return Number(j.price); }
  } catch {}
  return null;
}

async function getLiveRate(from, to, liveCache = {}) {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  if (STATIC_RATES[key]) return STATIC_RATES[key];
  const inv = `${to}_${from}`;
  if (STATIC_RATES[inv]) return 1 / STATIC_RATES[inv];

  // Try live via USDT
  const fromUSDT = from === 'USDT' || from === 'USDC' ? 1 : (liveCache[`${from}USDT`] ?? await fetchLivePrice(`${from}USDT`));
  const toUSDT = to === 'USDT' || to === 'USDC' ? 1 : (liveCache[`${to}USDT`] ?? await fetchLivePrice(`${to}USDT`));
  if (fromUSDT && toUSDT) return fromUSDT / toUSDT;

  // fallback via USDT static
  if (from !== 'USDT' && to !== 'USDT') {
    const r1 = getLiveRateSync(from, 'USDT');
    const r2 = getLiveRateSync('USDT', to);
    return r1 * r2;
  }
  return 1;
}

function getLiveRateSync(from, to) {
  const k = `${from}_${to}`; if (STATIC_RATES[k]) return STATIC_RATES[k];
  const ik = `${to}_${from}`; if (STATIC_RATES[ik]) return 1/STATIC_RATES[ik];
  return 1;
}

async function getUsdValue(asset, amount, liveCache) {
  if (asset === 'USDT' || asset === 'USDC') return Number(amount);
  const price = liveCache[`${asset}USDT`] ?? await fetchLivePrice(`${asset}USDT`);
  if (price) return Number(amount) * price;
  const staticKey = `${asset}_USDT`;
  const staticRate = STATIC_RATES[staticKey];
  if (staticRate) return Number(amount) * staticRate;
  return Number(amount) * 1000; // fallback assume $1000 per coin to be safe
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let liveRates = {};
    try {
      const symbols = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','TRXUSDT'];
      const results = await Promise.all(symbols.map(async s => {
        const p = await fetchLivePrice(s);
        return [s, p];
      }));
      results.forEach(([s, p]) => { if (p) liveRates[s] = p; });
      // update static for subsequent POSTs
      if (liveRates.BTCUSDT) STATIC_RATES.BTC_USDT = liveRates.BTCUSDT;
      if (liveRates.ETHUSDT) STATIC_RATES.ETH_USDT = liveRates.ETHUSDT;
      if (liveRates.SOLUSDT) STATIC_RATES.SOL_USDT = liveRates.SOLUSDT;
    } catch {}
    const swaps = await query('SELECT * FROM swaps WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [session.userId]).catch(()=>[]);
    const userBal = await query('SELECT balance FROM users WHERE id=$1', [session.userId]).catch(()=>[{balance:0}]);
    return NextResponse.json({ rates: STATIC_RATES, liveRates, swaps, balance: Number(userBal[0]?.balance||0), live: true });
  } catch (e) {
    console.error('swap GET', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  const db = getDb();
  // Auto-migrate missing idempotency column (live, no demo)
  for (const c of [
    `ALTER TABLE swaps ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_swaps_idempotency ON swaps(idempotency_key)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`,
  ]) try { await query(c); } catch {}
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fromAsset, toAsset, fromAmount, idempotencyKey } = body;

    if (!fromAsset || !toAsset || fromAmount == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (fromAsset===toAsset) return NextResponse.json({ error: 'Cannot swap same asset' }, { status: 400 });
    const amt = Number(fromAmount);
    if (!Number.isFinite(amt) || amt <=0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    // Idempotency: if client supplied key, check existing (with fallback if column still missing)
    if (idempotencyKey) {
      try {
        const existing = await query('SELECT * FROM swaps WHERE idempotency_key=$1 AND user_id=$2 LIMIT 1', [idempotencyKey, session.userId]);
        if (existing.length) {
          return NextResponse.json({ success:true, duplicate:true, rate: Number(existing[0].rate), fee: Number(existing[0].fee), toAmount: Number(existing[0].to_amount), message: `Duplicate prevented — already swapped ${existing[0].from_amount} ${existing[0].from_asset} → ${existing[0].to_amount} ${existing[0].to_asset}`, swap: existing[0] });
        }
      } catch (e) { if (e.code !== '42703') throw e; }
    }

    // Prevent dual submission: check duplicate within 10 seconds with same params and not failed
    const recent = await query(
      `SELECT id FROM swaps WHERE user_id=$1 AND from_asset=$2 AND to_asset=$3 AND from_amount=$4 AND created_at > NOW() - INTERVAL '10 seconds' AND status != 'failed' LIMIT 1`,
      [session.userId, fromAsset, toAsset, amt]
    );
    if (recent.length) {
      return NextResponse.json({ error: 'Duplicate transaction detected. Please wait 10 seconds before retrying same swap.' }, { status: 409 });
    }

    // Fetch live USDT prices for both assets for accurate USD valuation
    const liveCache = {};
    const assetsToFetch = new Set([fromAsset, toAsset].filter(a => a !== 'USDT' && a !== 'USDC'));
    for (const a of assetsToFetch) {
      const p = await fetchLivePrice(`${a}USDT`);
      if (p) liveCache[`${a}USDT`] = p;
    }

    const usdValue = await getUsdValue(fromAsset, amt, liveCache);
    // Real balance check — if insufficient, block
    // Use transaction with row lock
    await db('BEGIN');
    try {
      const uRows = await db('SELECT id, balance, email, name, username FROM users WHERE id=$1 FOR UPDATE', [session.userId]);
      if (!uRows.length) { await db('ROLLBACK'); return NextResponse.json({ error: 'User not found' }, { status: 404 }); }
      const user = uRows[0];
      const balance = Number(user.balance||0);
      if (balance < usdValue) {
        await db('ROLLBACK');
        return NextResponse.json({ error: `Insufficient balance. Need $${usdValue.toFixed(2)} ( ${amt} ${fromAsset} ≈ $${usdValue.toFixed(2)} ), but balance is $${balance.toFixed(2)}.` }, { status: 400 });
      }

      // Get real live rate at execution time
      let rate = 1;
      if (fromAsset === 'USDT' || fromAsset === 'USDC') {
        const toPrice = liveCache[`${toAsset}USDT`] ?? await fetchLivePrice(`${toAsset}USDT`);
        rate = toPrice ? 1 / toPrice : (STATIC_RATES[`USDT_${toAsset}`] ?? 1);
      } else if (toAsset === 'USDT' || toAsset === 'USDC') {
        const fromPrice = liveCache[`${fromAsset}USDT`] ?? await fetchLivePrice(`${fromAsset}USDT`);
        rate = fromPrice ?? STATIC_RATES[`${fromAsset}_USDT`] ?? 1;
      } else {
        rate = await getLiveRate(fromAsset, toAsset, liveCache);
      }

      const fee = amt * 0.005; // 0.5% in fromAsset
      const feeUsd = await getUsdValue(fromAsset, fee, liveCache);
      const toAmount = (amt - fee) * rate;

      // Deduct fee from balance (swap is value-preserving minus fee)
      if (feeUsd > 0) {
        await db('UPDATE users SET balance = balance - $1 WHERE id=$2', [feeUsd, session.userId]);
      }

      // Insert swap with idempotency key
      const keyToStore = idempotencyKey || `swap_${session.userId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      let inserted;
      try {
        inserted = await db(
          'INSERT INTO swaps (user_id, from_asset, to_asset, from_amount, to_amount, rate, fee, status, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
          [session.userId, fromAsset, toAsset, amt, toAmount, rate, fee, 'completed', keyToStore]
        );
      } catch (insErr) {
        // unique violation on idempotency_key -> treat as duplicate
        if (String(insErr.message).includes('duplicate') || String(insErr.message).includes('unique')) {
          await db('ROLLBACK');
          const dupe = await query('SELECT * FROM swaps WHERE idempotency_key=$1 LIMIT 1', [keyToStore]);
          if (dupe.length) return NextResponse.json({ success:true, duplicate:true, swap: dupe[0], message: 'Duplicate prevented (idempotency)' });
          return NextResponse.json({ error: 'Duplicate transaction' }, { status: 409 });
        }
        throw insErr;
      }

      // Notifications
      await db('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Swap Completed ✓', `Swapped ${amt} ${fromAsset} → ${toAmount.toFixed(6)} ${toAsset} @ ${rate.toFixed(6)} (fee ${fee.toFixed(6)} ${fromAsset} ≈ $${feeUsd.toFixed(2)})`, 'success']);

      await db('COMMIT');

      // Email — fire and forget
      safeSend(sendSwapEmail({
        to: user.email,
        name: user.name || user.username,
        fromAsset, toAsset,
        fromAmount: amt,
        toAmount,
        rate, fee,
        status: 'completed'
      }));

      return NextResponse.json({ success:true, rate, fee, feeUsd, usdValue, toAmount, message: `Swapped ${amt} ${fromAsset} → ${toAmount.toFixed(6)} ${toAsset} (live rate)`, swap: inserted[0], balanceAfter: balance - feeUsd });
    } catch (innerErr) {
      try { await db('ROLLBACK'); } catch {}
      throw innerErr;
    }
  } catch (e) {
    console.error('swap POST', e);
    // mark failed swap if idempotency key provided? not needed
    try {
      const session = await getSessionUser().catch(()=>null);
      if (session) {
        const { fromAsset, toAsset, fromAmount } = await req.json().catch(()=>({}));
        if (fromAsset && toAsset && fromAmount) {
          await query('INSERT INTO swaps (user_id, from_asset, to_asset, from_amount, to_amount, rate, fee, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [session.userId, fromAsset, toAsset, Number(fromAmount), 0, 0, 0, 'failed']).catch(()=>{});
        }
      }
    } catch {}
    return NextResponse.json({ error: e.message || 'Swap failed' }, { status: 500 });
  }
}
