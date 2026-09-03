import './globals.css';
import LenisScroll from '@/components/lenis-scroll';
import { ThemeProvider } from '@/components/theme-provider';
import FloatingWidgets from '@/components/floating-widgets';
import NetworkStatus from '@/components/network-status';
import IframeErrorSuppressor from '@/components/iframe-error-suppressor';
import Script from 'next/script';

export const metadata = {
    title: 'Emporium Capitals | Home',
    description: 'Start your passive income journey with Emporium Capitals. It\'s effortless—we manage the process and you reap the profits.',
};

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
                                if (document.createEvent) {
                                    var c = document.createEvent("HTMLEvents");
                                    c.initEvent(b, true, true);
                                    a.dispatchEvent(c);
                                } else {
                                    var c = document.createEventObject();
                                    a.fireEvent('on' + b, c);
                                }
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
                <ThemeProvider>
                    <LenisScroll />
                    <NetworkStatus />
                    {children}
                    <FloatingWidgets />
                    {/* Hidden div required by Google Translate */}
                    <div id="google_translate_element2" style={{ display: 'none' }}></div>
                </ThemeProvider>
            </body>
        </html>
    );
}
