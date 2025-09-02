'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const todayISO = () => new Date().toISOString().slice(0,10);

export default function Cash() {
  const [date, setDate] = useState(todayISO());
  const [opening, setOpening] = useState(''); const [closing, setClosing] = useState(''); const [notes, setNotes] = useState('');
  const [salesTotal, setSalesTotal] = useState(0); const [byMethod, setByMethod] = useState({}); const [msg, setMsg] = useState('');

  const diff = useMemo(()=>Number(closing||0)-(Number(opening||0)+Number(salesTotal||0)),[opening,closing,salesTotal]);

  const loadSales = async () => {
    const iso = new Date(date).toISOString().slice(0,10);
    const { data } = await supabase.from('sales').select('total,payment_method').eq('sale_date', iso);
    const sum = (data||[]).reduce((s,r)=>s+Number(r.total||0),0);
    const by = (data||[]).reduce((acc,r)=>{const k=r.payment_method||'otros'; acc[k]=(acc[k]||0)+Number(r.total||0); return acc;}, {});
    setSalesTotal(sum); setByMethod(by);
  };
  useEffect(()=>{ loadSales(); },[date]);

  const saveClosure = async () => {
    const iso = new Date(date).toISOString().slice(0,10);
    const { error } = await supabase.from('cash_closures').upsert({
      closure_date: iso,
      opening_cash: Number(opening||0),
      closing_cash: Number(closing||0),
      expected_cash: Number(opening||0)+Number(salesTotal||0),
      notes
    }, { onConflict: 'closure_date' });
    setMsg(error?error.message:'Cierre guardado');
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Cierre de caja</h2>
        <div className="grid cols-4">
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          <input className="input" placeholder="Apertura" type="number" value={opening} onChange={e=>setOpening(e.target.value)}/>
          <input className="input" placeholder="Cierre" type="number" value={closing} onChange={e=>setClosing(e.target.value)}/>
          <input className="input" placeholder="Notas" value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>
        <div style={{marginTop:8}}>
          Ventas del día: <strong>B/. {salesTotal.toFixed(2)}</strong><br/>
          {Object.keys(byMethod).length>0 && <div style={{marginTop:6,opacity:.8}}>
            {Object.entries(byMethod).map(([k,v])=> (<div key={k}>• {k}: <strong>B/. {v.toFixed(2)}</strong></div>))}
          </div>}
          Esperado en caja: <strong>B/. {(Number(opening||0)+salesTotal).toFixed(2)}</strong><br/>
          Diferencia: <strong style={{color: diff===0?'#10b981':'#ef4444'}}>B/. {diff.toFixed(2)}</strong>
        </div>
        <div style={{marginTop:8}}><button className="btn" onClick={saveClosure}>Guardar cierre</button></div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </main>
  );
}
