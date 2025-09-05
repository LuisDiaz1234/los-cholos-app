'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const DAILY_GOAL = Number(process.env.NEXT_PUBLIC_DAILY_GOAL || 220);

// util fecha local YYYY-MM-DD
function dstr(d=new Date()) {
  const off = d.getTimezoneOffset()*60000;
  return new Date(d - off).toISOString().slice(0,10);
}
function addDays(base, n) {
  const d = new Date(base); d.setDate(d.getDate()+n); return d;
}

export default function Dashboard() {
  const [from, setFrom] = useState(dstr(addDays(new Date(), -30)));
  const [to, setTo] = useState(dstr(new Date()));
  const [rows, setRows] = useState([]);
  const [today, setToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // ventas del rango
    const { data: daily } = await supabase.rpc('sales_by_day', { p_from: from, p_to: to }); 
    // si no tienes sales_by_day, puedes usar:
    // const { data: daily } = await supabase.from('sales')
    //   .select('sale_date, total').gte('sale_date', from).lte('sale_date', to);

    setRows(daily || []);
    // hoy
    const { data: t } = await supabase.from('sales').select('total').eq('sale_date', dstr()).returns();
    const todaySum = (t||[]).reduce((s,r)=>s+Number(r.total||0),0);
    setToday(todaySum);
    setLoading(false);
  };

  useEffect(()=>{ load(); }, [from, to]);

  // normaliza datos por fecha
  const points = useMemo(()=>{
    // construir mapa del rango con 0
    const map = new Map();
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      map.set(dstr(d), 0);
      d = addDays(d, 1);
    }
    for (const r of rows) {
      const key = r.sale_date || r.date || r.day;
      const val = Number(r.total || r.sum || r.amount || 0);
      if (map.has(key)) map.set(key, (map.get(key)||0) + val);
    }
    return Array.from(map.entries()).map(([date, total])=>({ date, total }));
  }, [rows, from, to]);

  const totalRange = points.reduce((s,p)=>s+p.total,0);
  const orders = rows.length;
  const avgTicket = orders ? (totalRange / orders) : 0;
  const goalPct = Math.min(100, Math.round((today / DAILY_GOAL) * 100));
  const remaining = Math.max(0, DAILY_GOAL - today);

  // simple bar chart SVG
  const Chart = () => {
    const width = Math.max(600, points.length * 18);
    const height = 220;
    const max = Math.max(10, ...points.map(p=>p.total));
    const barW = 12;
    const gap = 6;
    const pad = 24;

    return (
      <div style={{overflowX:'auto'}}>
        <svg width={width+pad*2} height={height+pad*2}>
          <g transform={`translate(${pad},${pad})`}>
            {/* eje y */}
            <line x1="0" y1="0" x2="0" y2={height} stroke="#ddd" />
            {/* barras */}
            {points.map((p, i) => {
              const h = Math.round((p.total / max) * (height-10));
              const x = i*(barW+gap) + 8;
              const y = height - h;
              return (
                <g key={p.date}>
                  <rect x={x} y={y} width={barW} height={h} rx="3" ry="3" fill="#f59e0b" />
                  {/* etiqueta cada 5 días */}
                  {i%5===0 && (
                    <text x={x-6} y={height+14} fontSize="10" fill="#999">{p.date.slice(5)}</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Dashboard de ventas</h2>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12}}>
          <div className="card">
            <div>Ventas (rango)</div>
            <div style={{fontWeight:700}}>B/. {totalRange.toFixed(2)}</div>
          </div>
          <div className="card">
            <div>Órdenes (rango)</div>
            <div style={{fontWeight:700}}>{orders}</div>
          </div>
          <div className="card">
            <div>Ticket promedio</div>
            <div style={{fontWeight:700}}>B/. {avgTicket.toFixed(2)}</div>
          </div>
          <div className="card">
            <div>Hoy vs meta</div>
            <div style={{fontWeight:700}}>B/. {today.toFixed(2)} / B/. {DAILY_GOAL.toFixed(2)}</div>
            <div className="progress" style={{marginTop:6}}><span style={{width:`${goalPct}%`}}/></div>
            <div style={{fontSize:12, color:'var(--muted)'}}>{goalPct}% — Faltan B/. {remaining.toFixed(2)}</div>
          </div>
        </div>

        <div style={{display:'flex', gap:8, alignItems:'center', margin:'12px 0'}}>
          <label>Desde</label>
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
          <label>Hasta</label>
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
          <button className="btn" onClick={load} disabled={loading}>Refrescar</button>
        </div>

        {loading ? <div className="card">Cargando…</div> : <Chart />}
      </div>
    </main>
  );
}
