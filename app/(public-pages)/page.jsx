import HeroSection from '@/sections/hero-section';
import WhatWeDoSection from '@/sections/what-we-do-section';
import OurLatestCreations from '@/sections/our-latest-creations';
import HowItWorks from '@/sections/how-it-works';
import PaymentOptions from '@/sections/payment-options';
import FaqSection from '@/sections/faq-section';
import OurTestimonialSection from '@/sections/our-testimonials-section';
import Newsletter from '@/sections/newsletter';

export default function Page() {
    return (
        <main className="overflow-x-hidden">
            <HeroSection />
            <WhatWeDoSection />
            <OurLatestCreations />
            <HowItWorks />
            <PaymentOptions />
            <FaqSection />
            <OurTestimonialSection />
            <Newsletter />
        </main>
    );
}
