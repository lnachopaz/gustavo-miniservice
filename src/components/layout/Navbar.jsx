'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, Store, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems, toggleCart } = useCart();

  const navLinks = [
    { href: '/',           label: 'Inicio' },
    { href: '/catalogo',   label: 'Productos' },
    { href: '/catalogo?cat=ofertas', label: 'Ofertas' },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-brand-purple-900 text-brand-yellow-300 text-xs text-center py-1.5 px-4">
        🚚 Envíos a domicilio · 🏪 Retiro en local · 💳 Mercado Pago y efectivo
      </div>

      {/* Main navbar */}
      <header className="bg-brand-purple-800 shadow-lg sticky top-0 z-50">
        <div className="container-max">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-brand-yellow-400 rounded-xl p-1.5">
                <Store className="w-6 h-6 text-brand-purple-900" />
              </div>
              <div className="leading-tight">
                <span className="block text-brand-yellow-400 font-black text-lg tracking-tight">
                  Gustavo 1°
                </span>
                <span className="block text-brand-purple-200 text-[10px] font-medium -mt-1">
                  Miniservice
                </span>
              </div>
            </Link>

            {/* Search bar - desktop */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow-400 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">

              {/* Mi cuenta */}
              <Link
                href="/cuenta"
                className="hidden md:flex items-center gap-1.5 text-brand-yellow-300 hover:text-brand-yellow-400 text-sm font-medium transition-colors px-2 py-1"
              >
                <User className="w-4 h-4" />
                <span>Mi cuenta</span>
              </Link>

              {/* Cart button */}
              <button
                onClick={toggleCart}
                className="relative flex items-center gap-2 bg-brand-yellow-400 hover:bg-brand-yellow-300 text-brand-purple-900 font-bold px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Carrito</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-brand-yellow-400 p-1"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-1 pb-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-brand-purple-200 hover:text-brand-yellow-400 hover:bg-brand-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-brand-purple-900 border-t border-brand-purple-700 px-4 py-3 space-y-2">
            {/* Mobile search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white text-gray-900 text-sm focus:outline-none"
              />
            </div>

            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-brand-yellow-300 hover:text-brand-yellow-400 py-2 text-sm font-medium border-b border-brand-purple-700 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cuenta"
              onClick={() => setMenuOpen(false)}
              className="block text-brand-yellow-300 hover:text-brand-yellow-400 py-2 text-sm font-medium"
            >
              Mi cuenta
            </Link>
          </div>
        )}
      </header>

      {/* Cart drawer */}
      <CartDrawer />
    </>
  );
}
