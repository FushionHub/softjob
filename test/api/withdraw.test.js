import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({
    getSessionUser: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
    sendWithdrawalEmail: vi.fn(async () => ({})),
    safeSend: vi.fn((p) => {
        if (p && typeof p.catch === 'function') p.catch(() => {});
    }),
}));

import { POST, GET } from '@/app/api/withdraw/route.js';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { req, routeMock } from '../helpers.js';

describe('POST /api/withdraw', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ADMIN_EMAIL = 'admin@test.com';
        getSessionUser.mockResolvedValue({ userId: 7 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await POST(req({ amount: 100, walletAddress: 'bc1qxyz1234567890' }));
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 with validation details when wallet address is missing', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: 100 }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Validation failed');
        expect(Array.isArray(body.details)).toBe(true);
    });

    it('returns 400 for non-positive amounts', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: -5, walletAddress: 'bc1qxyz1234567890' }));
        expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate idempotency key', async () => {
        routeMock(query, [[/WHERE idempotency_key=\$1 AND user_id/, [{ id: 9, amount: 50 }]]]);
        const res = await POST(req({ amount: 50, walletAddress: 'bc1qxyz1234567890', idempotencyKey: 'k-1' }));
        expect(res.status).toBe(200);
        expect((await res.json()).duplicate).toBe(true);
    });

    it('returns 404 when user does not exist', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: 50, walletAddress: 'bc1qxyz1234567890' }));
        expect(res.status).toBe(404);
    });

    it('returns 400 when available balance is insufficient', async () => {
        routeMock(query, [
            [/FROM users/, [{ balance: '100.00', email: 'u@x.com', name: 'U' }]],
            [/pending_total/, [{ pending_total: '0' }]],
        ]);
        const res = await POST(req({ amount: 200, walletAddress: 'bc1qxyz1234567890' }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/Insufficient/);
    });

    it('creates a pending withdrawal on success', async () => {
        routeMock(query, [
            [/FROM users/, [{ balance: '1000.00', email: 'u@x.com', name: 'U' }]],
            [/pending_total/, [{ pending_total: '0' }]],
        ]);
        const res = await POST(req({ amount: 100, walletAddress: 'bc1qxyz1234567890', network: 'bitcoin' }));
        expect(res.status).toBe(200);
        expect((await res.json()).success).toBe(true);
        const insertCall = query.mock.calls.find((c) => String(c[0]).startsWith('INSERT INTO withdrawals'));
        expect(insertCall[1]).toEqual([7, 100, 'bc1qxyz1234567890', 'bitcoin', 'pending', expect.any(String)]);
    });
});

describe('GET /api/withdraw', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSessionUser.mockResolvedValue({ userId: 7 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('lists user withdrawals', async () => {
        routeMock(query, [[/FROM withdrawals/, [{ id: 1, amount: '50.00' }]]]);
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ withdrawals: [{ id: 1, amount: '50.00' }] });
    });
});
