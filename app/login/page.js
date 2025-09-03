'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const router = useRouter();

  const onSubmit = async (e)=>{
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.replace('/dashboard');
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card" style={{maxWidth:420}}>
        <h2>Acceder</h2>
        <form onSubmit={onSubmit} className="grid cols-1" style={{gap:8}}>
          <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn" type="submit">Entrar</button>
        </form>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </main>
  );
}
