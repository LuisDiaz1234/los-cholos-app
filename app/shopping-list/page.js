'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const datePlus = (days) => {
  const d = new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
};

export default function ShoppingList() {
  const [target, setTarget] = useState(datePlus(1));
  const [prods, setProds] = useState([]);
  const [ings, setIngs] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    // Productos
    const { data: sp } = await supabase
      .from('shopping_list')
      .select('id, product_id, suggested_qty, reason, created_at, target_date')
      .eq('target_date', target)
      .order('created_at', { ascending: false });
    if (sp) {
      const ids = sp.map(r => r.product_id);
      const { data: p } = await supabase.from('products').select('id, name, unit').in('id', ids);
      const byId = Object.fromEntries((p||[]).map(x=>[x.id,x]));
      setProds(sp.map(r => ({ ...r, product: byId[r.product_id] })));
    } else setProds([]);

    // Ingredientes
    const { data: si } = await supabase
      .from('shopping_list_ingredients')
      .select('id, ingredient_id, suggested_qty, reason, created_at, target_date')
      .eq('target_date', target)
      .order('created_at', { ascending: false });
    if (si) {
      const ids2 = si.map(r => r.ingredient_id);
      const { data: ii } = await supabase.from('ingredients').select('id, name, unit').in('id', ids2);
      const byId2 = Object.fromEntries((ii||[]).map(x=>[x.id,x]));
      setIngs(si.map(r => ({ ...r, ingredient: byId2[r.ingredient_id] })));
    } else setIngs([]);
  };

  useEffect(()=>{ load(); }, [target]);

  const generateNow = async () => {
    setMsg('Generando...');
    try {
      const res = await fetch('/api/generate-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ target_date: target })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setMsg('Lista generada');
      load();
    } catch (e) { setMsg(e.message); }
  };

  const copyText = (rows, isIng=false) => {
    const lines = rows.map(r => `${isIng ? (r.ingredient?.name||'') : (r.product?.name||'')}\t${Number(r.suggested_qty).toFixed(2)}\t${isIng ? (r.ingredient?.unit||'') : (r.product?.unit||'')}`).join('\n');
    navigator.clipboard.writeText(lines);
    setMsg('Copiado al portapapeles');
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Lista de compras (para {target})</h2>
        <div className="grid cols-3">
          <input className="input" type="date" value={target} onChange={e=>setTarget(e.target.value)} />
          <button className="btn" onClick={generateNow}>Generar ahora</button>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>copyText(prods,false)}>Copiar productos</button>
            <button className="btn" onClick={()=>copyText(ings,true)}>Copiar ingredientes</button>
          </div>
        </div>

        <h3 style={{marginTop:12}}>Ingredientes</h3>
        <table className="table" style={{marginTop:6}}>
          <thead><tr><th>Ingrediente</th><th>Sugerido</th><th>Unidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {ings.map(r=>(
              <tr key={r.id}>
                <td>{r.ingredient?.name || '—'}</td>
                <td>{Number(r.suggested_qty).toFixed(2)}</td>
                <td>{r.ingredient?.unit || ''}</td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{marginTop:20}}>Productos</h3>
        <table className="table" style={{marginTop:6}}>
          <thead><tr><th>Producto</th><th>Sugerido</th><th>Unidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {prods.map(r=>(
              <tr key={r.id}>
                <td>{r.product?.name || '—'}</td>
                <td>{Number(r.suggested_qty).toFixed(2)}</td>
                <td>{r.product?.unit || ''}</td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {msg && <div style={{marginTop:10}}>{msg}</div>}
      </div>
    </main>
  );
}
