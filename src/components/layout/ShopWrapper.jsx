'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

// Rutas que tienen su propio layout completo (sin navbar/footer principal)
const STANDALONE_ROUTES = ['/cadete'];

export default function ShopWrapper({ children }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.some(r => pathname?.startsWith(r));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
