import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { clearSupabaseAuthTokens, markSupabaseOffline } from './lib/supabaseClient';

// Prevent unhandled promise rejections from stale tokens or unreachable network endpoints from crashing the app
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const fullText = args
      .map(a => {
        try {
          return a?.message || a?.error_description || (typeof a === 'object' ? JSON.stringify(a) : String(a || ''));
        } catch {
          return String(a || '');
        }
      })
      .join(' ')
      .toLowerCase();

    if (
      fullText.includes('failed to fetch') ||
      fullText.includes('network') ||
      fullText.includes('load failed') ||
      fullText.includes('supabase offline') ||
      fullText.includes('pgrst_offline')
    ) {
      console.warn('[Network Offline Notice - Using local storage]:', ...args);
      markSupabaseOffline();
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = (reason?.message || reason?.error_description || String(reason || '')).toLowerCase();
    
    if (
      msg.includes('refresh token') ||
      msg.includes('refresh_token') ||
      msg.includes('invalid_grant') ||
      msg.includes('session_not_found')
    ) {
      event.preventDefault();
      console.warn('Silenced unhandled refresh token error and cleaned stale session:', reason);
      clearSupabaseAuthTokens();
      return;
    }

    if (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('supabase offline') ||
      msg.includes('offline') ||
      msg.includes('pgrst_offline')
    ) {
      event.preventDefault();
      markSupabaseOffline();
      console.warn('Silenced unhandled network fetch error. Routing to local mockDb.');
      return;
    }
  });

  window.addEventListener('error', (event) => {
    const msg = (event?.message || String(event?.error || '')).toLowerCase();
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('offline')
    ) {
      event.preventDefault();
      markSupabaseOffline();
      console.warn('Silenced window network error. Routing to local mockDb.');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

