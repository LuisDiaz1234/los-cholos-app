'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}

export default function ShoppingList() {
  const [target, setTarget] = useState(datePlus(1));
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    // Consulta simple de la lista por fecha
    const { data, error } = await supabase
      .from('shopping_list')
      .select('id, product_id, suggested_qty, reason, created_at, target_date')
      .eq('target_date', target)
      .order('created_at', { ascending: false });

    if (error) console.error(error);

    // Traemos también info de productos para mostrar nombre/unidad:
    if (data && data.length > 0) {
      const ids = data.map(r => r.product_id);
      const { data: prods } = await supabase.from('products').select('id, name, unit').in('id', ids);
      const byId = Object.fromEntries((prods || []).map(p => [p.id, p]));
      setRows(data.map(r => ({ ...r, product: byId[r.product_id] })));
    } else {
      setRows([]);
    }
  };

  useEffect(() => { load(); }, [target]);

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
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Lista de compras</h2>
        <div className="grid cols-3">
          <input className="input" type="date" value={target} onChange={e=>setTarget(e.target.value)} />
          <button className="btn" onClick={generateNow}>Generar ahora</button>
          <button className="btn" onClick={()=>{
            const lines = rows.map(r => `${r.product?.name || ''}\t${Number(r.suggested_qty).toFixed(0)}\t${r.product?.unit || ''}`).join('\n');
            navigator.clipboard.writeText(lines);
            setMsg('Copiado al portapapeles');
          }}>Copiar</button>
        </div>
        <table className="table" style={{marginTop:12}}>
          <thead><tr><th>Producto</th><th>Sugerido</th><th>Unidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.product?.name || '—'}</td>
                <td>{Number(r.suggested_qty).toFixed(0)}</td>
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
