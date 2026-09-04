import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@neondatabase/serverless', () => {
    return {
        neon: () => {
            const mockSql = async (stmt, params) => {
                if (typeof stmt === 'string' && stmt.includes('SELECT 1')) {
                    return [{ healthy: 1 }];
                }
                return [];
            };
            return mockSql;
        }
    };
});

describe('lib/db connection and schema', () => {
    beforeEach(() => {
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/testdb';
    });

    it('getDb initializes and returns database instance', async () => {
        const { getDb } = await import('../../lib/db/connection.js');
        const db = getDb();
        expect(db).toBeDefined();
        expect(typeof db).toBe('function');
    });

    it('ensureSchema executes without throwing when DB is mocked', async () => {
        const { ensureSchema } = await import('../../lib/db/schema.js');
        const result = await ensureSchema();
        expect(result).toBe(true);
    });

    it('query runs SQL queries via getDb', async () => {
        const { query } = await import('../../lib/db/connection.js');
        const res = await query('SELECT 1 as healthy');
        expect(res).toEqual([{ healthy: 1 }]);
    });
});
