'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * Página de Usuarios (sólo ADMIN)
 * - NO redirige al POS. Si no eres admin, muestra un aviso.
 * - Lista usuarios (tabla profiles) y permite cambiar rol.
 *
 * Requisitos:
 *  - Tabla public.profiles { id, uid, email, role, created_at }
 *  - RLS que permita al admin leer/escribir (ya lo tienes).
 */
export default function UsersPage() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);     // rol del que está logeado
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  // Cargar sesión + rol del usuario actual
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr('');
      const { data: sdata } = await supabase.auth.getSession();
      const ses = sdata?.session || null;
      if (!mounted) return;
      setSession(ses);

      if (!ses) {
        setLoading(false);
        return;
      }
      const { data: prof, error: eP } = await supabase
        .from('profiles')
        .select('role')
        .eq('uid', ses.user.id)
        .maybeSingle();
      if (eP) setErr(eP.message);
      setRole(prof?.role || null);

      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar listado de perfiles (sólo si admin)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (role !== 'admin') return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, uid, email, role, created_at')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (error) setErr(error.message);
      setRows(data || []);
    })();
    return () => { mounted = false; };
  }, [role]);

  const changeRole = async (uid, newRole) => {
    const prev = rows.slice();
    setRows(rows.map(r => r.uid === uid ? { ...r, role: newRole } : r));
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('uid', uid);
    if (error) {
      setRows(prev);
      alert('Error actualizando rol: ' + error.message);
    }
  };

  if (loading) {
    return <main className="container"><div className="card">Cargando…</div></main>;
  }

  // Si NO logeado:
  if (!session) {
    return (
      <main className="container">
        <div className="card">
          <h2>Usuarios</h2>
          <div className="muted">Debes iniciar sesión para ver esta sección.</div>
        </div>
      </main>
    );
  }

  // Si logeado pero NO admin: NO redirigimos; sólo informamos
  if (role !== 'admin') {
    return (
      <main className="container">
        <div className="card">
          <h2>Usuarios</h2>
          <div className="muted">No tienes permisos para ver esta sección.</div>
        </div>
      </main>
    );
  }

  // Vista ADMIN
  return (
    <main className="container">
      <div className="card">
        <h2>Usuarios</h2>
        {err && <div style={{color:'salmon', marginBottom:12}}>{err}</div>}

        {rows.length === 0 ? (
          <div className="muted">Sin registros.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.email || '—'}</td>
                  <td style={{display:'flex',alignItems:'center',gap:8}}>
                    <select
                      className="input"
                      value={r.role || 'staff'}
                      onChange={e => changeRole(r.uid, e.target.value)}
                      style={{maxWidth:200}}
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                    </select>
                  </td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
