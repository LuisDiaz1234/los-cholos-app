'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('Accediendo...');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Ok, redirigiendo…');
    router.replace('/');
  };

  return (
    <div className="card auth-card">
      <h2>Acceder</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
        <input
          className="input"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />
        <button className="btn">Entrar</button>
      </form>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
