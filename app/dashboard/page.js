// app/dashboard/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function ymd(d) { return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

export default function Dashboard() {
  const today = ymd(new Date());
  const monthAgo = ymd(new Date(Date.now()-29*864e5));

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState([]);

  async function load() {
    const { data, error } = await supabase
      .from('sales')
      .select('sale_date,total')
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: true });
    if (!error) setRows(data || []);
  }

  useEffect(()=>{ load(); }, []); // first load
  const refresh = ()=>load();

  const byDay = useMemo(()=>{
    const map = new Map();
    for (const r of rows) {
      const k = r.sale_date;
      map.set(k, (map.get(k)||0) + Number(r.total||0));
    }
    const out=[];
    // build continuous axis
    const start = new Date(from);
    const end = new Date(to);
    for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
      const k = ymd(new Date(d));
      out.push({ day:k, total: +(map.get(k)||0).toFixed(2) });
    }
    return out;
  }, [rows, from, to]);

  const sum = rows.reduce((s,r)=>s+Number(r.total||0),0);
  const orders = rows.length;
  const avg = orders? sum/orders : 0;

  const DAILY_GOAL = Number(process.env.NEXT_PUBLIC_DAILY_GOAL || 220);
  const todayTotal = rows.filter(r=>r.sale_date===today).reduce((s,r)=>s+Number(r.total||0),0);
  const pct = Math.min(100, Math.round((todayTotal/DAILY_GOAL)*100));

  // chart sizes
  const max = Math.max(1, ...byDay.map(d=>d.total));
  const W = 860;
  const H = 220;
  const barW = Math.max(4, Math.floor(W/byDay.length)-2);

  return (
    <main className="card">
      <h2>Dashboard de ventas</h2>

      <div className="grid cols-4" style={{marginBottom:16}}>
        <div className="card stat"><div>Ventas (rango)</div><strong>B/. {sum.toFixed(2)}</strong></div>
        <div className="card stat"><div>Órdenes (rango)</div><strong>{orders}</strong></div>
        <div className="card stat"><div>Ticket promedio</div><strong>B/. {avg.toFixed(2)}</strong></div>
        <div className="card stat">
          <div>Hoy vs meta</div>
          <strong>B/. {todayTotal.toFixed(2)} / B/. {DAILY_GOAL.toFixed(2)}</strong>
          <div className="progress"><span style={{width:`${pct}%`}}/></div>
        </div>
      </div>

      <div className="grid cols-3" style={{alignItems:'end', gap:12, marginBottom:8}}>
        <div>
          <div>Desde</div>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <div>Hasta</div>
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div>
          <div>&nbsp;</div>
          <button className="btn" onClick={refresh}>Refrescar</button>
        </div>
      </div>

      {/* Gráfica de barras (SVG) */}
      <div className="card" style={{overflowX:'auto'}}>
        <svg width={Math.max(W, byDay.length*(barW+2))} height={H+40}>
          {/* ejes */}
          <line x1="40" y1="10" x2="40" y2={H} stroke="currentColor" opacity=".2"/>
          <line x1="40" y1={H} x2={Math.max(W, byDay.length*(barW+2))} y2={H} stroke="currentColor" opacity=".2"/>
          {/* barras */}
          {byDay.map((d, i)=>{
            const h = Math.round((d.total/max)* (H-20));
            const x = 42 + i*(barW+2);
            const y = H - h;
            return (
              <g key={d.day}>
                <rect x={x} y={y} width={barW} height={h} rx="3" />
                {i%4===0 && (
                  <text x={x} y={H+14} fontSize="10">{d.day.slice(5)}</text>
                )}
              </g>
            );
          })}
          {/* labels de referencia */}
          <text x="0" y="20" fontSize="10">B/. {max.toFixed(2)}</text>
          <text x="0" y={H} fontSize="10">0</text>
        </svg>
      </div>
    </main>
  );
}
