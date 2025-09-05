'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const toYmd = (d = new Date()) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
};

export default function ShoppingListPage() {
  const [date, setDate] = useState(toYmd());
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMsg('');
    const { data: ingData, error: errIng } = await supabase
      .from('shopping_list_ingredients')
      .select('ingredient_name, suggested_qty, unit, reason, target_date')
      .eq('target_date', date)
      .order('ingredient_name');
    const { data: prodData, error: errProd } = await supabase
      .from('shopping_list')
      .select('product_name, suggested_qty, unit, reason, target_date')
      .eq('target_date', date)
      .order('product_name');
    if (errIng) setMsg(errIng.message);
    if (errProd) setMsg(prev => prev ? prev + ' | ' + errProd.message : errProd.message);
    setIngredients(ingData || []);
    setProducts(prodData || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [date]);

  async function generate() {
    try {
      setLoading(true);
      setMsg('Generando…');
      const res = await fetch('/api/generate-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_date: date })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar');
      await load();
      setMsg('Lista generada.');
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
        <div style={{ display: 'flex', gap: 8, alignItems:'center', marginTop: 8 }}>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 180 }}
          />
          <button className="btn" onClick={generate} disabled={loading}>
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
            {ingredients.map((r, i) => (
              <tr key={i}>
                <td>{r.ingredient_name}</td>
                <td>{Number(r.suggested_qty).toLocaleString()}</td>
                <td>{r.unit || ''}</td>
                <td>{r.reason || ''}</td>
              </tr>
            ))}
            {ingredients.length === 0 && (
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
            {products.map((r, i) => (
              <tr key={i}>
                <td>{r.product_name}</td>
                <td>{Number(r.suggested_qty).toLocaleString()}</td>
                <td>{r.unit || ''}</td>
                <td>{r.reason || ''}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={4}>Sin sugerencias para {date}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
