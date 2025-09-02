'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Recipes() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productId, setProductId] = useState('');
  const [rows, setRows] = useState([]); // receta actual
  const [addIng, setAddIng] = useState('');
  const [addQty, setAddQty] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data: prods } = await supabase.from('products').select('id, name').eq('is_active', true).order('name');
    const { data: ings } = await supabase.from('ingredients').select('id, name, unit').eq('is_active', true).order('name');
    setProducts(prods || []);
    setIngredients(ings || []);
  };
  useEffect(()=>{ load(); },[]);

  const loadRecipe = async (pid) => {
    if (!pid) return setRows([]);
    const { data } = await supabase
      .from('recipe_components')
      .select('id, ingredient_id, qty, unit, ingredients(name, unit)')
      .eq('product_id', pid);
    // fallback a join manual
    if (data) {
      const { data: list } = await supabase.from('recipe_components')
        .select('id, ingredient_id, qty, unit')
        .eq('product_id', pid);
      const byId = Object.fromEntries((ingredients||[]).map(i=>[i.id,i]));
      setRows((list||[]).map(r=>({ ...r, ingredient: byId[r.ingredient_id]})));
    }
  };

  useEffect(()=>{ loadRecipe(productId); }, [productId, ingredients]);

  const add = async () => {
    if (!productId || !addIng || !addQty) return setMsg('Completa los campos');
    const ing = ingredients.find(i => i.id === addIng);
    const { error } = await supabase.from('recipe_components').insert({
      product_id: productId, ingredient_id: addIng, qty: Number(addQty), unit: ing?.unit || 'unidad'
    });
    if (error) setMsg(error.message); else { setMsg('Agregado'); setAddQty(''); loadRecipe(productId); }
  };

  const del = async (id) => {
    const { error } = await supabase.from('recipe_components').delete().eq('id', id);
    if (error) setMsg(error.message); else { setMsg('Eliminado'); loadRecipe(productId); }
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Recetas (insumos por producto)</h2>
        <div className="grid cols-3">
          <select className="input" value={productId} onChange={e=>setProductId(e.target.value)}>
            <option value="">Selecciona producto</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input" value={addIng} onChange={e=>setAddIng(e.target.value)}>
            <option value="">Ingrediente</option>
            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
          </select>
          <div style={{display:'flex', gap:8}}>
            <input className="input" placeholder="Cantidad por unidad vendida" type="number" value={addQty} onChange={e=>setAddQty(e.target.value)} />
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
              {rows.map(r => (
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
