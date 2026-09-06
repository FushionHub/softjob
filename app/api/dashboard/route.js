import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { settleExpiredTrades, processMatureInvestments } from '@/lib/lifecycle';

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // Auto-settle any expired trades and process matured investments in real time
        await Promise.allSettled([
            settleExpiredTrades(userId),
            processMatureInvestments(userId)
        ]);

        // Get user data with up-to-date balance and totals
        const users = await query(
            'SELECT id, name, email, username, phone, balance, total_profit, total_bonus, total_withdrawal, total_deposit, kyc_verified, last_login, two_factor_enabled FROM users WHERE id = $1',
            [userId]
        );
        
        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Calculate total approved withdrawals
        const withdrawalResult = await query(
            'SELECT COALESCE(SUM(amount), 0) as total_withdrawals FROM withdrawals WHERE user_id = $1 AND (status = $2 OR status = $3)',
            [userId, 'approved', 'confirmed']
        );

        // Get recent deposits
        const deposits = await query(
            'SELECT * FROM deposits WHERE user_id = $1 ORDER BY date DESC LIMIT 10',
            [userId]
        );

        // Get active investments
        const investments = await query(`
            SELECT ui.*, ip.name as plan_name, ip.percentage, ip.duration 
            FROM user_investments ui 
            LEFT JOIN investment_plans ip ON ui.plan_id = ip.id 
            WHERE ui.user_id = $1 AND ui.status = 'active'
            ORDER BY ui.start_date DESC
        `, [userId]);

        const currentBalance = parseFloat(user.balance || 0);
        const totalProfit = parseFloat(user.total_profit || 0);
        const totalBonus = parseFloat(user.total_bonus || 0);
        const totalWithdrawal = parseFloat(user.total_withdrawal || withdrawalResult[0]?.total_withdrawals || 0);
        const totalDeposit = parseFloat(user.total_deposit || 0);

        return NextResponse.json({
            balance: currentBalance,
            total_profit: totalProfit,
            total_bonus: totalBonus,
            total_withdrawal: totalWithdrawal,
            total_deposit: totalDeposit,
            deposits,
            investments
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
