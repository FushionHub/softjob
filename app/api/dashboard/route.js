import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // Get user data with balance info
        const users = await query(
            'SELECT id, name, email, username, phone, balance, total_profit, total_bonus, total_withdrawal, kyc_verified, last_login, two_factor_enabled FROM users WHERE id = $1',
            [userId]
        );
        
        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Calculate total deposits
        const depositResult = await query(
            'SELECT COALESCE(SUM(CASE WHEN status = $1 THEN amount ELSE 0 END), 0) as total_deposits FROM deposits WHERE user_id = $2',
            ['approved', userId]
        );

        // Calculate total withdrawals
        const withdrawalResult = await query(
            'SELECT COALESCE(SUM(CASE WHEN status = $1 THEN amount ELSE 0 END), 0) as total_withdrawals FROM withdrawals WHERE user_id = $2',
            ['approved', userId]
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
            JOIN investment_plans ip ON ui.plan_id = ip.id 
            WHERE ui.user_id = $1 AND ui.status = 'active'
        `, [userId]);

        // Calculate accurate balance
        const totalDeposits = parseFloat(depositResult[0]?.total_deposits || 0);
        const totalWithdrawals = parseFloat(withdrawalResult[0]?.total_withdrawals || 0);
        const totalProfit = parseFloat(user.total_profit || 0);
        const totalBonus = parseFloat(user.total_bonus || 0);

        const calculatedBalance = totalDeposits + totalProfit + totalBonus - totalWithdrawals;

        return NextResponse.json({
            balance: calculatedBalance,
            total_profit: totalProfit,
            total_bonus: totalBonus,
            total_withdrawal: totalWithdrawals,
            deposits,
            investments
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
