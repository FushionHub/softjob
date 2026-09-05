'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoogleLoginButton({ onError, referrer, mode = 'login', text }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const btnRef = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) { setReady(false); return; }
    const src = 'https://accounts.google.com/gsi/client';
    if (document.querySelector(`script[src="${src}"]`)) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => setReady(true);
    s.onerror = () => setReady(false);
    document.head.appendChild(s);
  }, [clientId]);

  const handleCredential = async (response) => {
    if (!response?.credential) { onError?.('No Google credential'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, referrer: referrer || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Google login failed');
      // If needs onboarding and user wants to go to onboarding, otherwise dashboard
      if (d.needsOnboarding) {
        // Let caller decide or go to onboarding
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      onError?.(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!ready || !clientId || !window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'pill',
        });
      }
    } catch (e) {
      console.error('Google init failed', e);
    }
  }, [ready, clientId, mode, referrer]);

  const handleFallbackClick = () => {
    if (!clientId) {
      onError?.('Google login not configured — set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // fallback to One Tap prompt failed, user can try popup
        }
      });
    }
  };

  if (!clientId) {
    return (
      <button onClick={() => onError?.('Google OAuth not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env and restart.')} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border-subtle bg-bg-card/30 text-text-main font-semibold text-xs rounded-xl opacity-60">
        <svg className="size-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        <span>{text || (mode==='register' ? 'Continue with Google' : 'Sign in with Google')} (Not configured)</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
      {loading && <div className="mt-2 flex items-center justify-center gap-2 text-xs text-text-muted"><Loader2 className="size-4 animate-spin"/> Connecting Google...</div>}
      <button onClick={handleFallbackClick} className="sr-only">Trigger Google</button>
    </div>
  );
}
