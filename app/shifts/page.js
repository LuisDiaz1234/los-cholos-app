'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';



const fmt = n => `B/. ${Number(n||0).toFixed(2)}`;

export default function ShiftsPage(){
  const [me,setMe]=useState(null);
  const [list,setList]=useState([]);
  const [opening,setOpening]=useState('');
  const [counted,setCounted]=useState('');
  const [notes,setNotes]=useState('');
  const [msg,setMsg]=useState('');

  useEffect(()=>{ (async ()=>{
    const { data:{ user } } = await supabase.auth.getUser();
    setMe(user||null);
    load();
  })(); },[]);

  async function token(){ const { data } = await supabase.auth.getSession(); return data.session?.access_token || ''; }

  async function load(){
    const t = await token();
    const r = await fetch('/api/shifts', { headers:{ Authorization:`Bearer ${t}` }});
    const j = await r.json(); setList(j.shifts||[]);
  }

  const openShift = async ()=>{
    const t = await token();
    const r = await fetch('/api/shifts', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` },
      body: JSON.stringify({ opening_float: Number(opening||0) })
    });
    const j = await r.json();
    if (!r.ok) setMsg(j.error||'Error'); else { setMsg('Turno abierto'); setOpening(''); load(); }
  };

  const closeShift = async (id)=>{
    const t = await token();
    const r = await fetch(`/api/shifts/${id}/close`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` },
      body: JSON.stringify({ cash_counted: Number(counted||0), notes })
    });
    const j = await r.json();
    if (!r.ok) setMsg(j.error||'Error'); else { setMsg(`Cerrado. Esperado ${fmt(j.result?.expected_cash)}, Diferencia ${fmt(j.result?.difference)}`); setCounted(''); setNotes(''); load(); }
  };

  const open = list.find(s=>s.status==='open');

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Turnos y Arqueo</h2>
        {open ? (
          <>
            <div className="muted">Turno abierto desde: {new Date(open.opened_at).toLocaleString()}</div>
            <div className="grid cols-3" style={{marginTop:8}}>
              <div><div>Conteo efectivo (cierre)</div><input className="input" value={counted} onChange={e=>setCounted(e.target.value)} placeholder="0.00"/></div>
              <div><div>Notas</div><input className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Opcional"/></div>
              <div style={{alignSelf:'end'}}><button className="btn" onClick={()=>closeShift(open.id)}>Cerrar turno</button></div>
            </div>
          </>
        ) : (
          <div className="grid cols-3">
            <div><div>Fondo inicial</div><input className="input" value={opening} onChange={e=>setOpening(e.target.value)} placeholder="0.00"/></div>
            <div style={{alignSelf:'end'}}><button className="btn" onClick={openShift}>Abrir turno</button></div>
          </div>
        )}
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <h3>Mis turnos</h3>
        <table className="table">
          <thead><tr><th>Estado</th><th>Apertura</th><th>Fondo</th><th>Cierre</th><th>Esperado</th><th>Conteo</th><th>Diferencia</th></tr></thead>
          <tbody>
            {list.map(s=>(
              <tr key={s.id}>
                <td>{s.status}</td>
                <td>{new Date(s.opened_at).toLocaleString()}</td>
                <td>{fmt(s.opening_float)}</td>
                <td>{s.closed_at ? new Date(s.closed_at).toLocaleString() : '-'}</td>
                <td>{s.expected_cash!=null ? fmt(s.expected_cash) : '-'}</td>
                <td>{s.closing_cash_counted!=null ? fmt(s.closing_cash_counted) : '-'}</td>
                <td>{s.difference!=null ? fmt(s.difference) : '-'}</td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan={7}>Sin registros</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
