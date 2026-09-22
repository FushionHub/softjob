import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));

import { query } from '@/lib/db';
import { getSiteSettings, getPublicSiteUrl, invalidateSettingsCache } from '@/lib/settings';

describe('lib/settings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateSettingsCache();
    });

    it('returns default fallback settings when database has no records', async () => {
        query.mockResolvedValueOnce([]);
        const settings = await getSiteSettings();

        expect(settings.site_name).toBe('Emporium Capitals');
        expect(settings.site_logo).toBe('/assets/logo.png');
        expect(settings.site_favicon).toBe('/favicon.ico');
        expect(settings.currency).toBe('USD');
        expect(settings.disclaimer_footer).toContain('Trading cryptocurrencies');
        expect(settings.disclaimer_email).toContain('DISCLAIMER: This email');
    });

    it('returns database settings when present and caches them', async () => {
        query.mockResolvedValueOnce([
            { setting_key: 'site_name', setting_value: 'Apex Trades' },
            { setting_key: 'site_url', setting_value: 'https://apextrades.com' },
            { setting_key: 'site_logo', setting_value: '/uploads/custom-logo.png' },
            { setting_key: 'disclaimer_email', setting_value: 'Custom risk warning notice.' }
        ]);

        const settings1 = await getSiteSettings();
        expect(settings1.site_name).toBe('Apex Trades');
        expect(settings1.site_url).toBe('https://apextrades.com');
        expect(settings1.site_logo).toBe('/uploads/custom-logo.png');
        expect(settings1.disclaimer_email).toBe('Custom risk warning notice.');

        // Second call should use cache without hitting DB again
        const settings2 = await getSiteSettings();
        expect(settings2.site_name).toBe('Apex Trades');
        expect(query).toHaveBeenCalledTimes(1);

        // After cache invalidation, should re-query DB
        invalidateSettingsCache();
        query.mockResolvedValueOnce([
            { setting_key: 'site_name', setting_value: 'Apex Global' }
        ]);
        const settings3 = await getSiteSettings();
        expect(settings3.site_name).toBe('Apex Global');
        expect(query).toHaveBeenCalledTimes(2);
    });

    describe('getPublicSiteUrl', () => {
        it('uses database site_url setting when configured', async () => {
            query.mockResolvedValueOnce([
                { setting_key: 'site_url', setting_value: 'https://client-portal.example.com/' }
            ]);

            const url = await getPublicSiteUrl();
            expect(url).toBe('https://client-portal.example.com');
        });

        it('derives public URL from request headers (x-forwarded-host, x-forwarded-proto)', async () => {
            query.mockResolvedValueOnce([]); // no DB site_url

            const fakeReq = {
                headers: new Headers({
                    'x-forwarded-host': 'invest.platform.io',
                    'x-forwarded-proto': 'https',
                }),
                url: 'http://localhost:3000/api/auth/register',
            };

            const url = await getPublicSiteUrl(fakeReq);
            expect(url).toBe('https://invest.platform.io');
        });

        it('derives public URL from req.url when host is not localhost', async () => {
            query.mockResolvedValueOnce([]);

            const fakeReq = {
                headers: new Headers(),
                url: 'https://live-trade.net/api/auth/register',
            };

            const url = await getPublicSiteUrl(fakeReq);
            expect(url).toBe('https://live-trade.net');
        });

        it('never returns localhost:3000 if production env variable is configured', async () => {
            query.mockResolvedValueOnce([]);
            const origEnv = process.env.NEXT_PUBLIC_APP_URL;
            try {
                process.env.NEXT_PUBLIC_APP_URL = 'https://portal.mytrading.com';
                const url = await getPublicSiteUrl();
                expect(url).toBe('https://portal.mytrading.com');
                expect(url).not.toContain('localhost');
            } finally {
                if (origEnv !== undefined) process.env.NEXT_PUBLIC_APP_URL = origEnv;
                else delete process.env.NEXT_PUBLIC_APP_URL;
            }
        });
    });
});
