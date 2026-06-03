'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Clock, CheckCircle2, Truck, Package,
  XCircle, ChevronDown, ChevronUp, RefreshCw, Trash2, Edit3, Save, X
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

const SIGUIENTE_ESTADO = {
  pendiente:  'confirmado',
  confirmado: 'en_camino',
  en_camino:  'entregado',
};

export default function AdminPedidos() {
  const [pedidos, setPedidos]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState('todos');
  const [busqueda, setBusqueda]       = useState('');
  const [expandido, setExpand]        = useState(null);
  const [actualizando, setAct]        = useState(null);
  const [confirmarBorrar, setConfBorrar] = useState(null); // id a borrar
  const [editando, setEditando]       = useState(null);    // id en edición
  const [editForm, setEditForm]       = useState({});

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

  // ── Cambiar estado ──────────────────────────────────────
  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setAct(pedidoId);
    const supabase = createClient();
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al cambiar estado:', error);
      alert(`No se pudo cambiar el estado: ${error.message}\n\nRevisá las políticas RLS en Supabase.`);
    } else {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    }
    setAct(null);
  };

  // ── Borrar pedido ───────────────────────────────────────
  const borrarPedido = async (pedidoId) => {
    setAct(pedidoId);
    const supabase = createClient();

    // 1. Borrar el detalle primero (FK constraint)
    const { error: errDetalle } = await supabase
      .from('detalle_pedidos')
      .delete()
      .eq('pedido_id', pedidoId);

    if (errDetalle) {
      console.error('Error al borrar detalle_pedidos:', errDetalle);
      alert(`No se pudo eliminar el pedido: ${errDetalle.message}\n\nRevisá las políticas RLS en Supabase.`);
      setAct(null);
      setConfBorrar(null);
      return;
    }

    // 2. Borrar el pedido
    const { error: errPedido } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (errPedido) {
      console.error('Error al borrar pedido:', errPedido);
      alert(`No se pudo eliminar el pedido: ${errPedido.message}\n\nRevisá las políticas RLS en Supabase.`);
    } else {
      // Solo actualiza la UI si realmente se borró en la DB
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    }

    setConfBorrar(null);
    setAct(null);
  };

  // ── Edición inline ──────────────────────────────────────
  const abrirEdicion = (pedido) => {
    setEditando(pedido.id);
    setEditForm({
      estado:            pedido.estado,
      forma_entrega:     pedido.forma_entrega,
      forma_pago:        pedido.forma_pago,
      direccion_entrega: pedido.direccion_entrega || '',
      observaciones:     pedido.observaciones || '',
      nombre_cliente:    pedido.nombre_cliente || '',
    });
    setExpand(pedido.id);
  };

  const guardarEdicion = async (pedidoId) => {
    setAct(pedidoId);
    const supabase = createClient();
    const { error } = await supabase
      .from('pedidos')
      .update(editForm)
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al guardar edición:', error);
      alert(`No se pudo guardar: ${error.message}\n\nRevisá las políticas RLS en Supabase.`);
    } else {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, ...editForm } : p));
    }
    setEditando(null);
    setAct(null);
  };

  // ── Filtrado ────────────────────────────────────────────
  const filtrados = pedidos.filter(p => {
    const coincideFiltro = filtro === 'todos' || p.estado === filtro;
    const q = busqueda.toLowerCase();
    const coincideBusqueda = !q ||
      (p.nombre_cliente || '').toLowerCase().includes(q) ||
      String(p.id).includes(q);
    return coincideFiltro && coincideBusqueda;
  });

  const conteo = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-brand-yellow-400">Gestión de Pedidos</h1>
        </div>
        <button onClick={cargar} className="flex items-center gap-1.5 text-brand-purple-300 hover:text-white text-sm transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o número..." className="input pl-10 bg-white w-full" />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ESTADOS.map(estado => {
            const cfg = ESTADO_CFG[estado];
            const count = estado === 'todos' ? pedidos.length : (conteo[estado] || 0);
            return (
              <button key={estado} onClick={() => setFiltro(estado)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filtro === estado
                    ? estado === 'todos' ? 'bg-gray-800 text-white border-gray-800' : cfg.color + ' border'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {cfg && <cfg.icon className="w-3 h-3" />}
                {cfg ? cfg.label : 'Todos'}
                <span className={filtro === estado ? 'opacity-80' : 'opacity-50'}>({count})</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando pedidos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No hay pedidos {filtro !== 'todos' ? `en estado "${ESTADO_CFG[filtro]?.label}"` : ''}
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(pedido => {
              const cfg = ESTADO_CFG[pedido.estado] || ESTADO_CFG.pendiente;
              const Icon = cfg.icon;
              const isOpen = expandido === pedido.id;
              const siguiente = SIGUIENTE_ESTADO[pedido.estado];
              const esEditando = editando === pedido.id;
              const esBorrando = confirmarBorrar === pedido.id;

              return (
                <div key={pedido.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Cabecera */}
                  <div className="p-4 flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>

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
                        })} · {pedido.forma_entrega === 'retiro' ? '🏪 Retiro' : '🚚 Delivery'} · {pedido.forma_pago}
                      </p>
                    </div>

                    <p className="font-black text-brand-purple-800 text-base">{formatPrecio(pedido.total)}</p>

                    {/* Avanzar estado */}
                    {siguiente && !esEditando && (
                      <button onClick={() => cambiarEstado(pedido.id, siguiente)}
                        disabled={actualizando === pedido.id}
                        className="text-xs font-semibold bg-brand-purple-800 hover:bg-brand-purple-900 disabled:opacity-50 text-brand-yellow-400 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                        {actualizando === pedido.id ? '...' : `→ ${ESTADO_CFG[siguiente].label}`}
                      </button>
                    )}

                    {/* Cancelar estado */}
                    {(pedido.estado === 'pendiente' || pedido.estado === 'confirmado') && !esEditando && (
                      <button onClick={() => cambiarEstado(pedido.id, 'cancelado')}
                        disabled={actualizando === pedido.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 px-2 py-1.5 rounded-xl border border-red-200 hover:border-red-400 transition-colors">
                        Cancelar
                      </button>
                    )}

                    {/* Editar */}
                    {!esEditando && (
                      <button onClick={() => abrirEdicion(pedido)}
                        className="text-gray-400 hover:text-brand-purple-700 transition-colors p-1.5 rounded-lg hover:bg-brand-purple-50"
                        title="Editar pedido">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Borrar */}
                    {!esEditando && (
                      <button onClick={() => setConfBorrar(esBorrando ? null : pedido.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Eliminar pedido">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Toggle */}
                    <button onClick={() => setExpand(isOpen ? null : pedido.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirmación de borrado */}
                  {esBorrando && (
                    <div className="bg-red-50 border-t border-red-100 px-4 py-3 flex items-center gap-3">
                      <p className="text-sm text-red-700 flex-1 font-medium">
                        ¿Eliminar este pedido permanentemente?
                      </p>
                      <button onClick={() => borrarPedido(pedido.id)}
                        disabled={actualizando === pedido.id}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                        {actualizando === pedido.id ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                      <button onClick={() => setConfBorrar(null)}
                        className="bg-white border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Detalle / Edición */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 fade-in">

                      {/* Productos */}
                      <div className="space-y-2 mb-4">
                        {(pedido.detalle_pedidos || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-lg text-xs">x{item.cantidad}</span>
                            <span className="flex-1 text-gray-700 truncate">{item.descripcion}</span>
                            <span className="font-semibold text-gray-900 flex-shrink-0">{formatPrecio(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Formulario de edición */}
                      {esEditando ? (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <h3 className="text-sm font-bold text-gray-700 mb-2">Editando pedido</h3>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Estado</label>
                              <select value={editForm.estado}
                                onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}
                                className="input text-sm py-1.5">
                                {Object.keys(ESTADO_CFG).map(e => (
                                  <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Entrega</label>
                              <select value={editForm.forma_entrega}
                                onChange={e => setEditForm(f => ({ ...f, forma_entrega: e.target.value }))}
                                className="input text-sm py-1.5">
                                <option value="retiro">Retiro en local</option>
                                <option value="delivery">Delivery</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Método de pago</label>
                              <select value={editForm.forma_pago}
                                onChange={e => setEditForm(f => ({ ...f, forma_pago: e.target.value }))}
                                className="input text-sm py-1.5">
                                {['mercadopago','tarjeta','transferencia','efectivo'].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Nombre cliente</label>
                              <input value={editForm.nombre_cliente}
                                onChange={e => setEditForm(f => ({ ...f, nombre_cliente: e.target.value }))}
                                className="input text-sm py-1.5" placeholder="Nombre del cliente" />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 font-semibold block mb-1">Dirección de entrega</label>
                            <input value={editForm.direccion_entrega}
                              onChange={e => setEditForm(f => ({ ...f, direccion_entrega: e.target.value }))}
                              className="input text-sm py-1.5 w-full" placeholder="Dirección..." />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 font-semibold block mb-1">Observaciones</label>
                            <textarea value={editForm.observaciones}
                              onChange={e => setEditForm(f => ({ ...f, observaciones: e.target.value }))}
                              className="input text-sm py-1.5 w-full resize-none" rows={2} placeholder="Notas..." />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={() => guardarEdicion(pedido.id)}
                              disabled={actualizando === pedido.id}
                              className="flex items-center gap-1.5 bg-brand-purple-800 hover:bg-brand-purple-900 disabled:opacity-50 text-brand-yellow-400 font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                              <Save className="w-4 h-4" />
                              {actualizando === pedido.id ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <button onClick={() => setEditando(null)}
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vista info normal */
                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                          <p><strong>Entrega:</strong> {pedido.forma_entrega === 'retiro' ? 'Retiro en local' : 'Delivery'}</p>
                          <p><strong>Pago:</strong> {pedido.forma_pago}</p>
                          {pedido.direccion_entrega && <p><strong>Dirección:</strong> {pedido.direccion_entrega}</p>}
                          {pedido.observaciones && <p><strong>Nota:</strong> {pedido.observaciones}</p>}
                        </div>
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
