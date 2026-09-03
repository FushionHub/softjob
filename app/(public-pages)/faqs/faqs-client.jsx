'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Shield } from 'lucide-react';

export default function FaqsClient() {
    // Accordion State
    const [openIndex, setOpenIndex] = useState(null);

    // Newsletter State
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 5000);
        }
    };

    const toggleAccordion = (index) => {
        if (openIndex === index) {
            setOpenIndex(null);
        } else {
            setOpenIndex(index);
        }
    };

    const faqs = [
        {
            question: "How do I verify my identity on Emporium Capitals?",
            answer: "To verify your identity, log in to your account, go to the Profile or Settings section, and click on 'Verification'. You will need to upload a valid government-issued ID (Passport, National ID, or Driver's License) and a recent proof of address (utility bill or bank statement)."
        },
        {
            question: "Is there a mobile app for Emporium Capitals?",
            answer: "Currently, we do not have a downloadable mobile app in the app stores. However, our web platform is fully responsive and optimized for all mobile devices, allowing you to manage your investments seamlessly on the go."
        },
        {
            question: "What types of assets can I trade on Emporium Capitals?",
            answer: "Emporium Capitals offers investment opportunities in a wide range of assets, including Cryptocurrency, Agriculture, Real Estate, Forex, and Stocks. Our team manages these assets to generate optimal returns for our users."
        },
        {
            question: "How can I contact Emporium Capitals's support team?",
            answer: "You can contact our client support team by email at support@emporiumcapitals.com or by using the live chat widget available on our website. We offer 24/7 dedicated support to assist with any questions."
        },
        {
            question: "Does Emporium Capitals charge any fees?",
            answer: "We keep our fee structure transparent. There are no hidden charges. We only charge standard administrative or management fees depending on the investment plan you select, which are already factored into the projected returns."
        },
        {
            question: "Can I invest using my local currency on Emporium Capitals?",
            answer: "Yes, we accept various payment options. While our plans are denominated in USD for stability, you can deposit using your local currency or cryptocurrency, and our system will convert it automatically to the selected package."
        },
        {
            question: "Is Emporium Capitals regulated?",
            answer: "Yes, Emporium Capitals operates in compliance with relevant international financial regulations and guidelines, ensuring standard security protocols, client fund segregation, and transparent trade reporting."
        },
        {
            question: "Does Emporium Capitals offer referral bonuses?",
            answer: "Yes! We have an attractive Affiliate and Referral Program. You can earn commissions by inviting new investors to our platform. Details can be found in the Affiliate section of your client portal."
        },
        {
            question: "When can I withdraw my earnings from Emporium Capitals?",
            answer: "Withdrawals are processed according to the duration of your selected investment plan. Once a plan matures, your principal and earnings will be credited to your account balance, and you can withdraw them immediately."
        },
        {
            question: "How secure is my investment on Emporium Capitals?",
            answer: "Security is our highest priority. We use 256-bit SSL encryption, enterprise-grade DDoS protection, and multi-signature cold wallets for asset storage. Additionally, our investments are backed by risk management frameworks."
        },
        {
            question: "What is Emporium Capitals?",
            answer: "Emporium Capitals is a premier managed investment platform designed to make trading approachable. We manage strategic portfolios in crypto, forex, real estate, and agriculture, helping users achieve financial growth effortlessly."
        }
    ];

    return (
        <main className="overflow-x-hidden min-h-screen bg-bg-base pb-24 transition-colors duration-300 relative">
            {/* Header Banner */}
            <section className="relative py-20 md:py-28 flex flex-col items-center justify-center border-b border-border-subtle bg-bg-base overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 right-10 w-[300px] h-[300px] bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-primary tracking-tight text-center relative z-10 transition-transform duration-300 hover:scale-[1.02]">
                    Frequently Asked Questions
                </h1>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wide text-text-muted relative z-10">
                    <Link href="/" className="hover:text-brand-primary transition-colors duration-200">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="text-brand-primary">FAQs</span>
                </div>
            </section>

            {/* Main Accordion Grid Section */}
            <section className="py-16 md:py-24 max-w-6xl mx-auto px-6 relative z-10">
                {/* Background glow */}
                <div className="absolute -left-20 top-40 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Column: Title Block */}
                    <div className="text-left space-y-6">
                        <span className="inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/5 px-5 py-1.5 text-xs font-semibold tracking-wider text-brand-primary uppercase shadow-md shadow-brand-primary/5 hover:bg-brand-primary/10 transition-colors duration-200 cursor-default">
                            FAQs
                        </span>
                        
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-main leading-tight">
                            <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-[#d03d35] bg-clip-text text-transparent block mb-2">
                                Need more information?
                            </span>
                            Reach out to our Client Support.
                        </h2>
                    </div>

                    {/* Right Column: Accordion */}
                    <div className="lg:col-span-2 space-y-4">
                        {faqs.map((faq, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div 
                                    key={idx} 
                                    className="glass-panel border border-border-subtle bg-bg-card/15 shadow-xl rounded-2xl overflow-hidden transition-all duration-300"
                                >
                                    {/* Trigger Header */}
                                    <button 
                                        onClick={() => toggleAccordion(idx)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-bg-card/25 transition-colors duration-200 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Circular Icon background */}
                                            <div className="flex size-10 items-center justify-center rounded-full bg-brand-secondary/40 text-brand-primary shadow-lg border border-brand-primary/20 shrink-0">
                                                <Shield className="size-4.5" />
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-text-main hover:text-brand-primary transition-colors duration-200">
                                                {faq.question}
                                            </span>
                                        </div>

                                        {isOpen ? (
                                            <ChevronUp className="size-4.5 text-brand-primary shrink-0" />
                                        ) : (
                                            <ChevronDown className="size-4.5 text-text-muted shrink-0" />
                                        )}
                                    </button>

                                    {/* Expandable Panel */}
                                    <div 
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                            isOpen ? 'max-h-[300px] border-t border-border-subtle/30' : 'max-h-0'
                                        }`}
                                    >
                                        <div className="p-6 text-xs md:text-sm text-text-muted leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Newsletter Glass-Panel Form */}
            <section className="py-16 px-6 max-w-5xl mx-auto relative z-10">
                <div className="glass-panel p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-br from-bg-card to-bg-base/35 border border-border-subtle shadow-2xl rounded-3xl">
                    {/* Floating glows */}
                    <div className="absolute -top-12 -left-12 size-32 rounded-full bg-brand-primary/10 blur-xl pointer-events-none"></div>
                    <div className="absolute -bottom-12 -right-12 size-32 rounded-full bg-brand-secondary/10 blur-xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 max-w-xl text-center sm:text-left relative z-10">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shadow-inner">
                            <Mail className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-main tracking-tight">
                                Subscribe To Our Newsletter
                            </h3>
                            <p className="text-xs md:text-sm text-text-muted mt-1">
                                Receive latest news & updates from Emporium Capitals.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 relative z-10">
                        {subscribed ? (
                            <div className="text-emerald-400 font-semibold text-sm px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-fade-in">
                                Thank you for subscribing!
                            </div>
                        ) : (
                            <>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email..." 
                                    required
                                    className="w-full sm:w-64 rounded-full border border-border-subtle bg-bg-base/60 px-5 py-3 text-xs text-text-main placeholder-text-muted outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300" 
                                />
                                <button 
                                    type="submit" 
                                    className="btn-primary w-full sm:w-auto text-xs px-6 py-3 font-semibold whitespace-nowrap"
                                >
                                    Subscribe Now
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </section>
        </main>
    );
}
