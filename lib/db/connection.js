import { neon } from '@neondatabase/serverless';
import { ensureSchema } from './schema.js';

let sql;

export function getDb() {
    if (!sql) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        sql = neon(databaseUrl);
    }
    return sql;
}

export async function query(sqlQuery, params = []) {
    const database = getDb();
    try {
        const result = await database(sqlQuery, params);
        return result;
    } catch (error) {
        const isMissingRelationOrCol =
            error?.code === '42P01' ||
            error?.code === '42703' ||
            String(error?.message || '').includes('does not exist');

        if (isMissingRelationOrCol) {
            try {
                await ensureSchema();
                const retryResult = await database(sqlQuery, params);
                return retryResult;
            } catch (retryError) {
                console.error('Database query retry failed:', retryError);
                throw retryError;
            }
        }

        console.error('Database query error:', error);
        console.error('SQL:', sqlQuery);
        console.error('Params:', params);
        throw error;
    }
}
