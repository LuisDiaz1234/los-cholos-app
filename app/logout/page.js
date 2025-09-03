'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Logout(){
  const router = useRouter();
  useEffect(()=>{
    (async ()=>{ await supabase.auth.signOut(); router.replace('/'); })();
  },[router]);
  return <main className="card">Cerrando sesión…</main>;
}
