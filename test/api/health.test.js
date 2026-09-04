import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn()
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    }
}));

describe('/api/health GET Endpoint', () => {
    it('returns status healthy when database query succeeds', async () => {
        const db = await import('@/lib/db');
        db.query.mockResolvedValue([{ healthy: 1 }]);

        const { GET } = await import('../../app/api/health/route.js');
        const res = await GET();
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.status).toBe('healthy');
        expect(body.services.database.status).toBe('up');
    });

    it('returns status unhealthy with 503 when database query fails', async () => {
        const db = await import('@/lib/db');
        db.query.mockRejectedValue(new Error('Connection failed'));

        const { GET } = await import('../../app/api/health/route.js');
        const res = await GET();
        expect(res.status).toBe(503);

        const body = await res.json();
        expect(body.status).toBe('unhealthy');
        expect(body.error).toBe('Connection failed');
    });
});
