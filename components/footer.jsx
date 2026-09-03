'use client';

import Link from "next/link";
import GoogleTranslate from "./google-translate";

export default function Footer() {
    const sections = [
        {
            title: 'Company',
            links: [
                { title: 'About Us', href: '/about' },
                { title: 'Our Vision', href: '/#about' },
                { title: 'Investment Plans', href: '/plans' },
                { title: 'FAQs', href: '/faqs' },
            ],
        },
        {
            title: 'Support',
            links: [
                { title: 'Contact Support', href: '/support' },
                { title: 'Affiliate Program', href: '/#affiliate' },
                { title: 'Security & Insurance', href: '/#security' },
                { title: 'How It Works', href: '/#how-it-works' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { title: 'Terms & Conditions', href: '/#terms' },
                { title: 'Privacy Policy', href: '/#privacy' },
                { title: 'Risk Disclosure', href: '/#risk' },
            ],
        },
    ];

    return (
        <footer className="mt-32 border-t border-border-subtle bg-bg-base px-6 py-12 text-[13px] text-text-muted md:px-16 lg:px-24 transition-colors duration-300">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="inline-block">
                            <img 
                                src="/assets/logo.png" 
                                alt="Emporium Capitals Logo" 
                                className="h-10 w-auto object-contain"
                            />
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed">
                            Emporium Capitals is a forward-thinking financial company committed to transforming the investment landscape by blending AI-driven strategies with client-first security.
                        </p>
                        
                        {/* Google Translate Widget 2 */}
                        <div className="pt-2">
                            <p className="mb-2 text-xs font-semibold text-text-main">Translate Website</p>
                            <GoogleTranslate />
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <p className="font-semibold text-text-main uppercase tracking-wider text-xs">{section.title}</p>
                            <ul className="space-y-2">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <a href={link.href} className="hover:text-brand-primary transition-colors duration-200">
                                            {link.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter & Disclaimer */}
                <div className="mt-12 border-t border-border-subtle pt-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-3">
                            <p className="font-semibold text-text-main text-sm">Subscribe to our newsletter</p>
                            <p className="max-w-2xl text-xs leading-relaxed text-text-muted">
                                Join the 450K+ people that use Emporium Capitals. Get weekly market analysis, AI trade summaries, and platform updates delivered straight to your inbox.
                            </p>
                            <div className="flex max-w-md items-center mt-3">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email address" 
                                    className="w-full rounded-l-full border border-border-subtle bg-bg-card px-4 py-2 text-text-main placeholder-text-muted outline-none focus:border-brand-primary transition-colors duration-200" 
                                />
                                <button className="btn-primary rounded-l-none text-xs px-6 py-2 shrink-0">
                                    Subscribe
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-left">
                            <p className="font-semibold text-text-main text-xs">Risk Warning</p>
                            <p className="text-[11px] leading-relaxed text-text-muted">
                                Trading cryptocurrencies and leveraged financial instruments involves high risk and can result in the loss of your capital. You should not invest more than you can afford to lose and ensure you fully understand the risks involved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Copyright & Info */}
                <div className="mt-12 border-t border-border-subtle pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted gap-4">
                    <p>© 2026 Emporium Capitals. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/#privacy" className="hover:text-brand-primary">Privacy Policy</Link>
                        <Link href="/#terms" className="hover:text-brand-primary">Terms of Service</Link>
                        <Link href="/support" className="hover:text-brand-primary">Contact Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}