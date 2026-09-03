'use client';

import { useState, useEffect } from 'react';

const SUPPORTED_LANGS = [
    { code: 'en', label: 'English', value: 'en|en' },
    { code: 'pt', label: 'Portuguese', value: 'en|pt' },
    { code: 'es', label: 'Spanish', value: 'en|es' },
    { code: 'fr', label: 'French', value: 'en|fr' },
    { code: 'de', label: 'German', value: 'en|de' },
    { code: 'it', label: 'Italian', value: 'en|it' },
    { code: 'ig', label: 'Igbo', value: 'en|ig' },
    { code: 'ar', label: 'Arabic', value: 'en|ar' },
    { code: 'hi', label: 'Hindi', value: 'en|hi' },
    { code: 'zh', label: 'Chinese (Simplified)', value: 'en|zh-CN' },
    { code: 'tr', label: 'Turkish', value: 'en|tr' },
    { code: 'vi', label: 'Vietnamese', value: 'en|vi' },
    { code: 'ru', label: 'Russian', value: 'en|ru' }
];

export default function GoogleTranslate() {
    const [currentLang, setCurrentLang] = useState('en|en');

    // Helper to get cookies (like Google Translate's own cookie 'googtrans')
    const getCookie = (name) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Always default to English, ignore any browser detection or cookies
            setCurrentLang('en|en');
            localStorage.setItem('user-language', 'en|en');
            
            // Clear any existing Google Translate cookie to prevent auto-translation
            document.cookie = 'googtrans=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    }, []);

    const applyTranslation = (langVal) => {
        if (typeof window !== 'undefined') {
            const trigger = () => {
                if (window.doGTranslate) {
                    window.doGTranslate(langVal);
                } else {
                    // Script not fully loaded, retry
                    setTimeout(trigger, 300);
                }
            };
            trigger();
        }
    };

    const handleLanguageChange = (e) => {
        const val = e.target.value;
        if (!val) return;
        
        setCurrentLang(val);
        localStorage.setItem('user-language', val);
        applyTranslation(val);
    };

    return (
        <div className="relative inline-block align-middle">
            <select 
                value={currentLang}
                onChange={handleLanguageChange} 
                className="gt_selector font-medium text-xs border bg-bg-card text-text-main hover:border-brand-primary focus:outline-none transition-all duration-200"
            >
                {SUPPORTED_LANGS.map((lang) => (
                    <option key={lang.code} value={lang.value}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
