'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok'

  useEffect(() => {
    let unsub;

    // comprobar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        if (pathname !== '/login') router.replace('/login');
      } else {
        setStatus('ok');
      }
    });

    // escuchar cambios de auth
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (pathname !== '/login') router.replace('/login');
      } else {
        setStatus('ok');
      }
    });

    unsub = data.subscription;
    return () => { unsub && unsub.unsubscribe(); };
  }, [router, pathname]);

  return status;
}
