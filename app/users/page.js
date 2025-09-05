'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function UsersPage() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // quién soy (para esconder la edición si no soy admin)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      // mi perfil (tabla profiles)
      const { data } = await supabase.from('profiles')
        .select('uid, email, role').eq('uid', user.id).maybeSingle();
      setMe(data || { role:'staff' });
    })();
  }, []);

  const load = async () => {
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error cargando usuarios');
      setRows(json.users || []);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (uid, role) => {
    setMsg('Guardando…');
    const res = await fetch(`/api/admin/users/${uid}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ role })
    });
    const json = await res.json();
    if (!res.ok) { setMsg(json.error || 'Error'); return; }
    setMsg('Actualizado ✔️');
    await load();
  };

  if (!me) return <main className="card">Cargando…</main>;

  const isAdmin = me.role === 'admin';

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Usuarios</h2>
        <div style={{margin:'8px 0 12px', color:'var(--muted)'}}>
          Tu rol: <b>{me.role}</b>
        </div>

        {loading ? <div className="card">Cargando…</div> : (
          <table className="table">
            <thead>
              <tr><th>Email</th><th>Rol</th><th>Creado</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(u=>(
                <tr key={u.uid}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at).toLocaleString()}</td>
                  <td>
                    {isAdmin && (
                      <select
                        className="input"
                        defaultValue={u.role}
                        onChange={e=>updateRole(u.uid, e.target.value)}
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </main>
  );
}
