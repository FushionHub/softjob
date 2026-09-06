import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: { '@': root },
    },
    test: {
        environment: 'node',
        include: ['test/**/*.test.js'],
        setupFiles: ['test/setup.js'],
        // Coverage is gated on the modules under test. The include list grows
        // with every feature slice — new code must arrive with its tests.
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: [
                'lib/logger.js',
                'lib/errors.js',
                'lib/validation/*.js',
                'lib/db.js',
                'app/api/withdraw/route.js',
                'app/api/deposit/route.js',
                'app/api/swap/route.js',
                'app/api/health/route.js',
            ],
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 50,
                statements: 50,
            },
        },
    },
});
