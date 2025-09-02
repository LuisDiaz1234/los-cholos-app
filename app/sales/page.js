'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const iso = d => new Date(d).toISOString().slice(0,10);
const today = () => iso(new Date());
const daysAgo = n => iso(new Date(Date.now()-n*86400000));

export default function SalesHistory() {
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState({ total:0, byMethod:{} });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales').select('id,sale_date,total,payment_method').gte('sale_date', from).lte('sale_date', to).order('sale_date',{ascending:false});
    const total = (data||[]).reduce((s,r)=>s+Number(r.total||0),0);
    const by = (data||[]).reduce((a,r)=>{const k=r.payment_method||'otros'; a[k]=(a[k]||0)+Number(r.total||0); return a;}, {});
    setRows(data||[]); setSummary({ total, byMethod:by }); setLoading(false);
  };
  useEffect(()=>{ load(); },[from,to]);

  const exportCsv = () => {
    const csv = ['Fecha,Método,Total,ID', ...(rows||[]).map(r=>`${r.sale_date},${r.payment_method},${r.total},${r.id}`)].join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='ventas.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Ventas — Historial</h2>
        <div className="grid cols-3" style={{alignItems:'end'}}>
          <div><div>Desde</div><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
          <div><div>Hasta</div><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
          <div><button className="btn" onClick={load} disabled={loading}>{loading?'Cargando…':'Refrescar'}</button> <button className="btn" onClick={exportCsv}>Exportar CSV</button></div>
        </div>
        <div style={{marginTop:8}}>Total: <strong>B/. {summary.total.toFixed(2)}</strong>{Object.keys(summary.byMethod).length>0 && <span style={{marginLeft:12,opacity:.8}}>{Object.entries(summary.byMethod).map(([k,v])=>`${k}: B/. ${v.toFixed(2)}`).join(' · ')}</span>}</div>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Fecha</th><th>Método</th><th>Total</th><th>ID</th></tr></thead>
          <tbody>{(rows||[]).map(r=>(
            <tr key={r.id}><td>{r.sale_date}</td><td>{r.payment_method}</td><td>B/. {Number(r.total).toFixed(2)}</td><td style={{fontFamily:'monospace'}}>{r.id.slice(0,8)}…</td></tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
