'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

/**
 * Exige que el usuario tenga cierto rol (por defecto 'admin').
 * Devuelve 'ok' cuando puede renderizar la página; mientras, no pintes nada.
 */
export function useRequireRole(required = 'admin') {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok'

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) ¿Hay sesión?
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) { router.replace('/login'); return; }

      // 2) ¿Tiene el rol?
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', user.id)
        .maybeSingle();

      if (error || !profile || profile.role !== required) {
        router.replace('/'); // sin permiso → fuera
        return;
      }

      if (alive) setStatus('ok');
    })();

    return () => { alive = false; };
  }, [router, required]);

  return status;
}
