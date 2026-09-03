'use client';

import { MenuIcon, XIcon, SunIcon, MoonIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from './theme-provider';
import GoogleTranslate from './google-translate';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const links = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Investment Plans', href: '/plans' },
        { name: 'Support', href: '/support' },
        { name: 'FAQs', href: '/faqs' },
    ];

    return (
        <>
            <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border-subtle bg-bg-base/75 px-6 py-4 backdrop-blur-md md:px-16 lg:px-24 transition-colors duration-300">
                <Link href="/" className="flex items-center gap-2">
                    <img 
                        src="/assets/logo.png" 
                        alt="Emporium Capitals Logo" 
                        className="h-9 w-auto object-contain brightness-100 dark:brightness-100" 
                    />
                </Link>

                <div className="hidden items-center space-x-8 font-medium text-text-muted md:flex">
                    {links.map((link) => (
                        <Link 
                            key={link.name} 
                            href={link.href} 
                            className="text-[13px] hover:text-brand-primary transition-colors duration-200"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="hidden items-center gap-4 md:flex">
                    {/* Google Translate Widget 1 */}
                    <GoogleTranslate />

                    {/* Theme Switcher */}
                    <button 
                        onClick={toggleTheme}
                        className="flex size-9 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-main hover:border-brand-primary transition-all duration-200 cursor-pointer"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <SunIcon className="size-4.5" /> : <MoonIcon className="size-4.5" />}
                    </button>

                    <Link 
                        href="/login" 
                        className="text-[13px] font-semibold text-text-main hover:text-brand-primary transition-colors duration-200"
                    >
                        Login
                    </Link>
                    <Link 
                        href="/register" 
                        className="btn-primary text-xs py-2 px-5 font-semibold"
                    >
                        Join Us!
                    </Link>
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    {/* Mobile Theme Switcher & Lang Dropdown */}
                    <button 
                        onClick={toggleTheme}
                        className="flex size-8 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-main"
                    >
                        {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                    </button>
                    
                    <button 
                        onClick={() => setIsOpen(true)} 
                        className="text-text-main hover:text-brand-primary transition active:scale-95"
                    >
                        <MenuIcon className="size-6" />
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div className={`fixed inset-0 z-50 flex flex-col justify-between bg-bg-base p-6 text-lg font-medium transition duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div>
                    <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
                        <img 
                            src="/assets/logo.png" 
                            alt="Emporium Capitals Logo" 
                            className="h-8 w-auto" 
                        />
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="flex size-8 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-main"
                        >
                            <XIcon className="size-5" />
                        </button>
                    </div>

                    <div className="mt-8 flex flex-col gap-6 text-left">
                        {links.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className="block text-text-main hover:text-brand-primary transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-normal text-text-muted">Select Language</span>
                        <GoogleTranslate />
                    </div>
                    
                    <div className="flex gap-4 mt-2">
                        <Link 
                            href="/login" 
                            className="flex-1 text-center py-2.5 rounded-full border border-border-subtle text-text-main font-semibold text-sm hover:border-brand-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            Login
                        </Link>
                        <Link 
                            href="/register" 
                            className="flex-1 text-center py-2.5 rounded-full btn-primary font-semibold text-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Join Us!
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
