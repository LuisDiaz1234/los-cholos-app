// app/layout.js
import './globals.css';
import Topbar from '../components/Topbar';

export const metadata = {
  title: 'Los Cholos — Panel',
  description: 'POS e inventario',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Topbar />
        <div className="container">{children}</div>
        <footer style={{textAlign:'center', opacity:.75, margin:'40px 0'}}>© 2025 Los Cholos</footer>
      </body>
    </html>
  );
}
