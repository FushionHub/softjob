'use client';

const sections = [
  { title: '1. Data We Collect', body: 'Account data (name, email, username, phone), verification documents submitted for KYC (ID, selfie, proof of address), transaction records (deposits, withdrawals, trades, swaps, investments), wallet addresses you provide, and technical data (device, logs, cookies).' },
  { title: '2. How We Use It', body: 'To operate your account, process transactions, verify identity, prevent fraud, pay referral bonuses, send transactional emails and notifications, and meet legal obligations.' },
  { title: '3. Cookies', body: 'We use essential cookies for authentication and preferences (including translation settings). No advertising trackers are sold to third parties.' },
  { title: '4. Sharing', body: 'We share data only as needed: payment processors to confirm deposits, email delivery providers, and authorities when legally required. We never sell personal data.' },
  { title: '5. Security', body: 'Passwords are bcrypt-hashed, sessions use httpOnly cookies, wallet secrets are AES-256-GCM encrypted, and admin access is logged. No system is impenetrable; report suspicious activity immediately.' },
  { title: '6. Retention', body: 'Account and transaction records are kept while your account is active and as required by financial regulations afterwards. KYC documents are retained per compliance policy.' },
  { title: '7. Your Rights', body: 'You may request access, correction, or deletion of your data, subject to legal retention duties. Verified profiles are edit-locked; contact support and we will assist after re-verification.' },
  { title: '8. Contact', body: 'Privacy questions: support@emporiumcapitals.com. We respond to verifiable requests within 30 days.' },
];

export default function PrivacyClient() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: February 2026</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-white/5 bg-[#05081c] p-6">
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
