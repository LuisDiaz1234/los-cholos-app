// app/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function UsersPage() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      // quién soy y mi perfil
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        window.location.href = '/login';
        return;
      }
      const { data: my } = await supabase.from('profiles').select('uid,email,role').eq('uid', uid).maybeSingle();
      setMe(my || null);
      if (my?.role !== 'admin') {
        // no admin → volver al POS
        window.location.href = '/';
        return;
      }
      load();
    })();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from('profiles')
      .select('uid,email,role,created_at')
      .order('created_at', { ascending: false });
    if (!error) setRows(data||[]);
  }

  async function createProfile() {
    setMsg('');
    if (!email) return;
    // crea/actualiza fila en profiles (cuando la persona se registre, se fusiona por email)
    const { error } = await supabase.from('profiles')
      .upsert({ email, role }, { onConflict: 'email' });
    if (error) setMsg(error.message);
    else { setMsg('Perfil creado/actualizado.'); setEmail(''); setRole('staff'); load(); }
  }

  async function changeRole(uid, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('uid', uid);
    if (!error) load();
  }

  return (
    <main className="card">
      <h2>Usuarios</h2>

      <div className="card" style={{marginBottom:12}}>
        <h3>Crear / invitar</h3>
        <div className="grid cols-3">
          <input className="input" placeholder="email@ejemplo.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn" onClick={createProfile}>Guardar</button>
        </div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
        <p style={{marginTop:8,opacity:.7}}>
          Tip: crea aquí el perfil y luego registra al usuario en <em>Auth → Add user</em> en Supabase (o que se registre con ese email).
        </p>
      </div>

      <div className="card">
        <h3>Listado</h3>
        <table className="table">
          <thead><tr><th>Email</th><th>Rol</th><th>Creado</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.uid || r.email}>
                <td>{r.email}</td>
                <td>
                  <select className="input" value={r.role||'staff'} onChange={e=>changeRole(r.uid, e.target.value)}>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{r.created_at?.slice(0,10) || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
