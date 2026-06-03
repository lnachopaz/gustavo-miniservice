'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

// Rutas que tienen su propio layout completo
const STANDALONE_ROUTES = ['/cadete'];

export default function ShopWrapper({ children }) {
  const pathname    = usePathname();
  const isStandalone = STANDALONE_ROUTES.some(r => pathname?.startsWith(r));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {/* pb-20 en mobile para que el contenido no quede tapado por la bottom nav */}
      <main className="flex-1 pb-20 sm:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
