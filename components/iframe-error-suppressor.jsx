'use client';
import { useEffect } from 'react';

export default function IframeErrorSuppressor() {
  useEffect(() => {
    const shouldSuppress = (msg) => {
      if (!msg) return false;
      const m = String(msg).toLowerCase();
      return (
        m.includes('contentwindow is not available') ||
        m.includes('cannot listen to the event from the provided iframe') ||
        m.includes('crxlauncher') ||
        m.includes('invalid source map')
      );
    };
    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args) => {
      const first = args[0];
      if (shouldSuppress(first) || shouldSuppress(first?.message) || shouldSuppress(String(args).toLowerCase())) return;
      origError.apply(console, args);
    };
    console.warn = (...args) => {
      if (shouldSuppress(args[0])) return;
      origWarn.apply(console, args);
    };
    const onError = (event) => {
      if (shouldSuppress(event.message) || shouldSuppress(event.error?.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    };
    const onRejection = (event) => {
      const msg = event.reason?.message || String(event.reason || '');
      if (shouldSuppress(msg)) event.preventDefault();
    };
    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = origError;
      console.warn = origWarn;
    };
  }, []);
  return null;
}
