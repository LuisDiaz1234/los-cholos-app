'use client';

import {useEffect, useMemo, useState} from 'react';
import {supabase} from '../../lib/supabaseClient';

function toLocalDateStr(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
}

export default function ShoppingPage() {
  const [date, setDate] = useState(toLocalDateStr());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async (d = date) => {
    setLoading(true);
    setMsg('');
    // lee la lista ya generada (si existe)
    const { data, error } = await supabase
      .from('shopping_list_ingredients')
      .select('ingredient_name, unit, needed_qty, current_stock, to_buy, for_date')
      .eq('for_date', d)
      .order('ingredient_name', { ascending: true });

    if (error) setMsg(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(date); }, []);

  const totals = useMemo(() => {
    let need = 0, buy = 0;
    for (const r of items) {
      need += Number(r.needed_qty || 0);
      buy  += Number(r.to_buy || 0);
    }
    return { need, buy };
  }, [items]);

  const generate = async () => {
    setLoading(true);
    setMsg('Generando…');
    try {
      // llamamos a la API server-side que ejecuta el RPC
      const res = await fetch('/api/shopping/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_date: date })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error generando lista');
      await load(date);
      setMsg('Lista generada ✔️');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = ['Ingrediente','Unidad','Necesario','Stock','Comprar'];
    const rows = items.map(r => [
      (r.ingredient_name||'').replaceAll(',',' '),
      r.unit || '',
      r.needed_qty ?? 0,
      r.current_stock ?? 0,
      r.to_buy ?? 0
    ]);
    const csv = [header, ...rows].map(a=>a.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shopping-${date}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Lista de compras</h2>

        <div style={{display:'flex', gap:8, alignItems:'center', margin:'8px 0 12px'}}>
          <label>Fecha</label>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button className="btn" onClick={()=>load(date)} disabled={loading}>Cargar</button>
          <button className="btn" onClick={generate} disabled={loading}>Generar</button>
          <button className="btn" onClick={exportCSV} disabled={!items.length}>Exportar CSV</button>
          <span style={{marginLeft:'auto', color:'var(--muted)'}}>
            {loading ? 'Cargando…' : msg}
          </span>
        </div>

        {!items.length ? (
          <div className="card">No hay datos para {date}. Pulsa <b>Generar</b>.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Unidad</th>
                <th>Necesario</th>
                <th>Stock</th>
                <th>Comprar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r,i)=>(
                <tr key={i}>
                  <td>{r.ingredient_name}</td>
                  <td>{r.unit}</td>
                  <td>{Number(r.needed_qty||0).toFixed(2)}</td>
                  <td>{Number(r.current_stock||0).toFixed(2)}</td>
                  <td><b>{Number(r.to_buy||0).toFixed(2)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {items.length>0 && (
          <div style={{marginTop:8}}>
            Totales — Necesario: <b>{totals.need.toFixed(2)}</b>, Comprar: <b>{totals.buy.toFixed(2)}</b>
          </div>
        )}
      </div>
    </main>
  );
}
