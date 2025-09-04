'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export function useRequireRole(required) {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok'

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', session.user.id)
        .maybeSingle();

      if (!profile || profile.role !== (required || 'admin')) {
        router.replace('/');
        return;
      }
      if (alive) setStatus('ok');
    })();
    return () => { alive = false; };
  }, [router, required]);

  return status;
}
