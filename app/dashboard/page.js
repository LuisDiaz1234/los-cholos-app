'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
const iso = d => new Date(d).toISOString().slice(0,10);
const today = () => iso(new Date()); const daysAgo = n => iso(new Date(Date.now()-n*86400000));

export default function Dashboard(){
  const [daily, setDaily] = useState([]); const [monthTotal, setMonthTotal] = useState(0);
  const [from, setFrom] = useState(daysAgo(29)); const [to, setTo] = useState(today());

  const load = async () => {
    const { data } = await supabase.rpc('get_daily_sales', { from_date: from, to_date: to });
    setDaily(data||[]);
    const first = new Date(); first.setDate(1); const start = first.toISOString().slice(0,10);
    const { data: m } = await supabase.from('sales').select('total').gte('sale_date', start).lte('sale_date', to);
    setMonthTotal((m||[]).reduce((s,r)=>s+Number(r.total||0),0));
  };
  useEffect(()=>{ load(); },[from,to]);

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Dashboard de ventas</h2>
        <div className="grid cols-3" style={{alignItems:'end'}}>
          <div><div>Desde</div><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div><div>Hasta</div><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
          <div><div>Total del mes</div><div className="badge">B/. {monthTotal.toFixed(2)}</div></div>
        </div>
        <table className="table" style={{marginTop:8}}>
          <thead><tr><th>Fecha</th><th>Total</th></tr></thead>
          <tbody>{(daily||[]).map(r=> (<tr key={r.sale_date}><td>{r.sale_date}</td><td>B/. {Number(r.sum||0).toFixed(2)}</td></tr>))}</tbody>
        </table>
      </div>
    </main>
  );
}
