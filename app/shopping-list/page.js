// app/shopping-list/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function ymd(d) { return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

export default function ShoppingListPage() {
  const today = ymd(new Date());
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState('consumption'); // 'consumption' | 'par'
  const [msg, setMsg] = useState('');

  async function generate() {
    setMsg('');
    setRows([]);
    if (mode === 'par') return generatePar();

    // 1) ventas del día
    const { data: sales } = await supabase.from('sales').select('id').eq('sale_date', date);
    const ids = (sales||[]).map(s=>s.id);
    if (ids.length === 0) {
      setMsg(`No hay ventas para ${date}. Mostrando sugerencia de reponer a par.`);
      setMode('par');
      return generatePar();
    }

    // 2) items vendidos
    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, quantity');
    const sold = (items||[]).filter(i=>ids.includes(i.sale_id || i.saleId || i.SALE_ID || i.sale_id)); // tolerante a nombres
    // si tu columna es `qty` usa i.qty
    const qtyByProduct = new Map();
    for (const it of sold) {
      const q = Number(it.quantity ?? it.qty ?? 0);
      qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id)||0) + q);
    }

    // 3) receta por producto
    const { data: rc } = await supabase
      .from('recipe_components')
      .select('product_id, ingredient_id, qty');

    // 4) ingredientes con stock/par
    const { data: ing } = await supabase
      .from('ingredients')
      .select('id,name,unit,stock,par_level');

    const need = new Map(); // ingredient_id -> qty requerida
    for (const r of (rc||[])) {
      const soldQty = qtyByProduct.get(r.product_id) || 0;
      if (soldQty>0) {
        need.set(r.ingredient_id, (need.get(r.ingredient_id)||0) + soldQty * Number(r.qty||0));
      }
    }

    const out=[];
    for (const i of (ing||[])) {
      const req = need.get(i.id)||0;
      const falta = Math.max(0, req - Number(i.stock||0));
      if (falta>0) out.push({ name:i.name, unit:i.unit || '', qty: +falta.toFixed(2) });
    }
    setRows(out);
  }

  async function generatePar() {
    const { data: ing } = await supabase
      .from('ingredients')
      .select('name,unit,stock,par_level');
    const out=[];
    for (const i of (ing||[])) {
      const par = Number(i.par_level||0);
      const falta = Math.max(0, par - Number(i.stock||0));
      if (falta>0) out.push({ name:i.name, unit:i.unit || '', qty: +falta.toFixed(2) });
    }
    setRows(out);
  }

  useEffect(()=>{ generate(); }, []); // primera carga

  return (
    <main className="card">
      <h2>Lista de compras</h2>

      <div className="grid cols-4" style={{marginBottom:12, alignItems:'end'}}>
        <div>
          <div>Fecha</div>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <div>Modo</div>
          <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="consumption">Generar por consumo del día</option>
            <option value="par">Reponer a par</option>
          </select>
        </div>
        <div>
          <div>&nbsp;</div>
          <button className="btn" onClick={generate}>Generar</button>
        </div>
        <div>
          <div>&nbsp;</div>
          <a
            className="btn-outline"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              'Ingrediente,Unidad,Cantidad\n' + rows.map(r=>`${r.name},${r.unit},${r.qty}`).join('\n')
            )}`}
            download={`shopping_${date}.csv`}
          >Exportar CSV</a>
        </div>
      </div>

      {msg && <div className="card" style={{marginBottom:12}}>{msg}</div>}

      <div className="card">
        {rows.length===0 ? (
          <div>No hay ítems que comprar.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Ingrediente</th><th>Unidad</th><th>Cantidad sugerida</th></tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}><td>{r.name}</td><td>{r.unit}</td><td>{r.qty}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
