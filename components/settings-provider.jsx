'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const defaultSettings = {
    site_name: 'Emporium Capitals',
    site_tagline: 'Premium Crypto Investment Platform',
    site_url: 'https://emporiumcapitals.com',
    site_logo: '/assets/logo.png',
    site_favicon: '/favicon.ico',
    primary_color: '#ef4d45',
    support_email: 'support@emporiumcapitals.com',
    support_phone: '+1 (800) 555-0199',
    company_address: '100 Wall Street, 24th Floor, New York, NY 10005',
    meta_title: 'Emporium Capitals | Premium Crypto Investment & Trading Platform',
    meta_description: 'Start your wealth-building journey with AI-driven trading strategies, high-yield investment packages, and enterprise-grade asset protection.',
    meta_keywords: 'crypto, bitcoin, trading, investment, forex, ai trading, passive income, emporium capitals',
    og_image: '/assets/logo.png',
    disclaimer_footer: 'Trading cryptocurrencies, forex, and leveraged financial assets involves substantial risk and may lead to the loss of your invested capital. Past performance is not indicative of future results. Never invest capital you cannot afford to lose.',
    disclaimer_trading: 'Risk Notice: Crypto asset prices are highly volatile. Ensure you fully evaluate your risk tolerance before placing trades or allocating capital.',
    disclaimer_email: 'DISCLAIMER: This email and any attachments are intended solely for the recipient. Emporium Capitals will never ask for your password or private recovery phrases via email. Trading digital assets carries significant financial risk.',
    currency: 'USD',
    min_deposit: 100,
    max_deposit: 100000,
    min_withdrawal: 50,
    max_withdrawal: 50000,
    withdrawal_fee: 2,
    swap_fee: 0.5,
    referral_bonus: 5,
    registration_enabled: true,
    maintenance_mode: false,
};

const SiteSettingsContext = createContext({
    settings: defaultSettings,
    siteName: 'Emporium Capitals',
    siteTagline: 'Premium Crypto Investment Platform',
    siteLogo: '/assets/logo.png',
    siteFavicon: '/favicon.ico',
    supportEmail: 'support@emporiumcapitals.com',
    supportPhone: '+1 (800) 555-0199',
    companyAddress: '100 Wall Street, 24th Floor, New York, NY 10005',
    disclaimerFooter: '',
    disclaimerTrading: '',
    currency: 'USD',
    primaryColor: '#ef4d45',
    refreshSettings: () => {},
    loading: false,
});

export function SiteSettingsProvider({ children, initialSettings = null }) {
    const [settings, setSettings] = useState(initialSettings || defaultSettings);
    const [loading, setLoading] = useState(!initialSettings);

    const refreshSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSettings((prev) => ({ ...prev, ...data }));
            }
        } catch (e) {
            // Keep existing on failure
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();

        // Listen for real-time setting updates dispatched from the admin panel
        const handleUpdate = () => refreshSettings();
        window.addEventListener('site_settings_updated', handleUpdate);
        return () => window.removeEventListener('site_settings_updated', handleUpdate);
    }, [refreshSettings]);

    const value = {
        settings,
        siteName: settings.site_name || 'Emporium Capitals',
        siteTagline: settings.site_tagline || 'Premium Crypto Investment Platform',
        siteLogo: settings.site_logo || '/assets/logo.png',
        siteFavicon: settings.site_favicon || '/favicon.ico',
        supportEmail: settings.support_email || 'support@emporiumcapitals.com',
        supportPhone: settings.support_phone || '+1 (800) 555-0199',
        companyAddress: settings.company_address || '100 Wall Street, 24th Floor, New York, NY 10005',
        disclaimerFooter: settings.disclaimer_footer || defaultSettings.disclaimer_footer,
        disclaimerTrading: settings.disclaimer_trading || defaultSettings.disclaimer_trading,
        currency: settings.currency || 'USD',
        primaryColor: settings.primary_color || '#ef4d45',
        refreshSettings,
        loading,
    };

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}
