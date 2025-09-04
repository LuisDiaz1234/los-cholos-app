'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabaseClient';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok'

  useEffect(() => {
    let sub;

    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (!session) {
        if (pathname !== '/login') router.replace('/login');
      } else {
        setStatus('ok');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        if (pathname !== '/login') router.replace('/login');
      } else {
        setStatus('ok');
      }
    });

    sub = data?.subscription;
    return () => sub?.unsubscribe();
  }, [router, pathname]);

  return status;
}
