'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRequireAuth } from '../lib/useRequireAuth';

// ===== Config =====
const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'yappy', label: 'Yappy' },
];
const DAILY_GOAL = Number(process.env.NEXT_PUBLIC_DAILY_GOAL || 220);
const BIG_SECTIONS = ['Comida', 'Bebidas', 'Panadería'];
const sectionIcons = { Comida: '🍽️', Bebidas: '🥤', Panadería: '🥟' };

// Palabras clave fallback
const K = {
  bebidas: [
    'batido','refresco','soda','coca','coca cola','cola','agua','jugo','malta','té',' te ','café',' cafe ',
    'capuchino','capuccino','limonada','vaso hielo','canadadry','canada dry','ginger ale','sprite','fanta','pepsi'
  ],
  panaderia: ['empanada','empanad','pastelito'],
  comida: ['salchi','hot dog','hotdog','perro','promocion','promoción','orden','media orden']
};

// ===== Helpers =====
function localDateYYYYMMDD(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
}
const todayStr = () => localDateYYYYMMDD();

function sectionOf(p) {
  const cat = (p?.category || '').trim().toLowerCase();
  const name = (p?.name || '').trim().toLowerCase();

  if (['comida','bebidas','panadería','panaderia'].includes(cat)) {
    return cat === 'panaderia' ? 'Panadería' : (cat[0]?.toUpperCase() + cat.slice(1));
  }
  const has = (arr) => arr.some(w => name.includes(w));
  if (has(K.bebidas)) return 'Bebidas';
  if (has(K.panaderia)) return 'Panadería';
  if (has(K.comida)) return 'Comida';

  if (/bebida|batido|refresco|soda|café|cafe|té|jugo|malta/i.test(p?.category || '')) return 'Bebidas';
  if (/empanada|panader/i.test(p?.category || '')) return 'Panadería';
  if (/salchi|hot ?dog|perro|comida|platos|especial|orden/i.test(p?.category || '')) return 'Comida';

  return 'Comida';
}

