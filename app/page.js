'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PAYMENT_OPTIONS = [
  { value: 'cash',  label: 'Efectivo' },
  { value: 'yappy', label: 'Yappy' }
];

export default function POS() {
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('Todas');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock, category, is_active')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) console.error(error);
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const cats = useMemo(()=>{
    const set = new Set(products.map(p => p.category || 'General'));
    return ['Todas', ...Array.from(set)];
  }, [products]);

  const productsFiltered = useMemo(()=>{
    let list = products;
    if (activeCat !== 'Todas') list = list.filter(p => (p.category||'General') === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  const qtyInCart = (pid) => cart.find(i => i.product_id === pid)?.quantity || 0;

  const addToCart = (p) => {
    const already = qtyInCart(p.id);
    if (p.stock - already <= 0) return;
    setCart(prev => {
      const i = prev.findIndex(x => x.product_id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: Number(p.price), quantity: 1 }];
    });
  };

  const changeQty = (pid, delta) => {
    const p = products.find(x => x.id === pid);
    setCart(prev => {
      const next = prev.map(r => {
        if (r.product_id !== pid) return r;
        const want = r.quantity + delta;
        const max = p ? Math.max(0, Math.floor(p.stock)) : 999;
        const q = Math.max(0, Math.min(want, max));
        return { ...r, quantity: q };
      }).filter(r => r.quantity > 0);
      return next;
    });
  };

  const total = cart.reduce((s,r)=>s + r.quantity * r.unit_price, 0);

  const checkout = async () => {
    if (cart.length === 0) return setMsg('Agrega productos antes de cobrar.');
    if (cart.some(i => i.quantity <= 0)) return setMsg('Cantidades inválidas.');
    setMsg('Procesando...');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price
          })),
          payment_method: payMethod
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en venta');
      setCart([]);
      setMsg(`Venta OK. ID: ${json.sale_id}`);
      await load();
    } catch (e) {
      console.error(e); setMsg(e.message);
    }
  };

  if (loading) return <div className="card">Cargando…</div>;

  return (
    <main className="grid" style={{ gap:16 }}>
      <div className="card">
        <h2>Ventas (POS)</h2>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'8px 0'}}>
          {cats.map(c => (
            <button key={c}
              onClick={()=>setActiveCat(c)}
              className="btn"
              style={{ background: activeCat===c ? 'var(--brand-600)' : 'var(--brand)' }}>
              {c}
            </button>
          ))}
          <input className="input" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
                 style={{ maxWidth:280, marginLeft:'auto' }}/>
        </div>

        <div className="grid cols-4">
          {productsFiltered.map(p => {
            const left = Math.max(0, Math.floor(p.stock) - qtyInCart(p.id));
            const disabled = left <= 0;
            return (
              <div key={p.id} className="card">
                <div style={{fontWeight:700}}>{p.name}</div>
                <div className="badge">Stock: {Math.floor(p.stock)}</div>
                <div style={{margin:'8px 0'}}>B/. {Number(p.price).toFixed(2)}</div>
                <button className="btn" disabled={disabled} onClick={()=>addToCart(p)}>
                  {disabled ? 'Sin stock' : 'Agregar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Carrito</h2>
        {cart.length===0 ? <div>Vacío</div> : (
          <table className="table">
            <thead><tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th><th></th></tr></thead>
            <tbody>
              {cart.map(r=>(
                <tr key={r.product_id}>
                  <td>{r.name}</td>
                  <td>{r.quantity}</td>
                  <td>B/. {r.unit_price.toFixed(2)}</td>
                  <td>B/. {(r.unit_price*r.quantity).toFixed(2)}</td>
                  <td>
                    <button className="btn" onClick={()=>changeQty(r.product_id,+1)}>+1</button>{' '}
                    <button className="btn" onClick={()=>changeQty(r.product_id,-1)}>-1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
          <div>Total: <strong>B/. {total.toFixed(2)}</strong></div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select className="input" style={{ width:180 }} value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
              {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn" onClick={checkout} disabled={cart.length===0}>Cobrar</button>
          </div>
        </div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </main>
  );
}
