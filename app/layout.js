import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Los Cholos',
  description: 'POS, inventario, caja, recetas y compras',
  icons: { icon: '/logo.png' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <img src="/logo.png" alt="Los Cholos" width={40} height={40}/>
              <strong>Los Cholos — Panel</strong>
            </div>
            <nav style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <Link className="link" href="/">Ventas</Link>
              <Link className="link" href="/dashboard">Dashboard</Link>
              <Link className="link" href="/sales">Ventas (historial)</Link>
              <Link className="link" href="/inventory">Inventario</Link>
              <Link className="link" href="/ingredients">Ingredientes</Link>
              <Link className="link" href="/recipes">Recetas</Link>
              <Link className="link" href="/cash">Cierre de caja</Link>
              <Link className="link" href="/shopping-list">Lista de compras</Link>
            </nav>
          </header>
          {children}
          <footer style={{textAlign:'center',opacity:.6,fontSize:12,padding:'12px'}}>© {new Date().getFullYear()} Los Cholos</footer>
        </div>
      </body>
    </html>
  );
}
