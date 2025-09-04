'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ReceiptPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('sales').select('*').eq('id', id).maybeSingle();
      setSale(s || null);
      const { data: it } = await supabase.from('sale_items')
        .select('product_name, price, qty, subtotal')
        .eq('sale_id', id)
        .order('id', { ascending: true });
      setItems(it || []);
      document.body.classList.add('ticket');
      return () => document.body.classList.remove('ticket');
    })();
  }, [id]);

  if (!sale) return <div className="card">Cargando…</div>;

  return (
    <div className="card">
      <h3 style={{textAlign:'center', margin:'4px 0'}}>Los Cholos</h3>
      <div className="text-muted" style={{textAlign:'center'}}>RUC / Tel: —</div>
      <hr/>
      <div>Recibo: <b>{sale.id}</b></div>
      <div>Fecha: {new Date(sale.created_at).toLocaleString()}</div>
      <hr/>
      <table className="table">
        <thead><tr><th>Prod</th><th>Cant</th><th className="align-right">Sub</th></tr></thead>
        <tbody>
          {items.map((it,i)=>(
            <tr key={i}>
              <td>{it.product_name}</td>
              <td>{it.qty}</td>
              <td className="align-right">B/. {Number(it.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr/>
      <div className="align-right"><b>Total: B/. {Number(sale.total).toFixed(2)}</b></div>
      <div className="text-muted">Pago: {sale.payment_method}</div>
      <hr/>
      <div style={{textAlign:'center'}}>¡Gracias por su compra!</div>
    </div>
  );
}
