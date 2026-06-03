'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  icon: Clock,        color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  confirmado: { label: 'Confirmado', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  en_camino:  { label: 'En camino',  icon: Truck,        color: 'text-purple-600 bg-purple-50 border-purple-200' },
  entregado:  { label: 'Entregado',  icon: Package,      color: 'text-green-600 bg-green-50 border-green-200' },
  cancelado:  { label: 'Cancelado',  icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function HistorialPage() {
  const router = useRouter();
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expandido, setExpand]  = useState(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/cuenta/login'); return; }

      const { data } = await supabase
        .from('pedidos')
        .select('*, detalle_pedidos(*)')
        .eq('cliente_id', user.id)
        .order('creado_en', { ascending: false });

      setPedidos(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="container-max py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cuenta/perfil" className="text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Mis pedidos</h1>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Todavía no hiciste ningún pedido</p>
          <Link href="/catalogo" className="btn-primary mt-6 inline-flex">Ver productos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const cfg = ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.pendiente;
            const Icon = cfg.icon;
            const isOpen = expandido === pedido.id;

            return (
              <div key={pedido.id} className="card overflow-hidden">
                <button onClick={() => setExpand(isOpen ? null : pedido.id)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                    <Icon className="w-3 h-3" />{cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Pedido #{String(pedido.id).padStart(6, '0')}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(pedido.creado_en).toLocaleDateString('es-AR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="font-black text-brand-purple-800">{formatPrecio(pedido.total)}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 fade-in">
                    <div className="space-y-2 mb-4">
                      {(pedido.detalle_pedidos || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.descripcion}</p>
                            <p className="text-xs text-gray-500">x{item.cantidad} · {formatPrecio(item.precio_unitario)}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatPrecio(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                      <p><strong>Entrega:</strong> {pedido.forma_entrega === 'retiro' ? 'Retiro en local' : 'Delivery'}</p>
                      <p><strong>Pago:</strong> {pedido.forma_pago}</p>
                      {pedido.direccion_entrega && <p><strong>Dirección:</strong> {pedido.direccion_entrega}</p>}
                      {pedido.observaciones && <p><strong>Nota:</strong> {pedido.observaciones}</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
