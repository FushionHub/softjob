'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import GoogleLoginButton from '@/components/google-login-button';

export default function RegisterClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referrer, setReferrer] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    useEffect(()=>{
      const ref = searchParams.get('ref');
      if(ref) setReferrer(ref);
    },[searchParams]);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErrorMsg('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match!');
            return;
        }

        if (!acceptTerms) {
            setErrorMsg('You must accept the Terms and Conditions.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    username,
                    phone,
                    password,
                    referrer,
                    acceptTerms,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg(data.message || 'Registration successful! Please check your email to verify your account.');
                setTimeout(() => {
                    router.push('/login?verified=pending');
                }, 3000);
            } else {
                setErrorMsg(data.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrorMsg('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (msg) => setErrorMsg(msg);

    return (
        <main className="min-h-screen bg-bg-base flex flex-col md:flex-row transition-colors duration-300">
            {/* Left Column - Mockups & Welcome */}
            <section className="hidden md:flex flex-col justify-between w-full md:w-[48%] bg-[#010214] border-r border-border-subtle/30 p-12 lg:p-16 relative overflow-hidden">
                {/* Background ambient glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Logo & Brand */}
                <div className="relative z-10 flex items-center gap-2">
                    <Link href="/">
                        <img 
                            src="/assets/logo.png" 
                            alt="Emporium Capitals Logo" 
                            className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105" 
                        />
                    </Link>
                </div>

                {/* Welcome Heading & Phone Mockups Container */}
                <div className="my-auto relative z-10 flex flex-col items-center">
                    <div className="w-full text-left max-w-md mx-auto mb-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Welcome to <br />
                            <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                                Emporium Capitals
                            </span>
                        </h2>
                    </div>

                    {/* Three Overlapping Phone Mockups */}
                    <div className="relative h-[420px] lg:h-[480px] w-full max-w-sm mx-auto overflow-visible select-none mt-4">
                        {/* Left Phone (Statistics Screen) */}
                        <img 
                            src="/assets/image-1.png" 
                            alt="Statistics mockup" 
                            className="absolute left-[-12%] bottom-4 w-[52%] z-10 transform -rotate-12 translate-y-4 hover:translate-y-1 hover:rotate-[-6deg] transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                        
                        {/* Center Phone (Wallet / Debit Card) */}
                        <img 
                            src="/assets/image-2.png" 
                            alt="Wallet card mockup" 
                            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[56%] z-20 hover:scale-105 transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                        
                        {/* Right Phone (Transactions List) */}
                        <img 
                            src="/assets/image-3.png" 
                            alt="Transactions mockup" 
                            className="absolute right-[-12%] bottom-4 w-[52%] z-10 transform rotate-12 translate-y-4 hover:translate-y-1 hover:rotate-[6deg] transition-all duration-300 shadow-2xl rounded-[2.2rem]"
                            draggable="false"
                        />
                    </div>
                </div>

                {/* Left Bottom Details */}
                <div className="relative z-10 text-xs text-text-muted/40">
                    © 2026 Emporium Capitals. All rights reserved.
                </div>
            </section>

            {/* Right Column - Sign Up Form */}
            <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-16 bg-bg-base relative overflow-y-auto">
                {/* Mobile-only Header Logo */}
                <div className="absolute top-8 left-8 md:hidden z-10">
                    <Link href="/">
                        <img 
                            src="/assets/logo.png" 
                            alt="Emporium Capitals Logo" 
                            className="h-8 w-auto object-contain" 
                        />
                    </Link>
                </div>

                {/* Form wrapper */}
                <div className="w-full max-w-md space-y-6 relative z-10 text-left mt-8 md:mt-0">
                    
                    {/* Header Text */}
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
                            Create an account
                        </h1>
                        <p className="text-xs md:text-sm text-text-muted">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#ef4d45] font-bold hover:underline transition-all">
                                Sign in here.
                            </Link>
                        </p>
                    </div>

                    {/* Google Register button — real login with referrer passthrough */}
                    <GoogleLoginButton mode="register" referrer={referrer} onError={handleGoogleError} text="Continue with Google" />

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-4">
                        <div className="h-[1px] bg-border-subtle/30 flex-1"></div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted/60">
                            Or continue with
                        </span>
                        <div className="h-[1px] bg-border-subtle/30 flex-1"></div>
                    </div>

                    {/* Error & Success States */}
                    {errorMsg && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs animate-shake">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-xs">
                            <Check className="size-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Main Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Name
                            </label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name" 
                                required
                                className="w-full rounded-xl border border-border-subtle bg-[#0a1824] px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                E-Mail
                            </label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@domain.com" 
                                required
                                className="w-full rounded-xl border border-border-subtle bg-[#0a1824] px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                            />
                        </div>

                        {/* Username Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Username
                            </label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username123" 
                                required
                                className="w-full rounded-xl border border-border-subtle bg-[#0a1824] px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                            />
                        </div>

                        {/* Phone Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Phone Number
                            </label>
                            <input 
                                type="tel" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000" 
                                required
                                className="w-full rounded-xl border border-border-subtle bg-[#0a1824] px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Password
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password" 
                                    required
                                    className="w-full rounded-xl border border-border-subtle bg-[#0a1824] pl-4 pr-11 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
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

                        {/* Confirm Password Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? 'text' : 'password'} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password" 
                                    required
                                    className="w-full rounded-xl border border-border-subtle bg-[#0a1824] pl-4 pr-11 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-primary transition-colors cursor-pointer"
                                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Referrer (Optional) Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-muted">
                                Referral Code (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={referrer}
                                onChange={(e) => setReferrer(e.target.value)}
                                placeholder="Referral code" 
                                className="w-full rounded-xl border border-border-subtle bg-[#0a1824] px-4 py-3 text-xs md:text-sm text-text-main placeholder-text-muted/30 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-300"
                            />
                        </div>

                        {/* Accept Terms Checkbox */}
                        <div className="flex items-center gap-2 pt-1 text-xs">
                            <input 
                                type="checkbox" 
                                id="acceptTerms"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="rounded border-border-subtle text-[#ef4d45] focus:ring-[#ef4d45] cursor-pointer bg-[#0a1824]"
                            />
                            <label htmlFor="acceptTerms" className="text-text-muted cursor-pointer select-none">
                                I accept the{' '}
                                <Link href="/terms" className="text-[#3b82f6] hover:underline font-semibold">
                                    Terms and Conditions.
                                </Link>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#8c0030] hover:bg-[#a60039] text-white py-3.5 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}
