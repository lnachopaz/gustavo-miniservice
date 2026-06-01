import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Gustavo 1° | Miniservice',
  description: 'Tu miniservice online. Comestibles, bebidas, rotisería, lácteos, artículos de limpieza y más. Delivery y retiro en local.',
  keywords: 'miniservice, comestibles, rotiseria, lacteos, bebidas, limpieza, delivery, compras online, Gustavo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
