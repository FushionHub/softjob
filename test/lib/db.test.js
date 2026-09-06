import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@neondatabase/serverless', () => ({
    // getDb() caches the driver once; delegate to a mutable handler so each
    // test can program behavior without reseting module state.
    neon: vi.fn(() => async (sql, params) => globalThis.__pgImpl(sql, params)),
}));

vi.mock('mysql2/promise', () => {
    const rows = (r) => [r, []];
    const fakeConn = {
        beginTransaction: vi.fn(async () => {}),
        commit: vi.fn(async () => {}),
        rollback: vi.fn(async () => {}),
        release: vi.fn(() => {}),
        query: vi.fn(async () => rows([])),
    };
    // Single shared pool, captured directly (never via mock call history).
    const pool = {
        query: vi.fn(async (sql) => {
            // mysqlQuery strips RETURNING before calling run(); INSERTs
            // yield OkPackets. Follow-up re-selects are single-condition
            // SELECTs — match those exactly, nothing else.
            if (/^\s*INSERT/i.test(sql)) return rows({ insertId: 42 });
            if (/^SELECT .+ FROM \w+ WHERE id\s*=\s*\?$/.test(sql)) return rows([{ id: 42 }]);
            if (/SELECT 1/.test(sql)) return rows([{ ok: 1 }]);
            return rows([]);
        }),
        getConnection: vi.fn(async () => fakeConn),
    };
    globalThis.__fakePool = pool;
    return { createPool: vi.fn(() => pool) };
});

import { isMySQL, remapPlaceholders, splitReturning, query, ensureSchema } from '@/lib/db.js';

const ORIGINAL_URL = process.env.DATABASE_URL;

beforeEach(() => {
    globalThis.__pgImpl = async () => [];
});

describe('isMySQL', () => {
    afterEach(() => {
        process.env.DATABASE_URL = ORIGINAL_URL;
    });

    it('detects the driver from the DATABASE_URL scheme', () => {
        process.env.DATABASE_URL = 'postgresql://u:p@host/db';
        expect(isMySQL()).toBe(false);
        process.env.DATABASE_URL = 'mysql://u:p@host/db';
        expect(isMySQL()).toBe(true);
        process.env.DATABASE_URL = 'mysql2://u:p@host/db';
        expect(isMySQL()).toBe(true);
        delete process.env.DATABASE_URL;
        expect(isMySQL()).toBe(false);
    });
});

describe('remapPlaceholders', () => {
    it('remaps ordered placeholders', () => {
        expect(remapPlaceholders('WHERE id=$1 AND s=$2', ['a', 'b'])).toEqual({
            sql: 'WHERE id=? AND s=?',
            params: ['a', 'b'],
        });
    });

    it('keeps values aligned when numbers repeat or reorder', () => {
        expect(remapPlaceholders('SET a=$1 WHERE b=$1 AND c=$2', ['x', 'y'])).toEqual({
            sql: 'SET a=? WHERE b=? AND c=?',
            params: ['x', 'x', 'y'],
        });
        expect(remapPlaceholders('WHERE id=$2 AND bal>=$1', ['amt', 'uid'])).toEqual({
            sql: 'WHERE id=? AND bal>=?',
            params: ['uid', 'amt'],
        });
    });

    it('handles double-digit placeholders', () => {
        const params = Array.from({ length: 10 }, (_, i) => `p${i + 1}`);
        expect(remapPlaceholders('VALUES ($1,$2,$10)', params)).toEqual({
            sql: 'VALUES (?,?,?)',
            params: ['p1', 'p2', 'p10'],
        });
    });

    it('leaves placeholder-free SQL untouched', () => {
        expect(remapPlaceholders('SELECT 1', [])).toEqual({ sql: 'SELECT 1', params: [] });
    });
});

describe('splitReturning', () => {
    it('splits INSERT...RETURNING', () => {
        const r = splitReturning('INSERT INTO swaps (a, b) VALUES ($1,$2) RETURNING *');
        expect(r.head).toBe('INSERT INTO swaps (a, b) VALUES ($1,$2)');
        expect(r.cols).toBe('*');
    });

    it('splits UPDATE...RETURNING with conditions', () => {
        const r = splitReturning(
            "UPDATE deposits SET status = 'approved' WHERE id = $1 AND status = 'pending' RETURNING id, user_id, amount"
        );
        expect(r.head).toBe("UPDATE deposits SET status = 'approved' WHERE id = $1 AND status = 'pending'");
        expect(r.cols).toBe('id, user_id, amount');
    });

    it('returns null when there is no RETURNING clause', () => {
        expect(splitReturning('SELECT id FROM users WHERE id=$1')).toBeNull();
    });
});

