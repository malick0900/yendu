import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export function useGoogleSignIn({ onSuccess, onError }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    let timer = null;

    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            const { data } = await api.post('/auth/google/session', { credential: resp.credential });
            localStorage.setItem('ts_token', data.access_token);
            onSuccess?.(data);
          } catch (err) {
            onError?.(err);
          }
        },
      });
      const width = Math.min(360, ref.current.clientWidth || 320);
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline', size: 'large', width, text: 'continue_with', shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      timer = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(timer); init(); }
      }, 200);
      setTimeout(() => timer && clearInterval(timer), 10000);
    }

    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [onSuccess, onError]);

  return ref;
}
