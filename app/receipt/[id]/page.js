'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ReceiptPage({ params }) {
  const { id } = params;
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: s } = await supabase
        .from('sales')
        .select('id, sale_date, total, payment_method')
        .eq('id', id)
        .maybeSingle();

      const { data: it } = await supabase
        .from('sale_items')
        .select('product_id, product_name, qty, unit_price, subtotal') // <--- usa qty
        .eq('sale_id', id)
        .order('product_name');

      setSale(s || null);
      setItems(it || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="card">Cargando...</div>;
  if (!sale) return <div className="card">No se encontró la venta.</div>;

  return (
    <main className="receipt">
      <h2>Recibo #{sale.id}</h2>
      <div>Fecha: {sale.sale_date}</div>
      <div>Método: {sale.payment_method}</div>

      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th></tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={i}>
              <td>{r.product_name}</td>
              <td>{r.qty}</td>
              <td>B/. {Number(r.unit_price).toFixed(2)}</td>
              <td>B/. {Number(r.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ textAlign: 'right' }}>Total: B/. {Number(sale.total).toFixed(2)}</h3>
    </main>
  );
}
