import { query } from '@/lib/db';

/**
 * Parse trade duration string to milliseconds.
 * Supported: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 24h
 */
function parseDurationMs(duration) {
  if (!duration) return 60 * 1000;
  const str = String(duration).trim().toLowerCase();
  if (str.endsWith('m')) {
    const mins = parseInt(str, 10);
    return (isNaN(mins) ? 1 : mins) * 60 * 1000;
  }
  if (str.endsWith('h')) {
    const hours = parseInt(str, 10);
    return (isNaN(hours) ? 1 : hours) * 60 * 60 * 1000;
  }
  if (str.endsWith('d')) {
    const days = parseInt(str, 10);
    return (isNaN(days) ? 1 : days) * 24 * 60 * 60 * 1000;
  }
  return 60 * 1000;
}

/**
 * Fetch current price from Binance or fallback.
 */
async function getLivePrice(asset) {
  try {
    const symbol = String(asset).replace('BINANCE:', '').replace('USD', 'USDT').toUpperCase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const p = parseFloat(data.price);
      if (!isNaN(p) && p > 0) return p;
    }
  } catch (err) {
    // Network or timeout
  }

  // Sensible fallback prices if Binance API is temporarily unreachable
  const assetNorm = String(asset).toUpperCase();
  if (assetNorm.includes('BTC')) return 65000;
  if (assetNorm.includes('ETH')) return 3500;
  if (assetNorm.includes('SOL')) return 150;
  if (assetNorm.includes('BNB')) return 580;
  if (assetNorm.includes('XRP')) return 0.55;
  if (assetNorm.includes('ADA')) return 0.45;
  return 100;
}

/**
 * Settle expired binary / high-low trades.
 * Settles trades whose duration has elapsed.
 *
 * @param {number|null} userId - If provided, only settle for this user; otherwise settles all expired trades.
 * @returns {Promise<{settledCount: number, details: Array}>}
 */
export async function settleExpiredTrades(userId = null) {
  try {
    const sql = userId
      ? `SELECT id, user_id, asset, type, amount, entry_price, status, duration, datetime
         FROM trades
         WHERE status = 'open' AND user_id = $1
         ORDER BY datetime ASC`
      : `SELECT id, user_id, asset, type, amount, entry_price, status, duration, datetime
         FROM trades
         WHERE status = 'open'
         ORDER BY datetime ASC LIMIT 50`;

    const openTrades = await query(sql, userId ? [userId] : []);
    if (!openTrades || openTrades.length === 0) {
      return { settledCount: 0, details: [] };
    }

    const now = Date.now();
    const details = [];
    let settledCount = 0;

    for (const trade of openTrades) {
      const durationMs = parseDurationMs(trade.duration);
      const startTime = new Date(trade.datetime).getTime();
      const elapsed = now - startTime;

      // Only settle if duration has elapsed
      if (elapsed < durationMs) {
        continue;
      }

      const exitPrice = await getLivePrice(trade.asset);
      const entryPrice = parseFloat(trade.entry_price);
      const tradeAmount = parseFloat(trade.amount);
      const tradeType = String(trade.type).toLowerCase(); // 'call' / 'up' / 'buy' vs 'put' / 'down' / 'sell'

      let isWin = false;
      let isPush = false;

      if (exitPrice === entryPrice) {
        isPush = true;
      } else if (tradeType === 'call' || tradeType === 'up' || tradeType === 'buy') {
        isWin = exitPrice > entryPrice;
      } else {
        // 'put', 'down', 'sell'
        isWin = exitPrice < entryPrice;
      }

      let netProfit = 0;
      let payoutToBalance = 0;

      if (isWin) {
        // Standard binary options payout: 85% profit + return principal
        netProfit = tradeAmount * 0.85;
        payoutToBalance = tradeAmount + netProfit;
      } else if (isPush) {
        netProfit = 0;
        payoutToBalance = tradeAmount; // Refund original stake
      } else {
        // Loss: principal was deducted at trade creation
        netProfit = -tradeAmount;
        payoutToBalance = 0;
      }

      // Atomic settlement of trade record
      const updated = await query(
        `UPDATE trades
         SET status = 'closed', exit_price = $1, profit = $2, closed_at = NOW()
         WHERE id = $3 AND status = 'open'
         RETURNING id`,
        [exitPrice, netProfit, trade.id]
      );

      // If already settled concurrently, skip
      if (!updated || updated.length === 0) {
        continue;
      }

      // Credit user's balance and total_profit if won or pushed
      if (payoutToBalance > 0) {
        const profitGain = Math.max(0, netProfit);
        await query(
          `UPDATE users
           SET balance = balance + $1, total_profit = COALESCE(total_profit, 0) + $2
           WHERE id = $3`,
          [payoutToBalance, profitGain, trade.user_id]
        );
      }

      // Record profit history if win
      if (netProfit > 0) {
        try {
          await query(
            `INSERT INTO profit_history (user_id, amount, type, description)
             VALUES ($1, $2, 'trading', $3)`,
            [
              trade.user_id,
              netProfit,
              `Trade won: ${tradeType.toUpperCase()} ${trade.asset} (${trade.duration}) entry $${entryPrice.toFixed(2)} exit $${exitPrice.toFixed(2)}`
            ]
          );
        } catch {}
      }

      // Send in-app notification
      try {
        const resultLabel = isWin ? 'Trade Won! 🎯' : isPush ? 'Trade Push' : 'Trade Closed';
        const resultMsg = isWin
          ? `${tradeType.toUpperCase()} ${trade.asset} settled @ $${exitPrice.toFixed(2)}. Payout $${payoutToBalance.toFixed(2)} (+$${netProfit.toFixed(2)} profit) credited to balance.`
          : isPush
          ? `${tradeType.toUpperCase()} ${trade.asset} closed at entry price $${entryPrice.toFixed(2)}. Stake of $${tradeAmount.toFixed(2)} refunded.`
          : `${tradeType.toUpperCase()} ${trade.asset} settled @ $${exitPrice.toFixed(2)}. Loss -$${tradeAmount.toFixed(2)}.`;

        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [trade.user_id, resultLabel, resultMsg, isWin ? 'success' : isPush ? 'info' : 'warning']
        );
      } catch {}

      settledCount++;
      details.push({
        tradeId: trade.id,
        userId: trade.user_id,
        asset: trade.asset,
        type: trade.type,
        entryPrice,
        exitPrice,
        isWin,
        netProfit,
        payoutToBalance
      });
    }

    return { settledCount, details };
  } catch (error) {
    console.error('Error settling expired trades:', error);
    return { settledCount: 0, error: error.message };
  }
}

