'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const TABS = [
  { href: '/',         icon: Home,      label: 'Inicio'    },
  { href: '/catalogo', icon: Grid3x3,   label: 'Productos' },
  { href: null,        icon: ShoppingCart, label: 'Carrito', isCart: true },
  { href: '/cuenta/perfil', icon: User, label: 'Mi cuenta' },
];

export default function BottomNav() {
  const pathname   = usePathname();
  const { totalItems, toggleCart } = useCart();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-4">
        {TABS.map(tab => {
          const Icon    = tab.icon;
          const isActive = tab.href && pathname === tab.href;

          if (tab.isCart) {
            return (
              <button key="carrito" onClick={toggleCart}
                className="flex flex-col items-center justify-center py-2.5 gap-0.5 relative active:bg-gray-50 transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 bg-brand-purple-800 rounded-full flex items-center justify-center -mt-5 shadow-lg shadow-brand-purple-900/30">
                    <Icon className="w-5 h-5 text-brand-yellow-400" />
                  </div>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 leading-none">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-brand-purple-800 mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors active:bg-gray-50 ${
                isActive ? 'text-brand-purple-800' : 'text-gray-400'
              }`}>
              <Icon className={`w-5 h-5 ${isActive ? 'fill-brand-purple-800 stroke-brand-purple-800' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-purple-800' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-brand-purple-800 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
