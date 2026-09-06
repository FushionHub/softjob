import { describe, it, expect } from 'vitest';
import {
    AppError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    unprocessable,
    fromUnknown,
    zodDetails,
} from '@/lib/errors.js';

describe('AppError', () => {
    it('serializes to a stable JSON shape', () => {
        const err = new AppError('No funds', { code: 'INSUFFICIENT', status: 400, details: { have: 1 } });
        expect(err.status).toBe(400);
        expect(JSON.parse(JSON.stringify(err))).toEqual({
            error: 'No funds',
            code: 'INSUFFICIENT',
            details: { have: 1 },
        });
    });

    it('omits details when absent', () => {
        expect(badRequest('nope').toJSON()).toEqual({ error: 'nope', code: 'BAD_REQUEST' });
    });

    it('helpers carry the right statuses', () => {
        expect(unauthorized().status).toBe(401);
        expect(forbidden().status).toBe(403);
        expect(notFound().status).toBe(404);
        expect(conflict().status).toBe(409);
        expect(unprocessable().status).toBe(422);
    });

    it('fromUnknown preserves AppError and wraps the rest', () => {
        const mine = badRequest('x');
        expect(fromUnknown(mine)).toBe(mine);
        const wrapped = fromUnknown(new Error('db down'));
        expect(wrapped).toBeInstanceOf(AppError);
        expect(wrapped.status).toBe(500);
        expect(wrapped.message).toBe('db down');
        expect(fromUnknown('plain string').message).toBe('plain string');
    });

    it('zodDetails compacts issues to path/message pairs', () => {
        const out = zodDetails({ issues: [{ path: ['amount'], message: 'Required', code: 'invalid_type' }] });
        expect(out).toEqual([{ path: 'amount', message: 'Required', code: 'invalid_type' }]);
        expect(zodDetails(null)).toEqual([]);
    });
});
