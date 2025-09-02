'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Recipes() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productId, setProductId] = useState('');
  const [rows, setRows] = useState([]);
  const [ingId, setIngId] = useState(''); const [qty, setQty] = useState('');
  const [msg, setMsg] = useState('');

  const loadRefs = async () => {
    const { data: p } = await supabase.from('products').select('id,name').eq('is_active', true).order('name');
    const { data: i } = await supabase.from('ingredients').select('id,name,unit').eq('is_active', true).order('name');
    setProducts(p||[]); setIngredients(i||[]);
  };
  useEffect(()=>{ loadRefs(); },[]);

  const loadRecipe = async (pid) => {
    if (!pid) return setRows([]);
    const { data } = await supabase.from('recipe_components').select('id,ingredient_id,qty,unit').eq('product_id', pid);
    const by = Object.fromEntries((ingredients||[]).map(x=>[x.id,x]));
    setRows((data||[]).map(r=>({...r, ingredient: by[r.ingredient_id]})));
  };
  useEffect(()=>{ loadRecipe(productId); }, [productId, ingredients]);

  const add = async () => {
    if (!productId || !ingId || !qty) return setMsg('Completa los campos');
    const ing = ingredients.find(i=>i.id===ingId);
    const { error } = await supabase.from('recipe_components').insert({ product_id:productId, ingredient_id:ingId, qty:Number(qty), unit:ing?.unit||'unidad' });
    if (error) setMsg(error.message); else { setMsg('Agregado'); setQty(''); loadRecipe(productId); }
  };

  const del = async (id) => {
    const { error } = await supabase.from('recipe_components').delete().eq('id', id);
    if (error) setMsg(error.message); else { setMsg('Eliminado'); loadRecipe(productId); }
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Recetas</h2>
        <div className="grid cols-3">
          <select className="input" value={productId} onChange={e=>setProductId(e.target.value)}>
            <option value="">Producto…</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input" value={ingId} onChange={e=>setIngId(e.target.value)}>
            <option value="">Ingrediente…</option>
            {ingredients.map(i=><option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
          </select>
          <div style={{display:'flex',gap:8}}>
            <input className="input" placeholder="Cantidad" type="number" value={qty} onChange={e=>setQty(e.target.value)}/>
            <button className="btn" onClick={add}>Agregar</button>
          </div>
        </div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <h3>Componentes</h3>
        {!productId ? <div>Selecciona un producto</div> : (
          <table className="table" style={{marginTop:8}}>
            <thead><tr><th>Ingrediente</th><th>Cantidad</th><th>Unidad</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{r.ingredient?.name || r.ingredient_id}</td>
                  <td>{Number(r.qty).toFixed(3)}</td>
                  <td>{r.ingredient?.unit || r.unit}</td>
                  <td><button className="btn" onClick={()=>del(r.id)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
