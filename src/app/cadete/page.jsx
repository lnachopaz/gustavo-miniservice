'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, MessageCircle, CheckCircle2, XCircle,
  Package, MapPin, Clock, RefreshCw, LogOut, Bike
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

export default function CadetePage() {
  const router = useRouter();
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expandido, setExpand]  = useState(null);
  const [actuando, setActuando] = useState(null);
  const [cadete, setCadete]     = useState(null);

  const cargar = async () => {
    setLoading(true);
    const supabase = createClient();

    // Verificar sesión y rol
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/cuenta/login'); return; }

    const { data: perfil } = await supabase
      .from('clientes')
      .select('nombre, rol')
      .eq('id', user.id)
      .single();

    if (!perfil || (perfil.rol !== 'cadete' && perfil.rol !== 'admin')) {
      router.push('/');
      return;
    }
    setCadete(perfil);

    // Pedidos en camino con detalle y datos del cliente
    const { data } = await supabase
      .from('pedidos')
      .select(`
        id, estado, total, forma_pago, forma_entrega,
        direccion_entrega, observaciones, creado_en,
        nombre_cliente, telefono_cliente,
        detalle_pedidos(descripcion, cantidad),
        clientes(nombre, apellido, telefono, direccion, barrio)
      `)
      .eq('estado', 'en_camino')
      .order('creado_en', { ascending: true });

    setPedidos(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setActuando(pedidoId);
    const supabase = createClient();
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedidoId);
    setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    setActuando(null);
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/');
  };

  // Obtener teléfono del pedido o del perfil del cliente
  const getTelefono = (p) =>
    p.telefono_cliente || p.clientes?.telefono || null;

  const getNombre = (p) =>
    p.nombre_cliente ||
    [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(' ') ||
    'Cliente';

  const getDireccion = (p) =>
    p.direccion_entrega ||
    [p.clientes?.direccion, p.clientes?.barrio].filter(Boolean).join(' - ') ||
    'Sin dirección';

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 rounded-xl p-2">
            <Bike className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <p className="font-black text-yellow-400 text-lg leading-none">Cadete</p>
            <p className="text-gray-400 text-xs">{cadete?.nombre || 'Panel de entregas'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={cargar} className="text-gray-400 hover:text-white transition-colors p-2">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">

        {pedidos.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-300 font-bold text-lg">¡Todo entregado!</p>
            <p className="text-gray-500 text-sm mt-1">No hay pedidos en camino en este momento.</p>
            <button
              onClick={cargar}
              className="mt-6 flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-5 py-2.5 rounded-xl mx-auto hover:bg-yellow-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4 text-center">
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} para entregar
            </p>

            <div className="space-y-4">
              {pedidos.map((p, idx) => {
                const telefono  = getTelefono(p);
                const nombre    = getNombre(p);
                const direccion = getDireccion(p);
                const isOpen    = expandido === p.id;
                const waNum     = telefono ? telefono.replace(/\D/g, '') : null;

                return (
                  <div key={p.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">

                    {/* Número de orden y hora */}
                    <div className="bg-yellow-400 px-4 py-2 flex items-center justify-between">
                      <span className="text-gray-900 font-black text-sm">
                        #{idx + 1} · Pedido {String(p.id).slice(-6).toUpperCase()}
                      </span>
                      <span className="text-gray-700 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.creado_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="p-4">
                      {/* Cliente */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-400 font-black text-lg">
                            {nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white text-lg leading-tight">{nombre}</p>
                          {telefono && (
                            <p className="text-gray-400 text-sm">{telefono}</p>
                          )}
                        </div>
                        <p className="text-yellow-400 font-black text-lg flex-shrink-0">
                          {formatPrecio(p.total)}
                        </p>
                      </div>

                      {/* Dirección */}
                      <div className="bg-gray-700 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-base leading-snug">{direccion}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {p.forma_pago === 'efectivo' ? '💵 Cobrar en efectivo' : '✅ Ya pagado'}
                          </p>
                        </div>
                      </div>

                      {/* Productos (colapsable) */}
                      <button
                        onClick={() => setExpand(isOpen ? null : p.id)}
                        className="w-full flex items-center justify-between text-gray-400 text-sm mb-3 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" />
                          Ver productos ({(p.detalle_pedidos || []).length} ítems)
                        </span>
                        <span>{isOpen ? '▲' : '▼'}</span>
                      </button>

                      {isOpen && (
                        <div className="bg-gray-750 bg-gray-900/50 rounded-xl p-3 mb-4 space-y-1.5">
                          {(p.detalle_pedidos || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-yellow-400 font-bold w-6 text-center">×{item.cantidad}</span>
                              <span className="text-gray-300 flex-1">{item.descripcion}</span>
                            </div>
                          ))}
                          {p.observaciones && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <p className="text-gray-400 text-xs"><strong className="text-gray-300">Nota:</strong> {p.observaciones}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {telefono && (
                          <>
                            <a
                              href={`tel:${telefono}`}
                              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              Llamar
                            </a>
                            <a
                              href={`https://wa.me/${waNum}?text=Hola%20${encodeURIComponent(nombre)}%2C%20soy%20el%20cadete%20de%20Gustavo%201%C2%B0.%20Estoy%20camino%20a%20entregarte%20tu%20pedido.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => cambiarEstado(p.id, 'entregado')}
                          disabled={actuando === p.id}
                          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {actuando === p.id ? '...' : 'Entregado'}
                        </button>
                        <button
                          onClick={() => cambiarEstado(p.id, 'cancelado')}
                          disabled={actuando === p.id}
                          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          {actuando === p.id ? '...' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
