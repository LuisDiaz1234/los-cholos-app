'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => setUser(user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => data.subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) return <Link className="btn small" href="/login">Acceder</Link>;

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <span className="badge">{user.email}</span>
      <button className="btn small" onClick={logout}>Salir</button>
    </div>
  );
}
