import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== ''
);

let supabaseIsReachable = (function(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const offlineFlag = localStorage.getItem('supabase_offline');
    if (offlineFlag === 'true') return false;
    const failedUrl = localStorage.getItem('supabase_failed_url');
    if (failedUrl && failedUrl === supabaseUrl) return false;
  } catch (e) {}
  return true;
})();

export function isSupabaseOnline(): boolean {
  return isSupabaseConfigured && supabaseIsReachable;
}

export function markSupabaseOffline() {
  if (supabaseIsReachable) {
    supabaseIsReachable = false;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('supabase_offline', 'true');
        if (supabaseUrl) {
          localStorage.setItem('supabase_failed_url', supabaseUrl);
        }
      }
    } catch (e) {}
    console.warn('[SupabaseClient] Endpoint is unreachable or offline. Switching to local mockDb.');
  }
}

export function markSupabaseOnline() {
  supabaseIsReachable = true;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_offline');
      localStorage.removeItem('supabase_failed_url');
    }
  } catch (e) {}
}

export function clearSupabaseAuthTokens() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem('supabase.auth.token');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        !key.startsWith('sb-mock-') &&
        (key.includes('auth-token') ||
         key.includes('supabase.auth') ||
         (key.startsWith('sb-') && key.endsWith('-token')) ||
         key === 'supabase.auth.token')
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Ignore storage clearing exceptions
  }
}

if (!isSupabaseConfigured) {
  console.warn('Supabase URL and Anon Key are not fully configured. Using local/fallback/mock mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input, init) => {
        if (!supabaseIsReachable) {
          return new Response(
            JSON.stringify({
              data: null,
              error: {
                message: 'Supabase offline: routing to local mockDb',
                status: 503,
                code: 'PGRST_OFFLINE'
              }
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        try {
          return await fetch(input, init);
        } catch (err: any) {
          markSupabaseOffline();
          return new Response(
            JSON.stringify({
              data: null,
              error: {
                message: 'Supabase endpoint unreachable, switched to local fallback',
                status: 503,
                code: 'PGRST_OFFLINE'
              }
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }
  }
);


