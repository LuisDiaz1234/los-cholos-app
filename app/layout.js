import './globals.css';

export const metadata = {
  title: 'Los Cholos',
  description: 'POS, inventario, caja y compras',
  icons: { icon: '/logo.png' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <img src="/logo.png" alt="Los Cholos" width={40} height={40} />
              <strong>Los Cholos — Panel</strong>
            </div>
            <nav style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <a className="link" href="/">Ventas</a>
              <a className="link" href="/sales">Ventas (historial)</a>
              <a className="link" href="/inventory">Inventario</a>
              <a className="link" href="/ingredients">Ingredientes</a>
              <a className="link" href="/recipes">Recetas</a>
              <a className="link" href="/cash">Cierre de caja</a>
              <a className="link" href="/shopping-list">Lista de compras</a>
            </nav>
          </header>
          {children}
          <footer style={{ textAlign:'center', opacity:.6, fontSize:12, padding:'12px' }}>
            © {new Date().getFullYear()} Los Cholos
          </footer>
        </div>
      </body>
    </html>
  );
}
