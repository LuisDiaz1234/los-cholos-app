'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'yappy', label: 'Yappy' }
  // Si mañana quieres agregar tarjeta o nequi, añádelo aquí.
];

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {product_id, name, unit_price, quantity}
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState('cash');
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('is_active', true)
      .order('name');
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addToCart = (p) => {
    if (p.stock <= 0) return; // no permitir agregar sin stock
    setCart(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id);
      if (idx >= 0) {
        const maxQty = Math.max(0, p.stock); // evita superar stock
        const copy = [...prev];
        const nextQty = Math.min(copy[idx].quantity + 1, maxQty);
        copy[idx] = { ...copy[idx], quantity: nextQty };
        return copy;
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: p.price, quantity: 1 }];
    });
  };

  const changeQty = (product_id, delta) => {
    setCart(prev => {
      const prod = products.find(p => p.id === product_id);
      const maxQty = prod ? Math.max(0, prod.stock) : Infinity;
      const copy = prev.map(i => {
        if (i.product_id !== product_id) return i;
        const next = Math.max(0, Math.min(i.quantity + delta, maxQty));
        return { ...i, quantity: next };
      }).filter(i => i.quantity > 0);
      return copy;
    });
  };

  const total = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const checkout = async () => {
    if (cart.length === 0) return setMessage('Agrega productos antes de cobrar.');
    if (cart.some(it => it.quantity <= 0)) return setMessage('Cantidades inválidas.');
    setMessage('Procesando venta…');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
          payment_method: payMethod
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en venta');
      setCart([]);
      setMessage(`Venta OK. ID: ${json.sale_id}`);
      await load(); // refresca stock
    } catch (e) {
      console.error(e);
      setMessage(`Error: ${e.message}`);
    }
  };

  if (loading) return <div className="card">Cargando productos…</div>;

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Ventas (POS)</h2>
        <div className="grid cols-4">
          {products.map(p => (
            <div key={p.id} className="card">
              <div style={{fontWeight:600}}>{p.name}</div>
              <div className="badge">Stock: {Number(p.stock).toFixed(0)}</div>
              <div style={{margin:'8px 0'}}>B/. {Number(p.price).toFixed(2)}</div>
              <button
                className="btn"
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                title={p.stock <= 0 ? 'Sin stock' : 'Agregar'}
              >
                {p.stock <= 0 ? 'Sin stock' : 'Agregar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Carrito</h2>
        {cart.length === 0 ? <div>Vacío</div> : (
          <table className="table">
            <thead><tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th><th></th></tr></thead>
            <tbody>
              {cart.map(i => (
                <tr key={i.product_id}>
                  <td>{i.name}</td>
                  <td>{i.quantity}</td>
                  <td>B/. {i.unit_price.toFixed(2)}</td>
                  <td>B/. {(i.quantity*i.unit_price).toFixed(2)}</td>
                  <td>
                    <button className="btn" onClick={() => changeQty(i.product_id, +1)}>+1</button>{' '}
                    <button className="btn" onClick={() => changeQty(i.product_id, -1)}>-1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
          <div>Total: <strong>B/. {total.toFixed(2)}</strong></div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} className="input" style={{width:180}}>
              {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn" onClick={checkout} disabled={cart.length===0}>Cobrar</button>
          </div>
        </div>
        {message && <div style={{marginTop:10}}>{message}</div>}
      </div>
    </main>
  );
}
