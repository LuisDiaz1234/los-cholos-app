'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export default function UserMenu(){
  const [email, setEmail] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(user?.email || '');
    })();
    return ()=>{ mounted=false; };
  }, [pathname]);

  const logout = async ()=>{
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (!email) {
    return <Link className="btn" href="/login">Acceder</Link>;
  }
  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <span className="muted" title={email}>{email}</span>
      <button className="btn" onClick={logout}>Salir</button>
    </div>
  );
}
