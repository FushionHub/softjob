import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({
    getSessionUser: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
    sendSwapEmail: vi.fn(async () => ({})),
    safeSend: vi.fn((p) => {
        if (p && typeof p.catch === 'function') p.catch(() => {});
    }),
}));

import { POST, GET } from '@/app/api/swap/route.js';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { req, routeMock } from '../helpers.js';

// Force static-rate path: Binance unreachable in tests.
const deadFetch = () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
};

describe('POST /api/swap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        deadFetch();
        getSessionUser.mockResolvedValue({ userId: 5 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'ETH', fromAmount: 1 }));
        expect(res.status).toBe(401);
    });

    it('returns 400 for missing fields', async () => {
        routeMock(query, []);
        const res = await POST(req({ fromAsset: 'BTC' }));
        expect(res.status).toBe(400);
    });

    it('returns 400 when swapping the same asset', async () => {
        routeMock(query, []);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'BTC', fromAmount: 1 }));
        expect(res.status).toBe(400);
    });

    it('returns 400 for non-positive amounts', async () => {
        routeMock(query, []);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'ETH', fromAmount: 0 }));
        expect(res.status).toBe(400);
    });

    it('short-circuits duplicate idempotency keys', async () => {
        routeMock(query, [
            [
                /WHERE idempotency_key=\$1 AND user_id/,
                [{ rate: '15.2', fee: '0.005', to_amount: '15.124', from_amount: '1', from_asset: 'BTC', to_asset: 'ETH' }],
            ],
        ]);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'ETH', fromAmount: 1, idempotencyKey: 's-1' }));
        expect(res.status).toBe(200);
        expect((await res.json()).duplicate).toBe(true);
    });

    it('returns 400 on insufficient balance', async () => {
        routeMock(query, [[/FROM users/, [{ id: 5, balance: '0', email: 'u@x.com', name: 'U', username: 'u' }]]]);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'ETH', fromAmount: 1 }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/Insufficient balance/);
    });

    it('executes a swap at the static rate on success', async () => {
        routeMock(query, [
            [/FROM users/, [{ id: 5, balance: '100000', email: 'u@x.com', name: 'U', username: 'u' }]],
            [/UPDATE users SET balance = balance -/, [{ balance: '99900' }]],
            [/INSERT INTO swaps/, [{ id: 11 }]],
        ]);
        const res = await POST(req({ fromAsset: 'BTC', toAsset: 'ETH', fromAmount: 1 }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.rate).toBeCloseTo(15.2, 5);
        expect(body.fee).toBeCloseTo(0.005, 6);
        expect(body.toAmount).toBeCloseTo((1 - 0.005) * 15.2, 4);
    });
});

describe('GET /api/swap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        deadFetch();
        getSessionUser.mockResolvedValue({ userId: 5 });
    });

    it('returns 401 when unauthenticated', async () => {
        getSessionUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('returns rates, swaps and balance', async () => {
        routeMock(query, [
            [/FROM swaps/, []],
            [/FROM users/, [{ balance: '42.5' }]],
        ]);
        const res = await GET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.balance).toBe(42.5);
        expect(body.rates.BTC_ETH).toBe(15.2);
    });
});
