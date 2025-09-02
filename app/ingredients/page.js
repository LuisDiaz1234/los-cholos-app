'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Ingredients() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidad');
  const [pkg, setPkg] = useState('');
  const [par, setPar] = useState('');
  const [sel, setSel] = useState(null);
  const [moveType, setMoveType] = useState('IN');
  const [qty, setQty] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('ingredients')
      .select('id, name, unit, package_size, stock, par_level, is_active')
      .order('name');
    if (error) console.error(error);
    setRows(data || []);
  };
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    if (!name) return;
    const { error } = await supabase.from('ingredients').insert({
      name, unit, package_size: pkg?Number(pkg):null, par_level: Number(par||0), stock: 0
    });
    if (error) setMsg(error.message); else { setMsg('Ingrediente creado'); setName(''); setPkg(''); setPar(''); load(); }
  };

  const move = async () => {
    if (!sel || !qty) return setMsg('Selecciona ingrediente y cantidad');
    const q = Number(qty);
    const { error: e1 } = await supabase.from('ingredient_movements').insert({
      ingredient_id: sel, type: moveType, quantity: q, reason: moveType==='IN'?'Compra':'Ajuste'
    });
    if (e1) return setMsg(e1.message);
    const { data: ing, error: e2 } = await supabase.from('ingredients').select('stock').eq('id', sel).single();
    if (e2) return setMsg(e2.message);
    const newStock = moveType==='IN' ? Number(ing.stock)+q : Number(ing.stock)-q;
    const { error: e3 } = await supabase.from('ingredients').update({ stock: newStock }).eq('id', sel);
    if (e3) return setMsg(e3.message);
    setMsg('Stock actualizado');
    setQty(''); load();
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Ingredientes</h2>
        <div className="grid cols-4">
          <input className="input" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
          <select className="input" value={unit} onChange={e=>setUnit(e.target.value)}>
            <option value="unidad">unidad</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="paquete">paquete</option>
            <option value="tarro">tarro</option>
          </select>
          <input className="input" placeholder="Tamaño paquete/tarro (opcional)" type="number" value={pkg} onChange={e=>setPkg(e.target.value)} />
          <input className="input" placeholder="Par level" type="number" value={par} onChange={e=>setPar(e.target.value)} />
        </div>
        <div style={{marginTop:8}}><button className="btn" onClick={add}>Guardar</button></div>
      </div>

      <div className="card">
        <h2>Movimientos de ingredientes</h2>
        <div className="grid cols-4">
          <select className="input" value={sel||''} onChange={e=>setSel(e.target.value)}>
            <option value="">Selecciona ingrediente</option>
            {rows.map(r => <option key={r.id} value={r.id}>{r.name} — Stock {Number(r.stock).toFixed(2)} {r.unit}</option>)}
          </select>
          <select className="input" value={moveType} onChange={e=>setMoveType(e.target.value)}>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
          </select>
          <input className="input" placeholder="Cantidad" type="number" value={qty} onChange={e=>setQty(e.target.value)} />
          <button className="btn" onClick={move}>Aplicar</button>
        </div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <h2>Listado</h2>
        <table className="table">
          <thead><tr><th>Ingrediente</th><th>Unidad</th><th>Tamaño paquete</th><th>Stock</th><th>Par</th><th>Activo</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.unit}</td>
                <td>{r.package_size || '—'}</td>
                <td>{Number(r.stock).toFixed(2)}</td>
                <td>{Number(r.par_level).toFixed(2)}</td>
                <td>{r.is_active ? 'Sí':'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
