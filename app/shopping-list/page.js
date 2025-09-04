'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function ymd(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
}

export default function ShoppingListPage() {
  const [date, setDate] = useState(ymd());
  const [ing, setIng] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setMsg('');

    // Ingredientes sugeridos
    const { data: a, error: e1 } = await supabase
      .from('shopping_list_ingredients')
      .select('ingredient_id, ingredient_name, suggested_qty, unit, reason, target_date')
      .eq('target_date', date)
      .order('ingredient_name', { ascending: true });

    // Productos sugeridos (si usas otra tabla cámbiala aquí)
    const { data: b, error: e2 } = await supabase
      .from('shopping_list')
      .select('product_id, product_name, suggested_qty, unit, reason, target_date')
      .eq('target_date', date)
      .order('product_name', { ascending: true });

    if (e1) setMsg(e1.message);
    if (e2) setMsg((m) => (m ? m + ' | ' + e2.message : e2.message));

    setIng(a || []);
    setProds(b || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [date]);

  async function generateNow() {
    try {
      setLoading(true);
      setMsg('Generando...');
      const res = await fetch('/api/generate-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_date: date })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar');
      await load();
      setMsg('Lista actualizada.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2>Lista de compras</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 180 }}
          />
          <button className="btn" onClick={generateNow} disabled={loading}>
            Generar ahora
          </button>
        </div>

        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}

        <h3 style={{ marginTop: 16 }}>Ingredientes</h3>
        <table className="table">
          <thead>
            <tr><th>Ingrediente</th><th>Sugerido</th><th>Unidad</th><th>Motivo</th></tr>
          </thead>
          <tbody>
            {ing.map((r, i) => (
              <tr key={i}>
                <td>{r.ingredient_name}</td>
                <td>{Number(r.suggested_qty).toLocaleString()}</td>
                <td>{r.unit || ''}</td>
                <td>{r.reason || ''}</td>
              </tr>
            ))}
            {ing.length === 0 && (
              <tr><td colSpan={4}>Sin sugerencias para {date}</td></tr>
            )}
          </tbody>
        </table>

        <h3 style={{ marginTop: 16 }}>Productos</h3>
        <table className="table">
          <thead>
            <tr><th>Producto</th><th>Sugerido</th><th>Unidad</th><th>Motivo</th></tr>
          </thead>
          <tbody>
            {prods.map((r, i) => (
              <tr key={i}>
                <td>{r.product_name}</td>
                <td>{Number(r.suggested_qty).toLocaleString()}</td>
                <td>{r.unit || ''}</td>
                <td>{r.reason || ''}</td>
              </tr>
            ))}
            {prods.length === 0 && (
              <tr><td colSpan={4}>Sin sugerencias para {date}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
