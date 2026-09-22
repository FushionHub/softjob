import './globals.css';
import LenisScroll from '@/components/lenis-scroll';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteSettingsProvider } from '@/components/settings-provider';
import FloatingWidgets from '@/components/floating-widgets';
import NetworkStatus from '@/components/network-status';
import IframeErrorSuppressor from '@/components/iframe-error-suppressor';
import Script from 'next/script';
import { getSiteSettings, getPublicSiteUrl } from '@/lib/settings';

export async function generateMetadata() {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl();
    const siteName = settings.site_name || 'Emporium Capitals';
    const tagline = settings.site_tagline || 'Premium Crypto Investment Platform';
    const title = settings.meta_title || `${siteName} | ${tagline}`;
    const description = settings.meta_description || 'Start your passive income journey with cutting-edge AI trading, secure portfolio packages, and enterprise asset management.';
    const keywords = settings.meta_keywords || 'crypto, bitcoin, trading, investment, forex, ai trading, passive income, arbitrage';
    const ogImage = settings.og_image || settings.site_logo || '/assets/logo.png';
    const favicon = settings.site_favicon || '/favicon.ico';

    let baseOrigin = 'https://emporiumcapitals.com';
    try {
        baseOrigin = new URL(siteUrl).origin;
    } catch (e) {}

    return {
        metadataBase: new URL(baseOrigin),
        title: {
            default: title,
            template: `%s | ${siteName}`,
        },
        description,
        keywords,
        icons: {
            icon: favicon,
            apple: '/apple-icon.png',
        },
        openGraph: {
            title,
            description,
            siteName,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: siteName,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default function RootLayout({ children }) {
    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                {/* Global functions for Google Translate */}
                <Script id="google-translate-funcs" strategy="beforeInteractive">
                    {`
                        function googleTranslateElementInit2() {
                            new google.translate.TranslateElement({
                                pageLanguage: 'en',
                                autoDisplay: false
                            }, 'google_translate_element2');
                        }
                        
                        function GTranslateFireEvent(a, b) {
                            try {
                                a.dispatchEvent(new Event(b, { bubbles: true, cancelable: true }));
                            } catch (e) {}
                        }
                        
                        function doGTranslate(a) {
                            if (a.value) a = a.value;
                            if (a == '') return;
                            var b = a.split('|')[1];
                            var c;
                            var d = document.getElementsByTagName('select');
                            for (var i = 0; i < d.length; i++) {
                                if (d[i].className == 'goog-te-combo') c = d[i];
                            }
                            if (document.getElementById('google_translate_element2') == null || document.getElementById('google_translate_element2').innerHTML.length == 0 || c == null || c.length == 0 || c.innerHTML.length == 0) {
                                setTimeout(function() { doGTranslate(a) }, 500);
                            } else {
                                c.value = b;
                                GTranslateFireEvent(c, 'change');
                                GTranslateFireEvent(c, 'change');
                            }
                        }
                    `}
                </Script>
                {/* Google Translate main script */}
                <Script 
                    src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"
                    strategy="afterInteractive"
                />
            </head>
            <body className="font-sans" suppressHydrationWarning>
                <IframeErrorSuppressor />
                <SiteSettingsProvider>
                    <ThemeProvider>
                        <LenisScroll />
                        <NetworkStatus />
                        {children}
                        <FloatingWidgets />
                        {/* Hidden div required by Google Translate */}
                        <div id="google_translate_element2" style={{ display: 'none' }}></div>
                    </ThemeProvider>
                </SiteSettingsProvider>
            </body>
        </html>
    );
}
