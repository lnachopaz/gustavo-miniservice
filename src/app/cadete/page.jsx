'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, MessageCircle, CheckCircle2, XCircle,
  Package, MapPin, Clock, RefreshCw, LogOut,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

export default function CadetePage() {
  const router   = useRouter();
  const [pedidos, setPedidos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expandido, setExpand]    = useState(null);
  const [actuando, setActuando]   = useState(null);
  const [cadete, setCadete]       = useState(null);
  const [ultimaActualizacion, setUltAct] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      // 1. Verificar sesión
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.push('/cuenta/login?next=/cadete');
        return;
      }

      // 2. Verificar rol
      const { data: perfil, error: perfilErr } = await supabase
        .from('clientes')
        .select('nombre, apellido, rol')
        .eq('id', user.id)
        .single();

      if (perfilErr || !perfil) {
        setError('No se pudo verificar tu cuenta.');
        setLoading(false);
        return;
      }
      if (perfil.rol !== 'cadete' && perfil.rol !== 'admin') {
        router.push('/');
        return;
      }
      setCadete(perfil);

      // 3. Cargar pedidos en camino
      // Usamos * para no fallar si alguna columna nueva no existe todavía
      const { data, error: pedErr } = await supabase
        .from('pedidos')
        .select('*, detalle_pedidos(descripcion, cantidad, precio_unitario, subtotal)')
        .eq('estado', 'en_camino')
        .order('creado_en', { ascending: true });

      if (pedErr) {
        setError('Error al cargar pedidos: ' + pedErr.message);
        setLoading(false);
        return;
      }

      setPedidos(data || []);
      setUltAct(new Date());
    } catch (e) {
      setError('Error inesperado: ' + e.message);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setActuando(pedidoId);
    const supabase = createClient();
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (!error) {
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    }
    setActuando(null);
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/cuenta/login');
  };

  // Helpers para obtener datos del pedido
  const getNombre = p =>
    p.nombre_cliente ||
    'Cliente sin nombre';

  const getTelefono = p =>
    p.telefono_cliente || null;

  const getDireccion = p =>
    p.direccion_entrega || 'Sin dirección registrada';

  // ── Pantalla de carga ──────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Cargando pedidos...</p>
    </div>
  );

  // ── Error ──────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-white font-bold text-lg">Algo salió mal</p>
      <p className="text-gray-400 text-sm">{error}</p>
      <button onClick={cargar}
        className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl mt-2">
        Reintentar
      </button>
    </div>
  );

  // ── Interfaz principal ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white select-none">

      {/* Header fijo */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <p className="text-yellow-400 font-black text-base leading-none">Panel Cadete</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {cadete ? `${cadete.nombre} ${cadete.apellido || ''}`.trim() : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-red-900 text-gray-400 hover:text-red-300 p-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="px-4 py-4 max-w-lg mx-auto">

        {/* Sin pedidos */}
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-green-900/40 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <p className="text-white font-bold text-xl">¡Todo entregado!</p>
            <p className="text-gray-500 text-sm text-center">
              No hay pedidos en camino en este momento.
            </p>
            {ultimaActualizacion && (
              <p className="text-gray-600 text-xs">
                Última actualización: {ultimaActualizacion.toLocaleTimeString('es-AR')}
              </p>
            )}
            <button
              onClick={cargar}
              className="mt-2 flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        ) : (
          <>
            {/* Contador */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400 font-black text-lg">{pedidos.length}</span>
                {' '}pedido{pedidos.length !== 1 ? 's' : ''} para entregar
              </p>
              {ultimaActualizacion && (
                <p className="text-gray-600 text-xs">
                  {ultimaActualizacion.toLocaleTimeString('es-AR')}
                </p>
              )}
            </div>

            {/* Lista de pedidos */}
            <div className="space-y-4">
              {pedidos.map((p, idx) => {
                const nombre    = getNombre(p);
                const telefono  = getTelefono(p);
                const direccion = getDireccion(p);
                const isOpen    = expandido === p.id;
                const waNum     = telefono?.replace(/\D/g, '');
                const yaAgregado = actuando === p.id;

                return (
                  <div key={p.id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">

                    {/* Barra superior amarilla */}
                    <div className="bg-yellow-400 px-4 py-2 flex items-center justify-between">
                      <span className="text-gray-900 font-black text-sm">
                        Entrega #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(p.creado_en).toLocaleTimeString('es-AR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">

                      {/* Cliente */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-black text-yellow-400">
                          {nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-lg leading-tight truncate">{nombre}</p>
                          {telefono
                            ? <p className="text-gray-400 text-sm">{telefono}</p>
                            : <p className="text-gray-600 text-xs italic">Sin teléfono registrado</p>
                          }
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-yellow-400 font-black text-xl">{formatPrecio(p.total)}</p>
                          <p className={`text-xs font-semibold mt-0.5 ${
                            p.forma_pago === 'efectivo'
                              ? 'text-orange-400'
                              : 'text-green-400'
                          }`}>
                            {p.forma_pago === 'efectivo' ? '💵 Cobrar' : '✅ Pagado'}
                          </p>
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className="bg-gray-700 rounded-xl p-3 flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white font-semibold text-base leading-snug">{direccion}</p>
                      </div>

                      {/* Botones de contacto */}
                      {telefono && (
                        <div className="grid grid-cols-2 gap-2">
                          <a href={`tel:${telefono}`}
                            className="flex items-center justify-center gap-2 bg-blue-600 active:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                            <Phone className="w-4 h-4" />
                            Llamar
                          </a>
                          <a
                            href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hola ${nombre}, soy el cadete de Gustavo 1°. Estoy camino a entregarte tu pedido.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-green-600 active:bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </a>
                        </div>
                      )}

                      {/* Detalle de productos (expandible) */}
                      <button
                        onClick={() => setExpand(isOpen ? null : p.id)}
                        className="w-full flex items-center justify-between text-gray-400 text-sm py-1 hover:text-gray-200 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" />
                          {(p.detalle_pedidos || []).length} producto{(p.detalle_pedidos || []).length !== 1 ? 's' : ''}
                        </span>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                        }
                      </button>

                      {isOpen && (
                        <div className="bg-gray-900/60 rounded-xl p-3 space-y-2">
                          {(p.detalle_pedidos || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <span className="text-yellow-400 font-black w-6 text-center flex-shrink-0">
                                ×{item.cantidad}
                              </span>
                              <span className="text-gray-300 flex-1 leading-snug">{item.descripcion}</span>
                            </div>
                          ))}
                          {p.observaciones && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <p className="text-gray-500 text-xs">
                                <span className="text-gray-400 font-semibold">Nota: </span>
                                {p.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => cambiarEstado(p.id, 'entregado')}
                          disabled={yaAgregado}
                          className="flex items-center justify-center gap-2 bg-green-500 active:bg-green-600 disabled:opacity-50 text-white font-black py-4 rounded-xl text-base transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          {yaAgregado ? '...' : 'Entregado'}
                        </button>
                        <button
                          onClick={() => cambiarEstado(p.id, 'cancelado')}
                          disabled={yaAgregado}
                          className="flex items-center justify-center gap-2 bg-gray-700 active:bg-red-900 border border-red-800 disabled:opacity-50 text-red-400 font-bold py-4 rounded-xl text-base transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          {yaAgregado ? '...' : 'Cancelar'}
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
