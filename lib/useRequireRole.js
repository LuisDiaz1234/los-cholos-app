'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

export function useRequireRole(requiredRole='admin') {
  const router = useRouter();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!mounted) return;
      if (!data || (requiredRole && data.role !== requiredRole)) { router.replace('/'); return; }
      setStatus('ok');
    })();
    return () => { mounted = false; };
  }, [router, requiredRole]);

  return status; // 'ok' cuando puede renderizar
}
