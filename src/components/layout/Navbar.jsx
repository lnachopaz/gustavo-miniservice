'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, Store, User, LogOut, ChevronDown, Shield, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [userMenu, setUserMenu]   = useState(false);
  const [searchQuery, setSearch]  = useState('');
  const [usuario, setUsuario]     = useState(null); // { nombre, rol }
  const { totalItems, toggleCart, cartToast } = useCart();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('clientes').select('nombre, rol').eq('id', user.id).single();
      if (data) setUsuario(data);
    };
    loadUser();

    // Escuchar cambios de sesión
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUsuario(null);
      if (event === 'SIGNED_IN') loadUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUsuario(null);
    setUserMenu(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/',                      label: 'Inicio' },
    { href: '/catalogo',              label: 'Productos' },
    { href: '/catalogo?cat=ofertas',  label: 'Ofertas 🔥' },
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
                <span className="block text-brand-yellow-400 font-black text-lg tracking-tight">Gustavo 1°</span>
                <span className="block text-brand-purple-200 text-[10px] font-medium -mt-1">Miniservice</span>
              </div>
            </Link>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Buscar productos..."
                  value={searchQuery} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow-400 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">

              {/* Usuario logueado */}
              {usuario ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 text-brand-yellow-300 hover:text-brand-yellow-400 text-sm font-medium px-2 py-1 rounded-lg hover:bg-brand-purple-700 transition-all"
                  >
                    {usuario.rol === 'admin'
                      ? <Shield className="w-4 h-4" />
                      : <User className="w-4 h-4" />
                    }
                    <span className="max-w-24 truncate">{usuario.nombre || 'Mi cuenta'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      {usuario.rol === 'admin' ? (
                        <>
                          <Link href="/admin" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-brand-purple-800 hover:bg-brand-purple-50 font-semibold border-b border-gray-100">
                            <Shield className="w-4 h-4" />Panel Admin
                          </Link>
                          <Link href="/admin/productos" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                            📦 Productos
                          </Link>
                          <Link href="/admin/usuarios" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                            👥 Usuarios
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/cuenta/perfil" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="w-4 h-4" />Mi perfil
                          </Link>
                          <Link href="/cuenta/historial" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                            🛍️ Mis pedidos
                          </Link>
                        </>
                      )}
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                        <LogOut className="w-4 h-4" />Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/cuenta/login"
                  className="hidden md:flex items-center gap-1.5 text-brand-yellow-300 hover:text-brand-yellow-400 text-sm font-medium transition-colors px-2 py-1">
                  <User className="w-4 h-4" />
                  <span>Ingresar</span>
                </Link>
              )}

              {/* Carrito */}
              <button onClick={toggleCart}
                className="relative flex items-center gap-2 bg-brand-yellow-400 hover:bg-brand-yellow-300 text-brand-purple-900 font-bold px-3 py-2 rounded-xl transition-all duration-200 active:scale-95">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Carrito</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-brand-yellow-400 p-1">
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Nav links desktop */}
          <nav className="hidden md:flex items-center gap-1 pb-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="text-brand-purple-200 hover:text-brand-yellow-400 hover:bg-brand-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-brand-purple-900 border-t border-brand-purple-700 px-4 py-3 space-y-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white text-gray-900 text-sm focus:outline-none" />
            </div>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="block text-brand-yellow-300 hover:text-brand-yellow-400 py-2 text-sm font-medium border-b border-brand-purple-700 last:border-0">
                {link.label}
              </Link>
            ))}
            {usuario ? (
              <>
                {usuario.rol === 'admin'
                  ? <Link href="/admin" onClick={() => setMenuOpen(false)} className="block text-brand-yellow-300 py-2 text-sm font-medium">🛡️ Panel Admin</Link>
                  : <Link href="/cuenta/perfil" onClick={() => setMenuOpen(false)} className="block text-brand-yellow-300 py-2 text-sm font-medium">👤 Mi cuenta</Link>
                }
                <button onClick={handleLogout} className="block text-red-400 py-2 text-sm font-medium text-left w-full">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/cuenta/login" onClick={() => setMenuOpen(false)}
                className="block text-brand-yellow-300 hover:text-brand-yellow-400 py-2 text-sm font-medium">
                Ingresar / Registrarse
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Cerrar user menu al hacer click afuera */}
      {userMenu && <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />}

      {/* Toast: producto agregado al carrito */}
      {cartToast.visible && (
        <div className="cart-toast fixed bottom-6 right-4 z-[60] flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl max-w-xs">
          {cartToast.imagen && (
            <img src={cartToast.imagen} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Agregado al carrito</p>
            <p className="text-sm font-bold truncate">{cartToast.nombre}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        </div>
      )}

      <CartDrawer />
    </>
  );
}
