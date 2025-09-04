'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

export function useRequireAuth() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'noauth' | 'ok'

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        setStatus('noauth');
        // redirige fuera del render
        router.replace('/login');
      } else {
        setStatus('ok');
      }
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!mounted) return;
      if (!sess) {
        setStatus('noauth');
        router.replace('/login');
      } else {
        setStatus('ok');
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  return { status };
}
