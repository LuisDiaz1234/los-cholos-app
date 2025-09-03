'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRequireRole } from '../../../lib/useRequireRole';

export default function AdminUsers(){
  const ok = useRequireRole('admin');
  if (ok!=='ok') return null;

  const [list, setList] = useState([]);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('cashier');
  const [msg,setMsg]=useState('');

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }

  const load = async ()=>{
    const token = await getToken();
    const res = await fetch('/api/admin/users', { headers: { Authorization:`Bearer ${token}` }});
    const json = await res.json();
    if (res.ok) setList(json.users||[]); else setMsg(json.error||'Error');
  };

  const createUser = async (e)=>{
    e.preventDefault();
    const token = await getToken();
    const res = await fetch('/api/admin/users', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ email, password, role })
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error||'Error'); else { setMsg('Usuario creado'); setEmail(''); setPassword(''); setRole('cashier'); load(); }
  };

  const changeRole = async (id, newRole)=>{
    const token = await getToken();
    const res = await fetch(`/api/admin/users/${id}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ role:newRole })
    });
    if (!res.ok) { const j = await res.json(); alert(j.error||'Error'); } else load();
  };

  const removeUser = async(id)=>{
    if (!confirm('¿Eliminar usuario definitivamente?')) return;
    const token = await getToken();
    const res = await fetch(`/api/admin/users/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` }});
    if (!res.ok) { const j = await res.json(); alert(j.error||'Error'); } else load();
  };

  useEffect(()=>{ load(); },[]);

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Usuarios</h2>

        <form onSubmit={createUser} className="grid cols-4" style={{gap:8, marginTop:8}}>
          <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="cashier">Cajero</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="btn" type="submit">Crear usuario</button>
        </form>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <h3>Listado</h3>
        <table className="table">
          <thead><tr><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
          <tbody>
            {list.map(u=>(
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select className="input" value={u.role} onChange={e=>changeRole(u.id, e.target.value)}>
                    <option value="cashier">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td>
                  <button className="btn" onClick={()=>removeUser(u.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan={3}>Sin usuarios</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
