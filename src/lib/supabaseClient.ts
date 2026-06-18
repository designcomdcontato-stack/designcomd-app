import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key are required for database features. Please check your .env file.');
}

const rawSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Global force logout helper to cleanly wipe stale/invalid session tokens
const handleGlobalForceLogout = () => {
  console.warn('Supabase Client Interceptor: Detected invalid refresh token / session. Wiping tokens and reloading.');
  try {
    localStorage.removeItem('supabase.auth.token');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }

  if (typeof window !== 'undefined') {
    rawSupabase.auth.signOut().catch(() => {}).finally(() => {
      window.location.reload();
    });
  }
};

// Wraps any chainable thenable (like builder, filter, query) to intercept invalid refresh token errors
function wrapBuilder(promiseOrBuilder: any): any {
  if (!promiseOrBuilder) return promiseOrBuilder;

  if (typeof promiseOrBuilder === 'function') {
    return function(this: any, ...args: any[]) {
      const result = promiseOrBuilder.apply(this, args);
      return wrapBuilder(result);
    };
  }

  if (typeof promiseOrBuilder === 'object') {
    if (typeof promiseOrBuilder.then === 'function') {
      const originalThen = promiseOrBuilder.then;
      promiseOrBuilder.then = function(onfulfilled: any, onrejected: any) {
        return originalThen.call(promiseOrBuilder, (value: any) => {
          if (value && value.error) {
            const errMsg = value.error.message || '';
            if (errMsg.includes('Refresh Token Not Found') || 
                errMsg.includes('Refresh Token is invalid') || 
                errMsg.includes('invalid_grant') ||
                errMsg.includes('Invalid Refresh Token')) {
              handleGlobalForceLogout();
            }
          }
          if (onfulfilled) return onfulfilled(value);
          return value;
        }, (err: any) => {
          if (err) {
            const errMsg = err.message || '';
            if (errMsg.includes('Refresh Token Not Found') || 
                errMsg.includes('Refresh Token is invalid') || 
                errMsg.includes('invalid_grant') ||
                errMsg.includes('Invalid Refresh Token')) {
              handleGlobalForceLogout();
            }
          }
          if (onrejected) return onrejected(err);
          throw err;
        });
      };
    }

    // Dynamic proxy to intercept and wrap nested chained method calls
    return new Proxy(promiseOrBuilder, {
      get(target, prop, receiver) {
        if (prop === 'then') {
          return target.then;
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          return function(this: any, ...args: any[]) {
            const res = val.apply(this, args);
            return wrapBuilder(res);
          };
        }
        return val;
      }
    });
  }

  return promiseOrBuilder;
}

// Proxied supabase client intercepts from() and rpc() to wrap returned thenables
export const supabase = new Proxy(rawSupabase, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    if (prop === 'from' || prop === 'rpc') {
      return function(this: any, ...args: any[]) {
        const res = val.apply(this, args);
        return wrapBuilder(res);
      };
    }
    return val;
  }
});
