'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const iso = d => new Date(d).toISOString().slice(0,10);
const today = () => iso(new Date());
const daysAgo = n => iso(new Date(Date.now()-n*86400000));

export default function SalesHistory() {
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byMethod: {} });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales')
      .select('id, sale_date, total, payment_method')
      .gte('sale_date', from).lte('sale_date', to)
      .order('sale_date', { ascending:false });
    const total = (data||[]).reduce((s,r)=>s+Number(r.total||0),0);
    const byMethod = (data||[]).reduce((acc,r)=>{
      const k = r.payment_method || 'otros';
      acc[k] = (acc[k]||0)+Number(r.total||0);
      return acc;
    }, {});
    setRows(data||[]); setSummary({ total, byMethod }); setLoading(false);
  };
  useEffect(()=>{ load(); },[from,to]);

  return (
    <main className="grid" style={{ gap:16 }}>
      <div className="card">
        <h2>Ventas — Historial</h2>
        <div className="grid cols-3" style={{alignItems:'end'}}>
          <div><div>Desde</div><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div><div>Hasta</div><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
          <button className="btn" onClick={load} disabled={loading}>{loading?'Cargando…':'Refrescar'}</button>
        </div>
        <div style={{marginTop:8}}>
          Total: <strong>B/. {summary.total.toFixed(2)}</strong>
          {Object.keys(summary.byMethod).length>0 && (
            <span style={{marginLeft:12, opacity:.8}}>
              {Object.entries(summary.byMethod).map(([k,v])=>`${k}: B/. ${v.toFixed(2)}`).join(' · ')}
            </span>
          )}
        </div>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Fecha</th><th>Método</th><th>Total</th><th>ID</th></tr></thead>
          <tbody>
            {(rows||[]).map(r=>(
              <tr key={r.id}>
                <td>{r.sale_date}</td>
                <td>{r.payment_method}</td>
                <td>B/. {Number(r.total).toFixed(2)}</td>
                <td style={{fontFamily:'monospace'}}>{r.id.slice(0,8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
