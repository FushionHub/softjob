import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({
    getSessionUser: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
    sendDepositEmail: vi.fn(async () => ({})),
    sendInvestmentEmail: vi.fn(async () => ({})),
    safeSend: vi.fn((p) => {
        if (p && typeof p.catch === 'function') p.catch(() => {});
    }),
}));

import { POST, GET } from '@/app/api/deposit/route.js';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { req, routeMock } from '../helpers.js';

describe('POST /api/deposit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ADMIN_EMAIL = 'admin@test.com';
        getSessionUser.mockResolvedValue({ userId: 3 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await POST(req({ amount: 100, paymentMethod: 'card' }));
        expect(res.status).toBe(401);
    });

    it('returns 400 with validation details for invalid amount', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: -5, paymentMethod: 'card' }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Validation failed');
        expect(Array.isArray(body.details)).toBe(true);
    });

    it('returns 400 when payment method is missing', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: 100 }));
        expect(res.status).toBe(400);
    });

    it('short-circuits duplicate idempotency keys', async () => {
        routeMock(query, [[/WHERE idempotency_key=\$1 AND user_id/, [{ reference: 'ABC', amount: 100 }]]]);
        const res = await POST(req({ amount: 100, paymentMethod: 'card', idempotencyKey: 'dup-1' }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.duplicate).toBe(true);
        expect(body.reference).toBe('ABC');
    });

    it('returns 404 for unknown plan on reinvest', async () => {
        routeMock(query, []);
        const res = await POST(req({ amount: 500, paymentMethod: 'balance', planId: 999 }));
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: 'Investment plan not found' });
    });

    it('creates a pending card deposit on success', async () => {
        routeMock(query, [[/SELECT email, name FROM users/, [{ email: 'u@x.com', name: 'U' }]]]);
        const res = await POST(req({ amount: 250, paymentMethod: 'card' }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(typeof body.reference).toBe('string');
        const insertCall = query.mock.calls.find((c) => String(c[0]).startsWith('INSERT INTO deposits'));
        expect(insertCall[1][1]).toBe(250);
        expect(insertCall[1][5]).toBe('pending');
    });
});

describe('GET /api/deposit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSessionUser.mockResolvedValue({ userId: 3 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('lists user deposits', async () => {
        routeMock(query, [[/FROM deposits/, [{ id: 1, amount: '250.00' }]]]);
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ deposits: [{ id: 1, amount: '250.00' }] });
    });
});