/**
 * Process mature investments.
 * Marks matured active investments as completed, calculates ROI, and returns principal + profit to user balance.
 *
 * @param {number|null} userId - If provided, only process for this user; otherwise processes all mature investments.
 * @returns {Promise<{maturedCount: number, details: Array}>}
 */
export async function processMatureInvestments(userId = null) {
  try {
    const sql = userId
      ? `SELECT ui.id, ui.user_id, ui.plan_id, ui.amount, ui.start_date, ui.end_date, ui.status,
                ip.name as plan_name, COALESCE(ip.percentage, 0) as percentage, ip.duration
         FROM user_investments ui
         LEFT JOIN investment_plans ip ON ui.plan_id = ip.id
         WHERE ui.status = 'active'
           AND ui.end_date <= NOW()
           AND ui.user_id = $1
         ORDER BY ui.end_date ASC`
      : `SELECT ui.id, ui.user_id, ui.plan_id, ui.amount, ui.start_date, ui.end_date, ui.status,
                ip.name as plan_name, COALESCE(ip.percentage, 0) as percentage, ip.duration
         FROM user_investments ui
         LEFT JOIN investment_plans ip ON ui.plan_id = ip.id
         WHERE ui.status = 'active'
           AND ui.end_date <= NOW()
         ORDER BY ui.end_date ASC LIMIT 50`;

    const matureList = await query(sql, userId ? [userId] : []);
    if (!matureList || matureList.length === 0) {
      return { maturedCount: 0, details: [] };
    }

    const details = [];
    let maturedCount = 0;

    for (const inv of matureList) {
      const principal = parseFloat(inv.amount);
      const percentage = parseFloat(inv.percentage || 0);
      const profit = (principal * percentage) / 100;
      const totalPayout = principal + profit;
      const planName = inv.plan_name || 'Investment Plan';

      // Atomic update to mark completed
      const updated = await query(
        `UPDATE user_investments
         SET status = 'completed', profit = $1, updated_at = NOW()
         WHERE id = $2 AND status = 'active'
         RETURNING id`,
        [profit, inv.id]
      );

      // If already processed concurrently, skip
      if (!updated || updated.length === 0) {
        continue;
      }

      // Credit principal + profit to user's available balance, and record total profit
      await query(
        `UPDATE users
         SET balance = balance + $1, total_profit = COALESCE(total_profit, 0) + $2
         WHERE id = $3`,
        [totalPayout, profit, inv.user_id]
      );

      // Record in profit_history
      try {
        await query(
          `INSERT INTO profit_history (user_id, amount, type, description)
           VALUES ($1, $2, 'investment', $3)`,
          [
            inv.user_id,
            profit,
            `Matured investment: ${planName} (${percentage}% ROI). Principal $${principal.toFixed(2)} + Profit $${profit.toFixed(2)} returned.`
          ]
        );
      } catch {}

      // Send in-app notification
      try {
        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [
            inv.user_id,
            'Investment Matured ✓',
            `Your ${planName} investment has matured! $${totalPayout.toFixed(2)} ($${principal.toFixed(2)} principal + $${profit.toFixed(2)} profit) has been credited to your balance.`,
            'success'
          ]
        );
      } catch {}

      maturedCount++;
      details.push({
        investmentId: inv.id,
        userId: inv.user_id,
        planName,
        principal,
        percentage,
        profit,
        totalPayout
      });
    }

    return { maturedCount, details };
  } catch (error) {
    console.error('Error processing mature investments:', error);
    return { maturedCount: 0, error: error.message };
  }
}
