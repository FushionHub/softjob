import { query } from './db.js';

let cachedSettings = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds in-memory cache for high performance with near-instant updates

const DEFAULT_SETTINGS = {
    site_name: 'Emporium Capitals',
    site_tagline: 'Premium Crypto Investment Platform',
    site_url: '',
    site_logo: '/assets/logo.png',
    site_favicon: '/favicon.ico',
    primary_color: '#ef4d45',
    currency: 'USD',
    support_email: 'support@emporiumcapitals.com',
    support_phone: '+1 (800) 555-0199',
    company_address: '100 Wall Street, 24th Floor, New York, NY 10005',
    meta_title: 'Emporium Capitals | Premium Crypto Investment & Trading Platform',
    meta_description: 'Start your wealth-building journey with AI-driven trading strategies, high-yield investment packages, and enterprise-grade asset protection.',
    meta_keywords: 'crypto, bitcoin, trading, investment, forex, ai trading, passive income, emporium capitals',
    og_image: '/assets/logo.png',
    disclaimer_footer: 'Trading cryptocurrencies, forex, and leveraged financial assets involves substantial risk and may lead to the loss of your invested capital. Past performance is not indicative of future results. Never invest capital you cannot afford to lose.',
    disclaimer_email: 'DISCLAIMER: This email and any attachments are intended solely for the recipient. Emporium Capitals will never ask for your password or private recovery phrases via email. Trading digital assets carries significant financial risk.',
    disclaimer_trading: 'Risk Notice: Crypto asset prices are highly volatile. Ensure you fully evaluate your risk tolerance before placing trades or allocating capital.',
    min_deposit: '100',
    max_deposit: '100000',
    min_withdrawal: '50',
    max_withdrawal: '50000',
    withdrawal_fee: '2',
    swap_fee: '0.5',
    referral_bonus: '5',
    kyc_required: 'false',
    maintenance_mode: 'false',
    registration_enabled: 'true',
    two_factor_required: 'false',
};

/**
 * Fetch all site settings with in-memory caching
 */
export async function getSiteSettings() {
    const now = Date.now();
    if (cachedSettings && now - cacheTime < CACHE_TTL_MS) {
        return cachedSettings;
    }

    try {
        const rows = await query('SELECT setting_key, setting_value FROM site_settings');
        const map = { ...DEFAULT_SETTINGS };
        if (Array.isArray(rows)) {
            for (const row of rows) {
                if (row.setting_key && row.setting_value !== null && row.setting_value !== undefined) {
                    map[row.setting_key] = row.setting_value;
                }
            }
        }
        cachedSettings = map;
        cacheTime = now;
        return map;
    } catch (err) {
        // Return defaults if database is not reachable yet
        return DEFAULT_SETTINGS;
    }
}

/**
 * Invalidate the settings cache immediately (called on admin save or logo upload)
 */
export function invalidateSettingsCache() {
    cachedSettings = null;
    cacheTime = 0;
}

/**
 * Resolve the canonical website URL for emails, checkouts, and redirects.
 * Guarantees localhost:3000 is never returned for production emails.
 */
export async function getPublicSiteUrl(req = null) {
    const settings = await getSiteSettings();

    // 1. Explicitly configured website URL in Admin Site Settings
    if (settings.site_url) {
        const cleaned = settings.site_url.trim().replace(/\/+$/, '');
        if (cleaned && !cleaned.includes('localhost') && !cleaned.includes('127.0.0.1')) {
            return cleaned;
        }
    }

    // 2. Incoming request host headers (e.g. from visitor registration)
    if (req) {
        try {
            const host = req.headers?.get?.('x-forwarded-host') || req.headers?.get?.('host');
            if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
                const proto = req.headers?.get?.('x-forwarded-proto') || 'https';
                return `${proto}://${host}`.replace(/\/+$/, '');
            }
            if (req.url) {
                const parsed = new URL(req.url);
                if (parsed.host && !parsed.host.includes('localhost') && !parsed.host.includes('127.0.0.1')) {
                    return parsed.origin.replace(/\/+$/, '');
                }
            }
        } catch (e) {}
    }

    // 3. Environment variables
    const envCandidate = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    if (envCandidate) {
        const cleaned = envCandidate.trim().replace(/\/+$/, '');
        if (!cleaned.includes('localhost') && !cleaned.includes('127.0.0.1')) {
            return cleaned;
        }
    }

    // 4. In testing environment, respect env if needed
    if (process.env.NODE_ENV === 'test' && process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
    }

    // 5. Production live domain fallback
    return 'https://emporiumcapitals.com';
}
