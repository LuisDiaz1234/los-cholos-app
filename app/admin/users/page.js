// app/admin/users/page.js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRequireRole } from '../../../lib/useRequireRole';

export default function UsersPage() {
  const ok = useRequireRole('admin'); // sólo admins
  const [list, setList] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('uid, email, role');
      setList(data || []);
    }
    if (ok === 'ok') load();
  }, [ok]);

  async function createUser(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) { setMsg(error.message); return; }
    await supabase.from('profiles').update({ role }).eq('uid', data.user.id);
    setEmail(''); setPassword(''); setRole('cashier');
    setMsg('Usuario creado.');
  }

  if (ok !== 'ok') return null;

  return (
    <main className="card">
      <h2>Usuarios</h2>
      <form onSubmit={createUser} className="grid" style={{ gap:8 }}>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        <input className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" required />
        <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="cashier">Cajero</option>
          <option value="admin">Administrador</option>
        </select>
        <button className="btn">Crear usuario</button>
      </form>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      <h3 style={{ marginTop: 16 }}>Lista</h3>
      <table className="table">
        <thead><tr><th>Email</th><th>Rol</th></tr></thead>
        <tbody>
          {list.map((u,i) => <tr key={i}><td>{u.email}</td><td>{u.role}</td></tr>)}
        </tbody>
      </table>
    </main>
  );
}
