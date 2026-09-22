import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await getSiteSettings();

        // Return only public/client-safe settings
        const publicSettings = {
            site_name: settings.site_name || 'Emporium Capitals',
            site_tagline: settings.site_tagline || 'Premium Crypto Investment Platform',
            site_url: settings.site_url || 'https://emporiumcapitals.com',
            site_logo: settings.site_logo || '/assets/logo.png',
            site_favicon: settings.site_favicon || '/favicon.ico',
            primary_color: settings.primary_color || '#ef4d45',
            support_email: settings.support_email || 'support@emporiumcapitals.com',
            support_phone: settings.support_phone || '+1 (800) 555-0199',
            company_address: settings.company_address || '100 Wall Street, 24th Floor, New York, NY 10005',
            meta_title: settings.meta_title || 'Emporium Capitals | Premium Crypto Investment & Trading Platform',
            meta_description: settings.meta_description || 'Start your wealth-building journey with AI-driven trading strategies, high-yield investment packages, and enterprise-grade asset protection.',
            meta_keywords: settings.meta_keywords || 'crypto, bitcoin, trading, investment, forex, ai trading, passive income, emporium capitals',
            og_image: settings.og_image || settings.site_logo || '/assets/logo.png',
            disclaimer_footer: settings.disclaimer_footer || '',
            disclaimer_trading: settings.disclaimer_trading || '',
            disclaimer_email: settings.disclaimer_email || '',
            currency: settings.currency || 'USD',
            min_deposit: parseFloat(settings.min_deposit || '100'),
            max_deposit: parseFloat(settings.max_deposit || '100000'),
            min_withdrawal: parseFloat(settings.min_withdrawal || '50'),
            max_withdrawal: parseFloat(settings.max_withdrawal || '50000'),
            registration_enabled: settings.registration_enabled !== 'false',
            maintenance_mode: settings.maintenance_mode === 'true',
        };

        return NextResponse.json(publicSettings, {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
            },
        });
    } catch (err) {
        console.error('Failed to get public settings:', err);
        return NextResponse.json({
            site_name: 'Emporium Capitals',
            site_logo: '/assets/logo.png',
            primary_color: '#ef4d45',
        }, { status: 200 });
    }
}
