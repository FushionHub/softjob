'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Check, ShieldCheck } from 'lucide-react';
import GoogleLoginButton from '@/components/google-login-button';

export default function LoginClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [pageError, setPageError] = useState('');
    const [pageSuccess, setPageSuccess] = useState('');

    useEffect(() => {
        const verified = searchParams.get('verified');
        const error = searchParams.get('error');

        if (verified === 'true') {
            setPageSuccess('Email verified successfully! You can now sign in.');
        }

        if (error) {
            if (error === 'invalid_token') {
                setPageError('The email verification link is invalid or has expired.');
            } else if (error === 'oauth_failed') {
                setPageError('Google login failed. Please try again.');
            } else if (error === 'invalid_credentials') {
                setPageError('Invalid email/username or password');
            } else if (error === 'missing_fields') {
                setPageError('Email and password are required');
            } else {
                setPageError('An error occurred during authentication.');
            }
        }
    }, [searchParams]);

    const handleGoogleError = (msg) => setPageError(msg);

    const handleVerify2FA = (e) => {
        e.preventDefault();
        setPageError('Two-factor authentication is not yet implemented.');
    };

    return (
        <main className="min-h-screen bg-bg-base flex flex-col md:flex-row transition-colors duration-300">
            {/* Left Column - Mockups & Welcome */}
            <section className="hidden md:flex flex-col justify-between w-full md:w-[48%] bg-[#010214] border-r border-border-subtle/30 p-12 lg:p-16 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-2">
                    <Link href="/">
                        <img
                            src="/assets/logo.png"
                            alt="Emporium Capitals Logo"
                            className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
                        />
                    </Link>
                </div>

                <div className="my-auto relative z-10 flex flex-col items-center">
                    <div className="w-full text-left max-w-md mx-auto mb-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Welcome to <br />
                            <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                                Emporium Capitals
                            </span>
                        </h2>
                    </div>

                    <div className="relative h-[420px] lg:h-[480px] w-full max-w-sm mx-auto overflow-visible select-none mt-4">
                        <img
                            src="/assets/image-1.png"
                            alt="Statistics mockup"
                            className="absolute left-[-12%] bottom-4 w-[52%] z-10 transform -rotate-12 translate-y-4 hover:translate-y-1 hover:rotate-[-6deg] transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                        <img
                            src="/assets/image-2.png"
                            alt="Wallet card mockup"
                            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[56%] z-20 hover:scale-105 transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                        <img
                            src="/assets/image-3.png"
                            alt="Transactions mockup"
                            className="absolute right-[-12%] bottom-4 w-[52%] z-10 transform rotate-12 translate-y-4 hover:translate-y-1 hover:rotate-[6deg] transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                    </div>
                </div>

                <div className="relative z-10 text-xs text-text-muted/40">
                    © 2026 Emporium Capitals. All rights reserved.
                </div>
            </section>

            {/* Right Column - Sign In Form */}
            <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-24 bg-bg-base relative overflow-hidden">
                <div className="absolute top-8 left-8 md:hidden z-10">
                    <Link href="/">
                        <img
                            src="/assets/logo.png"
                            alt="Emporium Capitals Logo"
                            className="h-8 w-auto object-contain"
                        />
                    </Link>
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10 text-left">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
                            {twoFactorRequired ? 'Verify Two-Factor Auth' : 'Sign In To Your Account'}
                        </h1>
                        <p className="text-xs md:text-sm text-text-muted">
                            {twoFactorRequired ? (
                                'Please enter the 6-digit verification code from your authenticator app.'
                            ) : (
                                <>
                                    Don't have an account?{' '}
                                    <Link href="/register" className="text-[#ef4d45] font-bold hover:underline transition-all">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    {pageError && (
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs animate-shake">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{pageError}</span>
                        </div>
                    )}
                    {pageSuccess && (
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-xs">
                            <Check className="size-4 shrink-0" />
                            <span>{pageSuccess}</span>
                        </div>
                    )}

                    {!twoFactorRequired ? (
                        <>
                            <GoogleLoginButton mode="login" onError={handleGoogleError} />

                            <div className="flex items-center gap-4 my-6">
                                <div className="h-[1px] bg-border-subtle/30 flex-1"></div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted/60">
                                    Or continue with
                                </span>
                                <div className="h-[1px] bg-border-subtle/30 flex-1"></div>
                            </div>

                            <form action="/api/auth/login" method="POST" className="space-y-6">
                                <input type="hidden" name="redirect" value={redirectTo} />

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-text-main">
                                        Email Or Username
                                    </label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email or username"
                                        required
                                        className="w-full rounded-xl border border-border-subtle bg-bg-card/45 px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/40 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-text-main">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            required
                                            className="w-full rounded-xl border border-border-subtle bg-bg-card/45 pl-4 pr-11 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/40 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-primary transition-colors cursor-pointer"
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end text-xs font-medium">
                                    <Link href="/forgot-password" className="text-brand-primary font-bold hover:underline transition-all">
                                        Forgot password?
                                    </Link>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="btn-primary w-full py-3.5 text-xs md:text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                    <ShieldCheck className="size-4 text-brand-primary" />
                                    <span>Authenticator Code</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    required
                                    className="w-full rounded-xl border border-border-subtle bg-bg-card/45 px-4 py-3 text-center text-lg font-black tracking-widest text-text-main placeholder-text-muted/20 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTwoFactorRequired(false)}
                                    className="w-1/2 py-3 px-4 border border-border-subtle hover:bg-white/5 font-semibold text-xs md:text-sm rounded-xl transition-all cursor-pointer text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary w-1/2 py-3 text-xs md:text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                                >
                                    Verify Code
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
