'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function useRequireAuth() {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | ok

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) { router.replace('/login'); return; }
      setStatus('ok');
    })();
    return () => { alive = false; };
  }, [router]);

  return status;
}
