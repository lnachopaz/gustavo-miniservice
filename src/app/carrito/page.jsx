'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, ArrowLeft, Trash2, Plus, Minus,
  ArrowRight, CheckCircle2, Store, Bike
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrecio } from '@/data/mockData';
import { createClient } from '@/lib/supabase/client';

const METODOS_PAGO = [
  { id: 'mercadopago',   label: 'Mercado Pago',             icon: '💳', desc: 'Tarjetas, QR, billetera virtual', badge: 'Recomendado' },
  { id: 'tarjeta',       label: 'Tarjeta débito/crédito',    icon: '🏦', desc: 'Todas las tarjetas aceptadas',    badge: null },
  { id: 'transferencia', label: 'Transferencia bancaria',    icon: '📲', desc: 'CVU / Alias / CBU',               badge: null },
  { id: 'efectivo',      label: 'Efectivo',                  icon: '💵', desc: 'Al retirar o al recibir',         badge: null },
];

const METODOS_ENTREGA = [
  { id: 'retiro',   label: 'Retiro en el local',   icon: <Store className="w-5 h-5" />, desc: 'Sin costo adicional' },
  { id: 'delivery', label: 'Delivery a domicilio', icon: <Bike  className="w-5 h-5" />, desc: 'Consultá costo según zona' },
];