describe('query() postgres path', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DATABASE_URL = 'postgresql://u:p@host/db';
    });

    afterEach(() => {
        process.env.DATABASE_URL = ORIGINAL_URL;
    });

    it('returns rows on success', async () => {
        globalThis.__pgImpl = async () => [{ id: 1 }];
        expect(await query('SELECT * FROM users WHERE id=$1', [1])).toEqual([{ id: 1 }]);
    });

    it('auto-migrates on missing relation then retries', async () => {
        const missing = Object.assign(new Error('relation "x" does not exist'), { code: '42P01' });
        let calls = 0;
        globalThis.__pgImpl = async () => {
            calls += 1;
            if (calls === 1) throw missing;
            return [{ id: 2 }];
        };
        // ensureSchema runs against the same mocked driver (all DDL resolves [])
        expect(await query('SELECT * FROM users WHERE id=$1', [2])).toEqual([{ id: 2 }]);
    });

    it('rethrows non-migration errors', async () => {
        globalThis.__pgImpl = async () => {
            throw Object.assign(new Error('boom'), { code: 'XX000' });
        };
        await expect(query('SELECT 1')).rejects.toThrow('boom');
    });
});

describe('ensureSchema()', () => {
    it('applies the full schema against a fresh mock and returns true', async () => {
        process.env.DATABASE_URL = 'postgresql://u:p@host/db';
        globalThis.__pgImpl = async () => [];
        await expect(ensureSchema()).resolves.toBe(true);
        process.env.DATABASE_URL = ORIGINAL_URL;
    }, 30000);

    it('skips DDL in MySQL mode (Laravel migrations own the schema)', async () => {
        process.env.DATABASE_URL = 'mysql://u:p@host/db';
        await expect(ensureSchema()).resolves.toBe(true);
        process.env.DATABASE_URL = ORIGINAL_URL;
    });
});

describe('query() mysql path', () => {
    beforeEach(() => {
        process.env.DATABASE_URL = 'mysql://u:p@host/db';
    });

    afterEach(() => {
        process.env.DATABASE_URL = ORIGINAL_URL;
    });

    it('runs parameterized selects with remapped placeholders', async () => {
        expect(await query('SELECT * FROM users WHERE id=$1 AND s=$2', ['a', 'b'])).toEqual([]);
    });

    it('emulates INSERT...RETURNING via insertId follow-up', async () => {
        expect(
            await query('INSERT INTO deposits (user_id, amount) VALUES ($1,$2) RETURNING id', [3, 100])
        ).toEqual([{ id: 42 }]);
    });

    it('emulates UPDATE...RETURNING via re-select', async () => {
        const out = await query("UPDATE users SET balance = 0 WHERE id=$1 RETURNING id", [3]);
        expect(out).toEqual([{ id: 42 }]);
    });

    it('supports BEGIN/COMMIT transaction markers', async () => {
        expect(await query('BEGIN')).toEqual([]);
        expect(await query('COMMIT')).toEqual([]);
    });

    it('supports BEGIN/ROLLBACK transaction markers', async () => {
        expect(await query('BEGIN')).toEqual([]);
        expect(await query('ROLLBACK')).toEqual([]);
    });

    it('throws a clear error for untranslatable RETURNING', async () => {
        await expect(query('DELETE FROM t WHERE id=$1 RETURNING id', [1])).rejects.toThrow(/only emulated for INSERT\/UPDATE/);
    });

    it('wraps driver failures with context', async () => {
        const poolObj = globalThis.__fakePool;
        const origQuery = poolObj.query;
        poolObj.query = async () => {
            throw new Error('conn refused');
        };
        try {
            await expect(query('SELECT 1')).rejects.toThrow('conn refused');
        } finally {
            poolObj.query = origQuery;
        }
    });
});
