import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
    getSessionUser: vi.fn()
}));

vi.mock('@/lib/db', () => ({
    query: vi.fn()
}));

vi.mock('@/lib/email', () => ({
    sendWithdrawalEmail: vi.fn().mockResolvedValue({}),
    safeSend: vi.fn(p => p)
}));

describe('/api/withdraw POST Endpoint', () => {
    let POST;
    let getSessionUser;
    let query;

    beforeEach(async () => {
        vi.clearAllMocks();
        const auth = await import('@/lib/auth');
        const db = await import('@/lib/db');
        const withdrawRoute = await import('../../app/api/withdraw/route.js');
        getSessionUser = auth.getSessionUser;
        query = db.query;
        POST = withdrawRoute.POST;
    });

    it('returns 401 Unauthorized if user session is not found', async () => {
        getSessionUser.mockResolvedValue(null);
        const req = new Request('http://localhost:3000/api/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount: 100, walletAddress: '0x123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Unauthorized');
    });

    it('returns 400 if amount or walletAddress is missing', async () => {
        getSessionUser.mockResolvedValue({ userId: 1 });
        const req = new Request('http://localhost:3000/api/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount: 100 })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 if user balance is insufficient', async () => {
        getSessionUser.mockResolvedValue({ userId: 1 });
        query.mockImplementation((sql) => {
            if (sql.includes('FROM withdrawals WHERE idempotency_key')) return Promise.resolve([]);
            if (sql.includes('FROM withdrawals WHERE user_id')) return Promise.resolve([]);
            if (sql.includes('FROM users WHERE id')) return Promise.resolve([{ balance: '50.00', email: 'test@example.com', name: 'Test' }]);
            return Promise.resolve([]);
        });

        const req = new Request('http://localhost:3000/api/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount: 100, walletAddress: '0x123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Insufficient balance');
    });

    it('creates withdrawal request successfully when user has sufficient balance', async () => {
        getSessionUser.mockResolvedValue({ userId: 1 });
        query.mockImplementation((sql) => {
            if (sql.includes('FROM withdrawals WHERE idempotency_key')) return Promise.resolve([]);
            if (sql.includes('FROM withdrawals WHERE user_id')) return Promise.resolve([]);
            if (sql.includes('FROM users WHERE id')) return Promise.resolve([{ balance: '500.00', email: 'test@example.com', name: 'Test' }]);
            return Promise.resolve([]);
        });

        const req = new Request('http://localhost:3000/api/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount: 100, walletAddress: '0x123', network: 'bitcoin' })
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
    });
});
