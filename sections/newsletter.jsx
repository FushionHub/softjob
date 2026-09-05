'use client';

import { ArrowRight, LogIn } from 'lucide-react';

export default function Newsletter() {
    return (
        <section className="py-20 relative overflow-hidden transition-colors duration-300">
            {/* Glowing background circle */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,77,69,0.08),transparent_50%)] pointer-events-none"></div>

            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="glass-panel border border-border-subtle p-12 text-center relative overflow-hidden bg-gradient-to-br from-bg-card to-bg-base/35">
                    
                    {/* Background glows */}
                    <div className="absolute -top-12 -left-12 size-36 rounded-full bg-brand-primary/10 blur-xl"></div>
                    <div className="absolute -bottom-12 -right-12 size-36 rounded-full bg-brand-secondary/15 blur-xl"></div>

                    <div className="space-y-6 max-w-2xl mx-auto relative z-10">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                            Get Started Today
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-5xl">
                            Invest in Crypto with <span className="text-brand-primary">Confidence</span>
                        </h2>
                        <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-lg mx-auto">
                            Join over 450,000+ smart investors worldwide. Register your account in less than 2 minutes and select a package that fits your objectives.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <a href="/register" className="btn-primary gap-2">
                                <span>Sign Up</span>
                                <ArrowRight className="size-4" />
                            </a>
                            <a href="/login" className="btn-secondary gap-2">
                                <LogIn className="size-4" />
                                <span>Sign In</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
