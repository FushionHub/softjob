import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    const startTime = Date.now();
    try {
        await query('SELECT 1 as healthy');
        const dbLatencyMs = Date.now() - startTime;

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            services: {
                database: {
                    status: 'up',
                    latencyMs: dbLatencyMs,
                },
            },
        }, { status: 200 });
    } catch (error) {
        logger.error('Health check failed', error);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message || 'Database connection error',
        }, { status: 503 });
    }
}
