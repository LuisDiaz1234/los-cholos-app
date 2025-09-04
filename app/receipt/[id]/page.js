'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const fmt = n => `B/. ${Number(n||0).toFixed(2)}`;

export default function ReceiptPage({ params }){
  const saleId = params.id;
  const [sale,setSale]=useState(null);
  const [items,setItems]=useState([]);

  useEffect(()=>{
    (async ()=>{
      const { data: s } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle();
      setSale(s||null);
      const { data: it } = await supabase.from('sale_items').select('product_id, qty, unit_price, products(name)').eq('sale_id', saleId);
      setItems(it||[]);
    })();
  }, [saleId]);

  const url = typeof window!=='undefined' ? window.location.href : '';
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`;

  const print58 = ()=>{ document.body.classList.add('ticket'); window.print(); document.body.classList.remove('ticket'); };
  const printA4 = ()=>{ window.print(); };

  return (
    <main className="card" style={{maxWidth:820}}>
      <h2>Recibo</h2>
      {!sale ? 'Cargando…' : (
        <>
          <div className="grid cols-2" style={{gap:8}}>
            <div>
              <div><strong>Los Cholos — Salchipapería</strong></div>
              <div>Fecha: {sale.sale_date}</div>
              <div>Método: {sale.payment_method}</div>
              <div>ID: {sale.id}</div>
            </div>
            <div style={{textAlign:'right'}}><img alt="QR" src={qr} /></div>
          </div>

          <table className="table" style={{marginTop:12}}>
            <thead><tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th></tr></thead>
            <tbody>
              {items.map((r,i)=>(
                <tr key={i}>
                  <td>{r.products?.name || r.product_id}</td>
                  <td>{r.qty}</td>
                  <td>{fmt(r.unit_price)}</td>
                  <td>{fmt(Number(r.qty)*Number(r.unit_price))}</td>
                </tr>
              ))}
              <tr><td colSpan={3} style={{textAlign:'right'}}><strong>Total</strong></td><td><strong>{fmt(sale.total)}</strong></td></tr>
            </tbody>
          </table>

          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
            <button className="btn" onClick={print58}>Imprimir 58mm</button>
            <button className="btn" onClick={printA4}>Imprimir A4</button>
          </div>
        </>
      )}
    </main>
  );
}
