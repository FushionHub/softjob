import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

const startedAt = Date.now();

export async function GET() {
    const checks = {
        database: { ok: false, latencyMs: null },
        memory: { ok: true, heapUsedMb: null },
    };

    try {
        const t0 = Date.now();
        await query('SELECT 1 as ok');
        checks.database = { ok: true, latencyMs: Date.now() - t0 };
    } catch (err) {
        logger.error('health database check failed', { code: err?.code });
    }

    try {
        const mem = process.memoryUsage();
        checks.memory = { ok: true, heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024) };
    } catch {
        checks.memory = { ok: false, heapUsedMb: null };
    }

    const healthy = checks.database.ok;
    return NextResponse.json(
        {
            status: healthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptimeSec: Math.round((Date.now() - startedAt) / 1000),
            checks,
        },
        { status: healthy ? 200 : 503 }
    );
}
