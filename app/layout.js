// app/layout.js
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Los Cholos — Panel',
  description: 'POS e Inventario de Los Cholos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="navbar">
          <div className="nav-inner">
            <Link href="/" className="brand">
              <img src="/logo.png" alt="Los Cholos" className="brand-logo" />
              <span>Los Cholos — <b>Panel</b></span>
            </Link>

            <nav className="nav-links">
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

            <div className="nav-right">
              <Link href="/login" className="btn small">Acceder</Link>
            </div>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="footer">© {new Date().getFullYear()} Los Cholos</footer>
      </body>
    </html>
  );
}
