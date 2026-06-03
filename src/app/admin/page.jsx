'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Users, ShoppingBag, TrendingUp, LogOut, Settings, ChevronRight, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ productos: 0, usuarios: 0, pedidos: 0, ventas: 0 });
  const [pedidosRecientes, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/cuenta/login?next=/admin'); return; }

      const [{ count: cProds }, { count: cUsers }, { count: cPedidos }, { data: ventas }, { data: pedidos }] =
        await Promise.all([
          supabase.from('productos').select('*', { count: 'exact', head: true }).eq('activo', true),
          supabase.from('perfiles').select('*', { count: 'exact', head: true }),
          supabase.from('pedidos').select('*', { count: 'exact', head: true }),
          supabase.from('pedidos').select('total'),
          supabase.from('pedidos').select('*').order('creado_en', { ascending: false }).limit(5),
        ]);

      setStats({
        productos: cProds || 0,
        usuarios:  cUsers || 0,
        pedidos:   cPedidos || 0,
        ventas:    (ventas || []).reduce((s, p) => s + (p.total || 0), 0),
      });
      setPedidos(pedidos || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  const CARDS = [
    { label: 'Productos activos', value: stats.productos, icon: Package,     color: 'bg-brand-purple-100 text-brand-purple-700', href: '/admin/productos' },
    { label: 'Usuarios',          value: stats.usuarios,  icon: Users,        color: 'bg-blue-100 text-blue-700',   href: '/admin/usuarios' },
    { label: 'Pedidos totales',   value: stats.pedidos,   icon: ShoppingBag,  color: 'bg-green-100 text-green-700', href: '/admin/pedidos' },
    { label: 'Ventas totales',    value: formatPrecio(stats.ventas), icon: TrendingUp, color: 'bg-yellow-100 text-yellow-700', href: '/admin/pedidos' },
  ];

  const ESTADO_COLOR = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmado: 'bg-blue-100 text-blue-700',
    en_camino: 'bg-purple-100 text-purple-700',
    entregado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin navbar */}
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-yellow-400 rounded-xl p-1.5">
            <Store className="w-5 h-5 text-brand-purple-900" />
          </div>
          <div>
            <p className="text-brand-yellow-400 font-black text-lg leading-none">Gustavo 1°</p>
            <p className="text-brand-purple-300 text-xs">Panel Administrador</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-brand-purple-300 hover:text-white text-sm transition-colors">
            Ver tienda
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CARDS.map(c => {
            const Icon = c.icon;
            return (
              <Link key={c.label} href={c.href}
                className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{c.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Accesos rápidos */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/admin/productos', icon: Package, label: 'Gestionar productos', desc: 'Agregar, editar precios e imágenes', color: 'text-brand-purple-700 bg-brand-purple-100' },
            { href: '/admin/usuarios',  icon: Users,   label: 'Gestionar usuarios',  desc: 'Ver y administrar cuentas', color: 'text-blue-700 bg-blue-100' },
            { href: '/admin/pedidos',   icon: ShoppingBag, label: 'Ver pedidos',     desc: 'Estado y detalle de pedidos', color: 'text-green-700 bg-green-100' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-brand-purple-200">
                <div className={`p-3 rounded-2xl ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            );
          })}
        </div>

        {/* Pedidos recientes */}
        {pedidosRecientes.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
              <Link href="/admin/pedidos" className="text-brand-purple-700 text-sm font-medium hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {pedidosRecientes.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLOR[p.estado] || 'bg-gray-100 text-gray-600'}`}>
                    {p.estado}
                  </span>
                  <p className="text-sm text-gray-700 flex-1">
                    {p.nombre_cliente || 'Cliente'} · #{String(p.id).slice(-6).toUpperCase()}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{formatPrecio(p.total)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.creado_en).toLocaleDateString('es-AR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
