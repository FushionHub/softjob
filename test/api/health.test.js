import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));

import { GET } from '@/app/api/health/route.js';
import { query } from '@/lib/db';
import { setLogSink } from '@/lib/logger';

describe('GET /api/health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setLogSink(null);
    });

    it('returns 200 with ok status when the database pings', async () => {
        query.mockResolvedValueOnce([{ ok: 1 }]);
        const res = await GET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
        expect(body.checks.database.ok).toBe(true);
        expect(typeof body.checks.database.latencyMs).toBe('number');
        expect(typeof body.uptimeSec).toBe('number');
    });

    it('returns 503 degraded when the database is down and logs the failure', async () => {
        const captured = [];
        setLogSink((entry) => captured.push(entry));
        query.mockRejectedValueOnce(Object.assign(new Error('connect timeout'), { code: 'ETIMEDOUT' }));
        const res = await GET();
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.status).toBe('degraded');
        expect(body.checks.database.ok).toBe(false);
        expect(captured.some((e) => e.level === 'error')).toBe(true);
        setLogSink(null);
    });
});
