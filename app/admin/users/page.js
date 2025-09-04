'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRequireRole } from '../../../lib/useRequireRole';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminUsersPage() {
  const ok = useRequireRole('admin');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (ok !== 'ok') return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, uid, email, role, created_at')
        .order('created_at', { ascending:false });
      setRows(error ? [] : (data || []));
    })();
  }, [ok]);

  if (ok !== 'ok') return null;

  return (
    <div className="card">
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
        </tbody>
      </table>
    </div>
  );
}
