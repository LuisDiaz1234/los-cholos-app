'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [msg, setMsg]     = useState('');
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg('Accediendo…');

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setBusy(false); setMsg('Error: ' + error.message); return; }

    setMsg('OK. Redirigiendo…');
    router.replace('/');
  }

  return (
    <div className="card auth-card">
      <h2>Acceder</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
        <input className="input" type="email" placeholder="email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="contraseña"
               value={pass} onChange={e=>setPass(e.target.value)} required />
        <button className="btn" disabled={busy}>Entrar</button>
      </form>
      {msg && <div className="alert" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
