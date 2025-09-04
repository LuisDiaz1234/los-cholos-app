// app/receipt/[id]/page.js
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
      // 1) venta
      const { data: s } = await supabase
        .from('sales')
        .select('id, sale_date, total, payment_method')
        .eq('id', id)
        .maybeSingle();

      // 2) items
      const { data: it } = await supabase
        .from('sale_items')
        .select('product_id, product_name, qty, unit_price, subtotal')
        .eq('sale_id', id)
        .order('product_name');

      setSale(s || null);
      setItems(it || []);
      setLoading(false);

      // (opcional) auto imprimir al cargar
      // setTimeout(()=>window.print(), 300);
    }
    load();
  }, [id]);

  if (loading) return <div className="card">Cargando…</div>;
  if (!sale) return <div className="card">No existe la venta.</div>;

  return (
    <main className="receipt">
      <h2>Los Cholos — Recibo</h2>
      <div>ID: {sale.id}</div>
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
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
            <td style={{ fontWeight: 700 }}>B/. {Number(sale.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => window.print()}>Imprimir</button>
      </div>
    </main>
  );
}
