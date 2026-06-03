'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Clock, CheckCircle2, Truck, Package,
  XCircle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

const ESTADOS = ['todos', 'pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'];

const ESTADO_CFG = {
  pendiente:  { label: 'Pendiente',  icon: Clock,         color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmado: { label: 'Confirmado', icon: CheckCircle2,  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  en_camino:  { label: 'En camino',  icon: Truck,         color: 'bg-purple-100 text-purple-700 border-purple-200' },
  entregado:  { label: 'Entregado',  icon: Package,       color: 'bg-green-100 text-green-700 border-green-200' },
  cancelado:  { label: 'Cancelado',  icon: XCircle,       color: 'bg-red-100 text-red-700 border-red-200' },
};

// Orden lógico para avanzar el estado
const SIGUIENTE_ESTADO = {
  pendiente:  'confirmado',
  confirmado: 'en_camino',
  en_camino:  'entregado',
};

export default function AdminPedidos() {
  const [pedidos, setPedidos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState('todos');
  const [busqueda, setBusqueda]   = useState('');
  const [expandido, setExpand]    = useState(null);
  const [actualizando, setAct]    = useState(null);

  const cargar = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*)')
      .order('creado_en', { ascending: false });
    setPedidos(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setAct(pedidoId);
    const supabase = createClient();
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (!error) {
      setPedidos(prev =>
        prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)
      );
    }
    setAct(null);
  };

  const filtrados = pedidos.filter(p => {
    const coincideFiltro = filtro === 'todos' || p.estado === filtro;
    const q = busqueda.toLowerCase();
    const coincideBusqueda = !q ||
      (p.nombre_cliente || '').toLowerCase().includes(q) ||
      String(p.id).includes(q);
    return coincideFiltro && coincideBusqueda;
  });

  // Totales por estado para los chips
  const conteo = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-brand-yellow-400">Gestión de Pedidos</h1>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 text-brand-purple-300 hover:text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o número de pedido..."
            className="input pl-10 bg-white w-full"
          />
        </div>

        {/* Filtros por estado */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ESTADOS.map(estado => {
            const cfg = ESTADO_CFG[estado];
            const count = estado === 'todos' ? pedidos.length : (conteo[estado] || 0);
            return (
              <button
                key={estado}
                onClick={() => setFiltro(estado)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filtro === estado
                    ? estado === 'todos'
                      ? 'bg-gray-800 text-white border-gray-800'
                      : cfg.color + ' border'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cfg && <cfg.icon className="w-3 h-3" />}
                {cfg ? cfg.label : 'Todos'}
                <span className={`ml-0.5 ${filtro === estado ? 'opacity-80' : 'opacity-50'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando pedidos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No hay pedidos {filtro !== 'todos' ? `con estado "${ESTADO_CFG[filtro]?.label}"` : ''}
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(pedido => {
              const cfg = ESTADO_CFG[pedido.estado] || ESTADO_CFG.pendiente;
              const Icon = cfg.icon;
              const isOpen = expandido === pedido.id;
              const siguiente = SIGUIENTE_ESTADO[pedido.estado];

              return (
                <div key={pedido.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Cabecera del pedido */}
                  <div className="p-4 flex items-center gap-3 flex-wrap">

                    {/* Estado badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>

                    {/* Info básica */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {pedido.nombre_cliente || 'Cliente'} &nbsp;
                        <span className="text-gray-400 font-normal text-xs">
                          #{String(pedido.id).slice(-6).toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(pedido.creado_en).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                        &nbsp;·&nbsp;
                        {pedido.forma_entrega === 'retiro' ? '🏪 Retiro' : '🚚 Delivery'}
                        &nbsp;·&nbsp;
                        {pedido.forma_pago}
                      </p>
                    </div>

                    {/* Total */}
                    <p className="font-black text-brand-purple-800 text-base">
                      {formatPrecio(pedido.total)}
                    </p>

                    {/* Botón avanzar estado */}
                    {siguiente && (
                      <button
                        onClick={() => cambiarEstado(pedido.id, siguiente)}
                        disabled={actualizando === pedido.id}
                        className="text-xs font-semibold bg-brand-purple-800 hover:bg-brand-purple-900 disabled:opacity-50 text-brand-yellow-400 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                      >
                        {actualizando === pedido.id
                          ? '...'
                          : `→ ${ESTADO_CFG[siguiente].label}`
                        }
                      </button>
                    )}

                    {/* Cancelar (solo pendiente/confirmado) */}
                    {(pedido.estado === 'pendiente' || pedido.estado === 'confirmado') && (
                      <button
                        onClick={() => cambiarEstado(pedido.id, 'cancelado')}
                        disabled={actualizando === pedido.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 px-2 py-1.5 rounded-xl border border-red-200 hover:border-red-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}

                    {/* Toggle detalle */}
                    <button
                      onClick={() => setExpand(isOpen ? null : pedido.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 fade-in">
                      <div className="space-y-2 mb-3">
                        {(pedido.detalle_pedidos || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-lg text-xs">
                              x{item.cantidad}
                            </span>
                            <span className="flex-1 text-gray-700 truncate">{item.descripcion}</span>
                            <span className="font-semibold text-gray-900 flex-shrink-0">
                              {formatPrecio(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {pedido.direccion_entrega && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Dirección:</strong> {pedido.direccion_entrega}
                        </p>
                      )}
                      {pedido.observaciones && (
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Nota:</strong> {pedido.observaciones}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
