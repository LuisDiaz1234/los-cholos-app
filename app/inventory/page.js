'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCost, setPCost] = useState('');
  const [pPar, setPPar] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('IN');
  const [selectedId, setSelectedId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('products')
      .select('id, name, price, cost, stock, par_level, is_active')
      .order('name');
    if (error) console.error(error);
    setProducts(data || []);
  };

  useEffect(() => { load(); }, []);

  const addProduct = async () => {
    if (!pName) return;
    const { error } = await supabase.from('products').insert({
      name: pName,
      price: Number(pPrice || 0),
      cost: Number(pCost || 0),
      par_level: Number(pPar || 0),
      stock: 0
    });
    if (error) setMsg(error.message); 
    else {
      setMsg('Producto creado');
      setPName(''); setPPrice(''); setPCost(''); setPPar('');
      load();
    }
  };

  const moveStock = async () => {
    try {
      if (!selectedId || !qty) return setMsg('Selecciona producto y cantidad');
      const q = Number(qty);
      if (isNaN(q) || q <= 0) return setMsg('Cantidad inválida');

      const { error: e1 } = await supabase.from('inventory_movements').insert({
        product_id: selectedId,
        type,
        quantity: q,
        reason: type === 'IN' ? 'Compra' : 'Ajuste'
      });
      if (e1) return setMsg(e1.message);

      const { data: prod, error: e2 } = await supabase
        .from('products')
        .select('stock')
        .eq('id', selectedId)
        .single();
      if (e2) return setMsg(e2.message);

      const newStock = type === 'IN' ? Number(prod.stock) + q : Number(prod.stock) - q;
      const { error: e3 } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedId);
      if (e3) return setMsg(e3.message);

      setMsg('Stock actualizado');
      setQty('');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Nuevo producto</h2>
        <div className="grid cols-4">
          <input className="input" placeholder="Nombre" value={pName} onChange={e=>setPName(e.target.value)} />
          <input className="input" placeholder="Precio venta" type="number" value={pPrice} onChange={e=>setPPrice(e.target.value)} />
          <input className="input" placeholder="Costo" type="number" value={pCost} onChange={e=>setPCost(e.target.value)} />
          <input className="input" placeholder="Par level (stock objetivo)" type="number" value={pPar} onChange={e=>setPPar(e.target.value)} />
        </div>
        <div style={{marginTop:8}}><button className="btn" onClick={addProduct}>Guardar</button></div>
      </div>

      <div className="card">
        <h2>Movimientos de stock</h2>
        <div className="grid cols-4">
          <select className="input" value={selectedId||''} onChange={e=>setSelectedId(e.target.value)}>
            <option value="">Selecciona producto</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} — Stock {Number(p.stock).toFixed(0)}</option>)}
          </select>
          <select className="input" value={type} onChange={e=>setType(e.target.value)}>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
          </select>
          <input className="input" placeholder="Cantidad" type="number" value={qty} onChange={e=>setQty(e.target.value)} />
          <button className="btn" onClick={moveStock}>Aplicar</button>
        </div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <h2>Productos</h2>
        <table className="table">
          <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Par</th><th>Activo</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>B/. {Number(p.price).toFixed(2)}</td>
                <td>{Number(p.stock).toFixed(0)}</td>
                <td>{Number(p.par_level).toFixed(0)}</td>
                <td>{p.is_active ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