export default function POS() {
  // 1) Siempre Llamar al hook de auth arriba del todo:
  const auth = useRequireAuth();
  if (auth !== 'ok') {
    // mientras decide/redirige
    return null;
  }

  // 2) Estados
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState('');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [todaySales, setTodaySales] = useState(0);

  // 3) Carga de productos
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock, category, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('loadProducts error:', error);
        setProducts([]);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4) Carga ventas del día
  const loadToday = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('total')
        .eq('sale_date', todayStr());
      if (error) {
        console.error('loadToday error:', error);
        setTodaySales(0);
      } else {
        const sum = (data || []).reduce((s, r) => s + Number(r?.total || 0), 0);
        setTodaySales(sum);
      }
    } catch (e) {
      console.error(e);
      setTodaySales(0);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadToday();
  }, [loadProducts, loadToday]);

  // 5) Atajos teclado (sin mutaciones durante render)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkout();
      } else if (e.key === '+' || e.key === '=') {
        setCart((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return prev.map(r =>
            r.product_id === last.product_id ? { ...r, quantity: r.quantity + 1 } : r
          );
        });
      } else if (e.key === '-' || e.key === '_') {
        setCart((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const n = prev.map(r =>
            r.product_id === last.product_id ? { ...r, quantity: Math.max(0, r.quantity - 1) } : r
          ).filter(r => r.quantity > 0);
          return n;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 6) Secciones
  const sectionStats = useMemo(() => {
    const counts = { Comida: 0, Bebidas: 0, Panadería: 0 };
    (products || []).forEach(p => { counts[sectionOf(p)]++; });
    return BIG_SECTIONS
      .map((n) => ({ name: n, count: counts[n] || 0 }))
      .filter((s) => s.count > 0);
  }, [products]);

  const list = useMemo(() => {
    const base = (products || []).filter(
      (p) => sectionOf(p) === (activeSection || 'Comida')
    );
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((p) => (p?.name || '').toLowerCase().includes(q));
  }, [products, activeSection, search]);

  // 7) Carrito
  const qtyInCart = (pid) => (cart.find((i) => i.product_id === pid)?.quantity || 0);

  const add = (p) => {
    if (!p?.id) return;
    const already = qtyInCart(p.id);
    const left = Math.max(0, Math.floor(Number(p?.stock || 0)) - already);
    if (left <= 0) return;

    setCart((prev) => {
      const i = prev.findIndex((x) => x.product_id === p.id);
      if (i >= 0) {
        const n = [...prev];
        n[i] = { ...n[i], quantity: n[i].quantity + 1 };
        return n;
        }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name || '',
          unit_price: Number(p.price || 0),
          quantity: 1,
        },
      ];
    });
  };

  const changeQty = (pid, d) => {
    const p = (products || []).find((x) => x.id === pid);
    const max = p ? Math.max(0, Math.floor(Number(p.stock || 0))) : 999;

    setCart((prev) => {
      const n = prev
        .map((r) => {
          if (r.product_id !== pid) return r;
          const want = r.quantity + d;
          return { ...r, quantity: Math.max(0, Math.min(want, max)) };
        })
        .filter((r) => r.quantity > 0);
      return n;
    });
  };

  const total = useMemo(
    () => cart.reduce((s, r) => s + Number(r.unit_price || 0) * Number(r.quantity || 0), 0),
    [cart]
  );

  // 8) Checkout
  const checkout = async () => {
    if (cart.length === 0) {
      setMsg('Agrega productos antes de cobrar.');
      return;
    }
    setMsg('Procesando…');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,        // si tu RPC usa "qty", cámbialo aquí
            unit_price: i.unit_price,
          })),
          payment_method: payMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error en venta');

      setCart([]);
      setMsg(`Venta OK. ID: ${json.sale_id}`);
      await Promise.all([loadProducts(), loadToday()]);
      setActiveSection('');
      setSearch('');

      if (json?.sale_id) {
        window.open(`/receipt/${json.sale_id}`, '_blank');
      }
    } catch (e) {
      console.error('checkout error:', e);
      setMsg(e?.message || 'Error al cobrar');
    }
  };

  // 9) Meta
  const goalPct = Math.min(100, Math.round((Number(todaySales) / DAILY_GOAL) * 100));
  const remaining = Math.max(0, DAILY_GOAL - Number(todaySales));

  if (loading) return <main className="grid"><div className="card">Cargando…</div></main>;

  // 10) UI
  return (
    <main className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2>Ventas (POS)</h2>

        {/* META DIARIA */}
        <div className="goal">
          <div>Meta diaria: <strong>B/. {DAILY_GOAL.toFixed(2)}</strong></div>
          <div>Hoy: <strong>B/. {Number(todaySales).toFixed(2)}</strong></div>
          <div>Faltan: <strong>B/. {remaining.toFixed(2)}</strong></div>
          <div>{goalPct}% de la meta</div>
          <div className="progress"><span style={{ width: `${goalPct}%` }} /></div>
        </div>

        {/* SECCIONES */}
        {!activeSection && (
          <>
            <div style={{ margin: '8px 0 12px', color: 'var(--muted)' }}>Elige una sección</div>
            <div className="sectionGrid">
              {sectionStats.map((s) => (
                <button
                  key={s.name}
                  className="sectionCard"
                  onClick={() => setActiveSection(s.name)}
                  title={`${s.count} productos`}
                  type="button"
                >
                  <div className="sectionIcon">{sectionIcons[s.name]}</div>
                  <div className="sectionName">{s.name}</div>
                  <div className="sectionCount">{s.count} ítems</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* PRODUCTOS */}
        {activeSection && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0 12px' }}>
              <button className="btn" onClick={() => { setActiveSection(''); setSearch(''); }} type="button">← Secciones</button>
              <div style={{ fontWeight: 700 }}>Sección: {activeSection}</div>
              <input
                className="input"
                placeholder="Buscar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 280, marginLeft: 'auto' }}
              />
            </div>

            <div className="grid cols-4">
              {list.map((p) => {
                const left = Math.max(0, Math.floor(Number(p?.stock || 0)) - qtyInCart(p.id));
                const disabled = left <= 0;
                return (
                  <div key={p.id} className="card">
                    <div style={{ fontWeight: 700 }}>{p?.name || ''}</div>
                    <div className="badge">Stock: {Math.floor(Number(p?.stock || 0))}</div>
                    <div style={{ margin: '8px 0' }}>B/. {Number(p?.price || 0).toFixed(2)}</div>
                    <button className="btn" disabled={disabled} onClick={() => add(p)} type="button">
                      {disabled ? 'Sin stock' : 'Agregar'}
                    </button>
                  </div>
                );
              })}
              {list.length === 0 && (
                <div className="card" style={{ gridColumn: '1/-1' }}>
                  No hay productos en esta sección.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* CARRITO */}
      <div className="card">
        <h2>Carrito</h2>
        {cart.length === 0 ? (
          <div>Vacío</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Producto</th><th>Cant</th><th>PU</th><th>Subtot</th><th /></tr>
            </thead>
            <tbody>
              {cart.map((r) => (
                <tr key={r.product_id}>
                  <td>{r.name}</td>
                  <td>{r.quantity}</td>
                  <td>B/. {Number(r.unit_price).toFixed(2)}</td>
                  <td>B/. {(Number(r.unit_price) * Number(r.quantity)).toFixed(2)}</td>
                  <td>
                    <button className="btn" onClick={() => changeQty(r.product_id, +1)} type="button">+1</button>{' '}
                    <button className="btn" onClick={() => changeQty(r.product_id, -1)} type="button">-1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div>Total: <strong>B/. {Number(total).toFixed(2)}</strong></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input" style={{ width: 180 }} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn" onClick={checkout} disabled={cart.length === 0} type="button">Cobrar</button>
          </div>
        </div>

        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      </div>
    </main>
  );
}
