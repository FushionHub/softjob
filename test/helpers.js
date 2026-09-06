import { vi } from 'vitest';

/**
 * Build a deterministic query mock that routes by SQL content instead of
 * call order. Immune to module-level caches (e.g. ensure*Schema guards) and
 * to tests consuming different numbers of queries.
 *
 * routes: array of [RegExp, rows | (sql, params) => rows]. First match wins,
 * unmatched SQL resolves to [].
 */
export function routeMock(queryMock, routes) {
    queryMock.mockReset();
    queryMock.mockImplementation(async (sql, params) => {
        const text = String(sql);
        for (const [re, val] of routes) {
            if (re.test(text)) {
                return typeof val === 'function' ? val(text, params) : val;
            }
        }
        return [];
    });
}

/** JSON POST request stub for route handlers. */
export function req(body) {
    return { json: async () => body };
}
