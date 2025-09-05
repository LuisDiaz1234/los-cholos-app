export const metadata = {
  title: 'Los Cholos — Panel',
  description: 'POS & Gestión',
};

import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand" aria-label="Inicio">
              {/* El logo se carga desde /public (ver pasos abajo) */}
              <img src="/logo.jpg" alt="Los Cholos" width="32" height="32" />
              <span>Los Cholos — Panel</span>
            </Link>

            <nav>
              <Link href="/">Ventas</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/sales">Ventas (historial)</Link>
              <Link href="/inventory">Inventario</Link>
              <Link href="/ingredients">Ingredientes</Link>
              <Link href="/recipes">Recetas</Link>
              <Link href="/shopping">Lista de compras</Link>
              <Link href="/cash">Cierre de caja</Link>
              <Link href="/shifts">Turnos</Link>
              <Link href="/admin/users">Usuarios</Link>
            </nav>

            {/* Botón SALIR al extremo derecho */}
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/logout" className="btn btn-primary">Salir</Link>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="page">
          {children}
        </main>

        <footer>© 2025 Los Cholos</footer>
      </body>
    </html>
  );
}