export default function CarritoPage() {
  const { items, removeItem, updateCantidad, clearCart, totalPrecio, totalItems } = useCart();
  const [paso, setPaso]             = useState(1);
  const [metodoPago, setMetodoPago] = useState('mercadopago');
  const [entrega, setEntrega]       = useState('retiro');
  const [loading, setLoading]       = useState(false);
  const [pedidoId, setPedidoId]     = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', nota: '' });

  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // Pre-completar datos si el usuario está logueado
  const cargarDatosUsuario = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('clientes').select('*').eq('id', user.id).single();
    if (data) {
      setForm(p => ({
        ...p,
        nombre:    data.nombre    || '',
        apellido:  data.apellido  || '',
        telefono:  data.telefono  || '',
        email:     user.email     || '',
        direccion: data.direccion || '',
      }));
    }
  };

  const irAPaso2 = async () => {
    await cargarDatosUsuario();
    setPaso(2);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Crear pedido en Supabase
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert([{
          cliente_id:        user?.id || null,
          estado:            'pendiente',
          forma_entrega:     entrega,
          forma_pago:        metodoPago,
          direccion_entrega: entrega === 'delivery' ? form.direccion : null,
          total:             totalPrecio,
          observaciones:     form.nota || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Insertar detalle del pedido
      const detalles = items.map(item => ({
        pedido_id:       pedido.id,
        codigo_producto: String(item.codAb || item.id),
        descripcion:     item.nombre,
        cantidad:        item.cantidad,
        precio_unitario: item.precio,
        subtotal:        item.precio * item.cantidad,
      }));

      await supabase.from('detalle_pedidos').insert(detalles);

      setPedidoId(pedido.id);
      clearCart();
      setPaso(3);
    } catch (err) {
      console.error('Error al confirmar pedido:', err);
      alert('Hubo un error al procesar tu pedido. Intentá de nuevo.');
    }
    setLoading(false);
  };

  // PASO 3: Confirmación
  if (paso === 3) {
    return (
      <div className="container-max py-16 text-center max-w-lg mx-auto">
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">¡Pedido confirmado!</h1>
          {pedidoId && (
            <p className="text-brand-purple-700 font-bold text-sm mb-2">
              Pedido #{String(pedidoId).padStart(6, '0')}
            </p>
          )}
          <p className="text-gray-500 mb-2">Gracias <strong>{form.nombre}</strong>, recibimos tu pedido.</p>
          <p className="text-gray-500 text-sm mb-8">
            {entrega === 'retiro'
              ? '📍 Podés pasar a retirar cuando esté listo. Te avisamos por WhatsApp.'
              : '🚴 Nuestro cadete se comunicará con vos para coordinar la entrega.'}
          </p>
          <div className="bg-brand-purple-50 rounded-2xl p-4 text-left mb-8 space-y-1 text-sm text-gray-600">
            <p>💳 Pago: <strong>{METODOS_PAGO.find(m => m.id === metodoPago)?.label}</strong></p>
            <p>📦 Entrega: <strong>{METODOS_ENTREGA.find(m => m.id === entrega)?.label}</strong></p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="btn-primary flex-1 justify-center text-sm">Volver al inicio</Link>
            {form.email && (
              <Link href="/cuenta/historial" className="btn-outline flex-1 justify-center text-sm">Ver mis pedidos</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && paso === 1) {
    return (
      <div className="container-max py-16 text-center max-w-md mx-auto">
        <ShoppingCart className="w-20 h-20 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-400 mb-8">Agregá productos desde el catálogo.</p>
        <Link href="/catalogo" className="btn-primary justify-center"><ArrowLeft className="w-4 h-4" />Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[{ n: 1, label: 'Carrito' }, { n: 2, label: 'Datos y pago' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${paso >= n ? 'bg-brand-purple-800 text-brand-yellow-400' : 'bg-gray-200 text-gray-500'}`}>{n}</div>
            <span className={`text-sm font-medium ${paso >= n ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {n < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">

          {/* PASO 1 */}
          {paso === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">Mi carrito ({totalItems} items)</h2>
                <button onClick={clearCart} className="text-red-400 hover:text-red-600 text-xs font-medium flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" />Vaciar
                </button>
              </div>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={item.imagen || item.foto_url} alt={item.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-purple-600 font-medium mb-0.5">{item.categoria}</p>
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{item.nombre}</p>
                      <p className="text-brand-purple-800 font-bold mt-1">{formatPrecio(item.precio)} c/u</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{item.cantidad}</span>
                        <button onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="font-black text-gray-900">{formatPrecio(item.precio * item.cantidad)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/catalogo" className="mt-4 flex items-center gap-1 text-brand-purple-600 hover:text-brand-purple-800 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />Seguir comprando
              </Link>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <>
              {/* Entrega */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 text-lg mb-4">¿Cómo recibís tu pedido?</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {METODOS_ENTREGA.map(m => (
                    <button key={m.id} onClick={() => setEntrega(m.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${entrega === m.id ? 'border-brand-purple-600 bg-brand-purple-50' : 'border-gray-200 hover:border-brand-purple-300'}`}>
                      <span className={entrega === m.id ? 'text-brand-purple-700' : 'text-gray-500'}>{m.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Tus datos</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
                    <input name="nombre" value={form.nombre} onChange={handleFormChange} className="input" placeholder="Tu nombre" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Apellido *</label>
                    <input name="apellido" value={form.apellido} onChange={handleFormChange} className="input" placeholder="Tu apellido" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono *</label>
                    <input name="telefono" value={form.telefono} onChange={handleFormChange} className="input" placeholder="11 XXXX-XXXX" type="tel" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                    <input name="email" value={form.email} onChange={handleFormChange} className="input" placeholder="tu@email.com" type="email" />
                  </div>
                  {entrega === 'delivery' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección de entrega *</label>
                      <input name="direccion" value={form.direccion} onChange={handleFormChange} className="input" placeholder="Calle, número, piso/dpto" required />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nota para el local</label>
                    <textarea name="nota" value={form.nota} onChange={handleFormChange} className="input resize-none" rows={2} placeholder="Ej: sin cebolla, timbre roto..." />
                  </div>
                </div>
              </div>

              {/* Pago */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Método de pago</h2>
                <div className="space-y-3">
                  {METODOS_PAGO.map(m => (
                    <button key={m.id} onClick={() => setMetodoPago(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${metodoPago === m.id ? 'border-brand-purple-600 bg-brand-purple-50' : 'border-gray-200 hover:border-brand-purple-300'}`}>
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                          {m.badge && <span className="badge-purple text-[10px]">{m.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${metodoPago === m.id ? 'border-brand-purple-600' : 'border-gray-300'}`}>
                        {metodoPago === m.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-purple-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Resumen</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate mr-2">{item.nombre} x{item.cantidad}</span>
                  <span className="font-medium flex-shrink-0">{formatPrecio(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatPrecio(totalPrecio)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span className="text-green-600 font-medium">{entrega === 'retiro' ? 'Gratis' : 'A consultar'}</span>
              </div>
              <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-brand-purple-800">{formatPrecio(totalPrecio)}</span>
              </div>
            </div>

            {paso === 1 ? (
              <button onClick={irAPaso2} className="btn-primary w-full justify-center">
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleConfirmar}
                disabled={!form.nombre || !form.telefono || loading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" />Procesando...</span>
                  : <>Confirmar pedido <CheckCircle2 className="w-4 h-4" /></>}
              </button>
            )}

            {paso === 2 && (
              <button onClick={() => setPaso(1)} className="w-full text-center text-gray-400 text-sm mt-3 hover:text-gray-600 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" />Volver al carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
