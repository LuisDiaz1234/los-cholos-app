'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState(''); const [unit, setUnit] = useState('unidad');
  const [price, setPrice] = useState(''); const [cost, setCost] = useState('');
  const [par, setPar] = useState(''); const [cat, setCat] = useState('General');
  const [prodId, setProdId] = useState(''); const [moveType, setMoveType] = useState('IN');
  const [qty, setQty] = useState(''); const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(true); const [msg, setMsg] = useState('');

  const load = async () => {
    let q = supabase.from('products').select('id,name,unit,price,cost,stock,par_level,category,is_active').order('category').order('name');
    if (onlyActive) q = q.eq('is_active', true);
    const { data } = await q; setRows(data||[]);
  };
  useEffect(()=>{ load(); }, [onlyActive]);

  const save = async () => {
    if (!name || !price) return setMsg('Nombre y precio son requeridos');
    const { error } = await supabase.from('products').insert({
      name, unit, price:Number(price), cost:Number(cost||0), par_level:Number(par||0), category:cat, is_active:true
    });
    if (error) setMsg(error.message); else { setName(''); setUnit('unidad'); setPrice(''); setCost(''); setPar(''); setCat('General'); setMsg('Producto creado'); load(); }
  };

  const move = async () => {
    if (!prodId || !qty) return setMsg('Selecciona producto y cantidad');
    const qn = Number(qty);
    const { data: prod } = await supabase.from('products').select('stock').eq('id', prodId).single();
    const newStock = moveType==='IN' ? Number(prod.stock)+qn : Number(prod.stock)-qn;
    const { error: e1 } = await supabase.from('inventory_movements').insert({ product_id:prodId, type:moveType, quantity:qn, reason: moveType==='IN'?'Entrada':'Ajuste' });
    if (e1) return setMsg(e1.message);
    const { error: e2 } = await supabase.from('products').update({ stock:newStock }).eq('id', prodId);
    if (e2) setMsg(e2.message); else { setMsg('Stock actualizado'); setQty(''); load(); }
  };

  const softDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    const { error } = await supabase.from('products').update({ is_active:false }).eq('id', id);
    if (error) setMsg(error.message); else { setMsg('Producto desactivado'); load(); }
  };

  const filtered = rows.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Inventario — Crear producto</h2>
        <div className="grid cols-4">
          <input className="input" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}/>
          <select className="input" value={unit} onChange={e=>setUnit(e.target.value)}>
            <option value="unidad">unidad</option><option value="porción">porción</option><option value="g">g</option><option value="ml">ml</option><option value="combo">combo</option>
          </select>
          <input className="input" placeholder="Precio" type="number" value={price} onChange={e=>setPrice(e.target.value)}/>
          <input className="input" placeholder="Costo (opcional)" type="number" value={cost} onChange={e=>setCost(e.target.value)}/>
          <input className="input" placeholder="Par level" type="number" value={par} onChange={e=>setPar(e.target.value)}/>
          <input className="input" placeholder="Categoría" value={cat} onChange={e=>setCat(e.target.value)}/>
          <button className="btn" onClick={save}>Guardar</button>
        </div>
      </div>

      <div className="card">
        <h2>Movimientos de stock</h2>
        <div className="grid cols-4">
          <select className="input" value={prodId} onChange={e=>setProdId(e.target.value)}>
            <option value="">Producto…</option>
            {rows.map(r=><option key={r.id} value={r.id}>{r.name} — Stock {Math.floor(r.stock)}</option>)}
          </select>
          <select className="input" value={moveType} onChange={e=>setMoveType(e.target.value)}>
            <option value="IN">Entrada</option><option value="OUT">Salida</option>
          </select>
          <input className="input" type="number" placeholder="Cantidad" value={qty} onChange={e=>setQty(e.target.value)}/>
          <button className="btn" onClick={move}>Aplicar</button>
        </div>
      </div>

      <div className="card">
        <h2>Productos</h2>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}>
          <input className="input" placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:300}}/>
          <label style={{display:'flex',gap:6,alignItems:'center'}}><input type="checkbox" checked={onlyActive} onChange={e=>setOnlyActive(e.target.checked)}/>Mostrar sólo activos</label>
        </div>
        <table className="table">
          <thead><tr><th>Categoría</th><th>Producto</th><th>Unidad</th><th>Precio</th><th>Stock</th><th>Par</th><th>Activo</th><th></th></tr></thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id}>
                <td>{r.category}</td><td>{r.name}</td><td>{r.unit}</td>
                <td>B/. {Number(r.price).toFixed(2)}</td><td>{Math.floor(r.stock)}</td>
                <td>{Number(r.par_level||0).toFixed(0)}</td><td>{r.is_active?'Sí':'No'}</td>
                <td><button className="btn" onClick={()=>softDelete(r.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </main>
  );
}
