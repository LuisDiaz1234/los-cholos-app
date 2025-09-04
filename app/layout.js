// app/layout.js
import './globals.css';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

export const metadata = { title: 'Los Cholos — Panel' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <img src="/logo.png" alt="Los Cholos" style={{height:28}}/>
              <span>Los Cholos — <strong>Panel</strong></span>
            </Link>
            <nav className="nav">
              <Link href="/">Ventas</Link>
              <Link href="/dashboard" className="only-admin">Dashboard</Link>
              <Link href="/sales">Ventas (historial)</Link>
              <Link href="/inventory">Inventario</Link>
              <Link href="/ingredients">Ingredientes</Link>
              <Link href="/recipes">Recetas</Link>
              <Link href="/shopping">Lista de compras</Link>
              <Link href="/shifts">Turnos</Link>
            </nav>
            <UserMenu/>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="foot">© 2025 Los Cholos</footer>
        {/* Esconde links solo-admin si no hay rol admin (CSS trivial, lo hacemos por JS en cada página crítica) */}
      </body>
    </html>
  );
}
