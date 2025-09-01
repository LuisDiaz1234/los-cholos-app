export const metadata = { title: 'Los Cholos', description: 'Control de ventas, inventario y caja' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <img src="/logo.png" alt="Los Cholos" width="36" height="36" />
              <strong>Los Cholos — Panel</strong>
            </div>
            <nav style={{display:'flex',gap:10}}>
              <a className="link" href="/">Ventas</a>
              <a className="link" href="/inventory">Inventario</a>
              <a className="link" href="/cash">Cierre de caja</a>
              <a className="link" href="/shopping-list">Lista de compras</a>
            </nav>
          </header>
          {children}
          <footer style={{opacity:.6, fontSize:12, textAlign:'center', padding:'12px'}}>© {new Date().getFullYear()} Los Cholos</footer>
        </div>
      </body>
    </html>
  );
}
