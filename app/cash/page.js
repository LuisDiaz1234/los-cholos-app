'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Cash() {
  const [date, setDate] = useState(today());
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [notes, setNotes] = useState('');
  const [salesTotal, setSalesTotal] = useState(0);
  const [msg, setMsg] = useState('');

  const diff = useMemo(() => Number(closing || 0) - (Number(opening || 0) + Number(salesTotal || 0)), [opening, closing, salesTotal]);

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('total')
      .eq('sale_date', date);
    if (!error && data) {
      const sum = data.reduce((s, r) => s + Number(r.total || 0), 0);
      setSalesTotal(sum);
    }
  };

  useEffect(() => { loadSales(); }, [date]);

  const saveClosure = async () => {
    const { error } = await supabase.from('cash_closures').upsert({
      closure_date: date,
      opening_cash: Number(opening || 0),
      closing_cash: Number(closing || 0),
      expected_cash: Number(opening || 0) + Number(salesTotal || 0),
      notes
    }, { onConflict: 'closure_date' });
    if (error) setMsg(error.message); else setMsg('Cierre guardado');
  };

  return (
    <main className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Cierre de caja</h2>
        <div className="grid cols-4">
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <input className="input" placeholder="Apertura" type="number" value={opening} onChange={e=>setOpening(e.target.value)} />
          <input className="input" placeholder="Cierre" type="number" value={closing} onChange={e=>setClosing(e.target.value)} />
          <input className="input" placeholder="Notas" value={notes} onChange={e=>setNotes(e.target.value)} />
        </div>
        <div style={{marginTop:10}}>
          Ventas del día: <strong>B/. {salesTotal.toFixed(2)}</strong><br/>
          Esperado en caja: <strong>B/. {(Number(opening||0)+salesTotal).toFixed(2)}</strong><br/>
          Diferencia (real - esperado): <strong style={{color: diff===0 ? '#10b981':'#f87171'}}>B/. {diff.toFixed(2)}</strong>
        </div>
        <div style={{marginTop:10}}><button className="btn" onClick={saveClosure}>Guardar cierre</button></div>
        {msg && <div style={{marginTop:10}}>{msg}</div>}
      </div>
    </main>
  );
}
