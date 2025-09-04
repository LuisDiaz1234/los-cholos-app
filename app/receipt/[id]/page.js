'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function ReceiptPage({ params }) {
  const { id } = params;
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: saleRow } = await supabase
        .from('sales')
        .select('id, sale_date, total, payment_method')
        .eq('id', id)
        .maybeSingle();

      const { data: itemRows } = await supabase
        .from('sale_items')
        .select('product_name, qty, unit_price, subtotal')
        .eq('sale_id', id)
        .order('product_name');

      setSale(saleRow || null);
      setItems(itemRows || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="card">Cargando recibo…</main>;
  if (!sale) return <main className="card">No existe la venta.</main>;

  return (
    <main className="card" style={{ maxWidth: 680, margin: '24px auto' }}>
      <h2>Recibo #{sale.id.slice(0,8)}</h2>
      <div>Fecha: {sale.sale_date}</div>
      <div>Método: {sale.payment_method}</div>

      <table className="table" style={{ marginTop: 12 }}>
        <thead><tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th></tr></thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.product_name}</td>
              <td>{Number(it.qty).toFixed(0)}</td>
              <td>B/. {Number(it.unit_price).toFixed(2)}</td>
              <td>B/. {Number(it.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <strong>Total: B/. {Number(sale.total).toFixed(2)}</strong>
      </div>
    </main>
  );
}
