'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * Devuelve 'ok' cuando hay sesión. Si no hay sesión, redirige a /login.
 * Nunca condicione el uso de este hook: llámalo siempre al principio del componente.
 */
export function useRequireAuth() {
  const [state, setState] = useState('checking'); // 'checking' | 'ok'

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setState('ok');
      } else {
        // redirigir sin romper render
        window.location.replace('/login');
      }
    }
    check();

    // refresco reactivo si la sesión cambia
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) setState('ok');
      else window.location.replace('/login');
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe?.();
    };
  }, []);

  return state;
}
