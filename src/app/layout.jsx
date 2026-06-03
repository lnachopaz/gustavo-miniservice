import './globals.css';
import { CartProvider } from '@/context/CartContext';
import ShopWrapper from '@/components/layout/ShopWrapper';

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
            <ShopWrapper>
              {children}
            </ShopWrapper>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
