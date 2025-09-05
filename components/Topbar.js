// components/Topbar.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Topbar() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const logged = !!session;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <Image src="/logo.png" alt="Los Cholos" width={28} height={28} />
          <span>Los Cholos — <strong>Panel</strong></span>
        </Link>

        <nav className="nav">
          {logged ? (
            <>
              <Link href="/">Ventas</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/sales">Ventas (historial)</Link>
              <Link href="/inventory">Inventario</Link>
              <Link href="/ingredients">Ingredientes</Link>
              <Link href="/recipes">Recetas</Link>
              <Link href="/shopping-list">Lista de compras</Link>
              <Link href="/cash">Cierre de caja</Link>
              <Link href="/shifts">Turnos</Link>
              <Link href="/users">Usuarios</Link>
              <Link href="/logout" className="btn-outline">Salir</Link>
            </>
          ) : (
            <>
              {/* Solo se muestra el botón de acceso */}
              <Link href="/login" className="btn">Acceder</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
