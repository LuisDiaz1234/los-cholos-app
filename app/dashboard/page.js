'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const iso = d => new Date(d).toISOString().slice(0,10);
const today = () => iso(new Date());
const daysAgo = n => iso(new Date(Date.now() - n*86400000));
const fmt = n => `B/. ${Number(n||0).toFixed(2)}`;
const DAILY_GOAL = Number(process.env.NEXT_PUBLIC_DAILY_GOAL || 220);

export default function Dashboard(){
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [sales, setSales] = useState([]); // {id, sale_date, total, payment_method}
  const [items, setItems] = useState([]); // sale_items joined later
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    // 1) Ventas del rango
    const { data: s } = await supabase
      .from('sales')
      .select('id,sale_date,total,payment_method')
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: true });

    const ids = (s||[]).map(r=>r.id);
    let it = [];
    if (ids.length > 0) {
      // 2) Items de esas ventas
      const { data: si } = await supabase
        .from('sale_items')
        .select('sale_id, product_id, qty, unit_price')
        .in('sale_id', ids);
      it = si || [];
    }
    setSales(s||[]);
    setItems(it);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [from, to]);

  // ======= KPIs =======
  const kpis = useMemo(()=>{
    const total = (sales||[]).reduce((a,b)=>a+Number(b.total||0),0);
    const orders = (sales||[]).length;
    const avg = orders ? total/orders : 0;

    const todayTotal = (sales||[]).filter(r=>r.sale_date===today()).reduce((a,b)=>a+Number(b.total||0),0);
    const goalPct = Math.min(100, Math.round((todayTotal/DAILY_GOAL)*100));
    const remaining = Math.max(0, DAILY_GOAL - todayTotal);

    return { total, orders, avg, todayTotal, goalPct, remaining };
  }, [sales]);

  // ======= Serie diaria =======
  const daily = useMemo(()=>{
    const m = new Map();
    (sales||[]).forEach(r => m.set(r.sale_date, (m.get(r.sale_date)||0) + Number(r.total||0)));
    // completar días vacíos
    const out = [];
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      const key = d.toISOString().slice(0,10);
      out.push({ date: key, total: m.get(key)||0 });
      d.setDate(d.getDate()+1);
    }
    return out;
  }, [sales, from, to]);

  // ======= Métodos de pago =======
  const byMethod = useMemo(()=>{
    const map = {};
    (sales||[]).forEach(r=>{
      const k = r.payment_method || 'otros';
      map[k] = (map[k]||0) + Number(r.total||0);
    });
    return Object.entries(map).map(([method, total])=>({ method, total })).sort((a,b)=>b.total-a.total);
  }, [sales]);

  // ======= Top productos (por revenue) =======
  const topProducts = useMemo(()=>{
    const map = new Map(); // product_id -> {qty, revenue}
    (items||[]).forEach(r=>{
      const rev = Number(r.qty||0)*Number(r.unit_price||0);
      const prev = map.get(r.product_id) || { qty:0, revenue:0 };
      map.set(r.product_id, { qty: prev.qty + Number(r.qty||0), revenue: prev.revenue + rev });
    });
    const arr = Array.from(map.entries()).map(([pid, v])=>({ product_id: pid, ...v }));
    return arr.sort((a,b)=>b.revenue-a.revenue).slice(0,10);
  }, [items]);

  const [prodNames, setProdNames] = useState({});
  useEffect(()=>{
    (async ()=>{
      const ids = topProducts.map(p=>p.product_id);
      if (ids.length===0) return setProdNames({});
      const { data } = await supabase.from('products').select('id,name').in('id', ids);
      const by = Object.fromEntries((data||[]).map(x=>[x.id, x.name]));
      setProdNames(by);
    })();
  }, [topProducts]);

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Dashboard de ventas</h2>

        {/* KPIs */}
        <div className="grid cols-4" style={{marginTop:8}}>
          <KPI title="Ventas (rango)" value={fmt(kpis.total)}/>
          <KPI title="Órdenes (rango)" value={kpis.orders}/>
          <KPI title="Ticket promedio" value={fmt(kpis.avg)}/>
          <div className="kpi">
            <div className="kpi-title">Hoy vs meta</div>
            <div className="kpi-value">{fmt(kpis.todayTotal)} <span className="muted">/ {fmt(DAILY_GOAL)}</span></div>
            <div className="progress"><span style={{width:`${kpis.goalPct}%`}}/></div>
            <div className="muted">{kpis.goalPct}% — Faltan {fmt(kpis.remaining)}</div>
          </div>
        </div>

        {/* Gráfica diaria (barras) */}
        <div className="card" style={{marginTop:12}}>
          <h3>Ventas por día</h3>
          <DailyBars data={daily}/>
        </div>

        {/* Métodos de pago */}
        <div className="card" style={{marginTop:12}}>
          <h3>Desglose por método</h3>
          <div className="hbars">
            {byMethod.map(m=>(
              <div key={m.method} className="hbar-row">
                <div className="hbar-label">{m.method}</div>
                <div className="hbar-track"><span style={{width:`${byMethod[0].total? (m.total/byMethod[0].total)*100 : 0}%`}}/></div>
                <div className="hbar-val">{fmt(m.total)}</div>
              </div>
            ))}
            {byMethod.length===0 && <div className="muted">Sin ventas en el rango.</div>}
          </div>
        </div>

        {/* Top productos */}
        <div className="card" style={{marginTop:12}}>
          <h3>Top productos</h3>
          <table className="table">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr></thead>
            <tbody>
              {topProducts.map(p=>(
                <tr key={p.product_id}>
                  <td>{prodNames[p.product_id] || p.product_id}</td>
                  <td>{Number(p.qty).toFixed(0)}</td>
                  <td>{fmt(p.revenue)}</td>
                </tr>
              ))}
              {topProducts.length===0 && <tr><td colSpan={3} className="muted">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Filtros de fechas */}
        <div className="grid cols-3" style={{alignItems:'end', marginTop:12}}>
          <div><div>Desde</div><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
          <div><div>Hasta</div><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
          <div><button className="btn" onClick={load} disabled={loading}>{loading?'Cargando…':'Refrescar'}</button></div>
        </div>
      </div>
    </main>
  );
}

/* ====== UI helpers ====== */
function KPI({ title, value }) {
  return (
    <div className="kpi">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function DailyBars({ data }) {
  if (!data || data.length===0) return <div className="muted">Sin datos</div>;
  const max = Math.max(...data.map(d=>d.total), 1);
  return (
    <div className="daily-chart">
      {data.map(d=>(
        <div key={d.date} className="bar">
          <div className="bar-fill" style={{height:`${(d.total/max)*100}%`}} title={`${d.date}: B/. ${Number(d.total).toFixed(2)}`}/>
          <div className="bar-x">{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}
