import { vi } from 'vitest';

// Minimal NextResponse stub: route handlers only use .json()/.redirect()
// and tests assert on { status, json() }.
vi.mock('next/server', () => {
    class NextResponse {
        static json(body, init = {}) {
            const status = init?.status ?? 200;
            return {
                status,
                headers: new Map(Object.entries(init?.headers ?? {})),
                async json() {
                    return body;
                },
                async text() {
                    return typeof body === 'string' ? body : JSON.stringify(body);
                },
            };
        }

        static redirect(url, status = 307) {
            return { status, url, redirected: true };
        }
    }

    return { NextResponse };
});
