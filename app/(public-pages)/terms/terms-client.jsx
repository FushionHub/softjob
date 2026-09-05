'use client';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms', body: 'By creating an account or using Emporium Capitals you agree to these Terms. If you do not agree, do not use the platform. You must be at least 18 years old and legally permitted to use crypto investment services in your jurisdiction.' },
  { id: 'accounts', title: '2. Accounts & KYC', body: 'You must provide accurate registration details and complete identity verification (KYC) when requested. One account per person. You are responsible for keeping your credentials secret. Verified profiles are locked from editing for security; contact support for changes.' },
  { id: 'deposits', title: '3. Deposits & Withdrawals', body: 'Deposits are credited after payment confirmation via our gateway. Withdrawals are processed to the wallet address you supply — double-check it, as crypto transfers are irreversible. Minimums, fees and processing times shown on the platform apply. We may hold or review transactions for fraud or compliance.' },
  { id: 'investments', title: '4. Investment Plans', body: 'Plan returns, durations and limits are stated on the Plans page. Profits accrue per plan terms and are credited to your balance. Early termination rules, where applicable, are shown before you confirm an investment.' },
  { id: 'risk', title: '5. Risk Disclosure', body: 'Crypto assets and trading are volatile and high-risk. Returns are never guaranteed and you may lose part or all of your capital. Never invest funds you cannot afford to lose. Past performance of any plan or trader does not predict future results.' },
  { id: 'referrals', title: '6. Referrals', body: 'Referral bonuses are paid per the current referral terms. Self-referrals, fake accounts and bonus abuse lead to bonus reversal and account suspension.' },
  { id: 'conduct', title: '7. Prohibited Conduct', body: 'No fraud, chargeback abuse, account sharing, automated abuse, or use of the platform for illicit activity. We may suspend accounts, reverse abusive transactions, and report illegal activity to authorities.' },
  { id: 'termination', title: '8. Suspension & Termination', body: 'We may suspend or close accounts that breach these Terms. Remaining balances, less any owed fees or reversed abusive credits, are withdrawable subject to verification.' },
  { id: 'liability', title: '9. Liability', body: 'The platform is provided "as is". To the maximum extent permitted by law we are not liable for market losses, network failures, or third-party service outages (payment gateways, price feeds).' },
  { id: 'changes', title: '10. Changes', body: 'We may update these Terms; material changes are announced in-app. Continued use after changes take effect constitutes acceptance.' },
];

export default function TermsClient() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: February 2026</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-white/5 bg-[#05081c] p-6">
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
