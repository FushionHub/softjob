import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger, logger, setLogSink } from '@/lib/logger.js';

describe('logger', () => {
    let captured;
    beforeEach(() => {
        captured = [];
        setLogSink((entry) => captured.push(entry));
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        setLogSink(null);
        vi.restoreAllMocks();
    });

    it('emits structured entries with timestamp, level and message', () => {
        logger.info('deposit created', { userId: 3, amount: 100 });
        expect(captured).toHaveLength(1);
        expect(captured[0]).toMatchObject({ level: 'info', msg: 'deposit created', userId: 3, amount: 100 });
        expect(typeof captured[0].ts).toBe('string');
    });

    it('merges child context into every entry', () => {
        const child = logger.child({ route: '/api/withdraw' });
        child.warn('slow query', { latencyMs: 900 });
        expect(captured[0]).toMatchObject({ route: '/api/withdraw', latencyMs: 900 });
    });

    it('normalizes Error objects with message and stack', () => {
        const err = new Error('boom');
        logger.error(err, { code: 'X' });
        expect(captured[0].msg).toBe('boom');
        expect(typeof captured[0].stack).toBe('string');
        expect(captured[0].code).toBe('X');
    });

    it('falls back to console when no sink is set', () => {
        setLogSink(null);
        logger.info('plain');
        expect(console.log).toHaveBeenCalledTimes(1);
        logger.error('bad');
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('never throws when the sink itself throws', () => {
        setLogSink(() => {
            throw new Error('sink down');
        });
        expect(() => logger.info('x')).not.toThrow();
    });

    it('createLogger instances are independent', () => {
        const a = createLogger({ svc: 'a' });
        const b = createLogger({ svc: 'b' });
        a.info('one');
        expect(captured[0].svc).toBe('a');
        b.info('two');
        expect(captured[1].svc).toBe('b');
    });
});
