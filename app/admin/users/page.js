'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRequireRole } from '../../../lib/useRequireRole';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminUsersPage() {
  const role = useRequireRole('admin');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (role !== 'ok') return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, uid, email, role, created_at')
        .order('created_at', { ascending:false });
      setRows(error ? [] : (data || []));
    })();
  }, [role]);

  if (role !== 'ok') return null;

  return (
    <main className="card">
      <h2>Usuarios</h2>
      <table className="table">
        <thead><tr><th>Email</th><th>Rol</th><th>UID</th><th>Creado</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.email}</td>
              <td>{r.role}</td>
              <td style={{fontFamily:'monospace'}}>{r.uid}</td>
              <td>{r.created_at?.slice(0,19).replace('T',' ')}</td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={4}>Sin usuarios.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
