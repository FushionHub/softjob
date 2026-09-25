'use client';

import { AlertTriangle } from 'lucide-react';

const FULL_DISCLAIMER = (
  <>
    All trading and investment activities involve substantial risk of loss.
    Returns shown are <b className="text-white">projections, not guarantees</b> — you may lose part or all of your invested capital.
    Past performance does not indicate future results. Only invest capital you can afford to lose.
    This is not financial advice. By using this platform you agree to our{' '}
    <a href="/terms" target="_blank" className="underline hover:text-white">Terms</a> and{' '}
    <a href="/privacy" target="_blank" className="underline hover:text-white">Privacy Policy</a>.
  </>
);

export default function RiskDisclaimer({ variant = 'full', className = '' }) {
  if (variant === 'compact') {
    return (
      <div className={`bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 ${className}`}>
        <AlertTriangle className="size-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-xs font-black text-amber-300 uppercase">Risk Warning</p>
          <p className="text-xs text-amber-200/70">
            Trading is high-risk. Only trade with funds you can afford to lose. This is not financial advice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 ${className}`}>
      <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <AlertTriangle className="size-4 text-amber-400" />
      </div>
      <div className="text-xs leading-relaxed text-white/60">
        <p className="font-black text-white text-sm">Risk Disclaimer</p>
        <p className="mt-1">{FULL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
