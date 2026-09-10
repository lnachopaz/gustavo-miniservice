'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, ArrowLeft, Trash2, Plus, Minus,
  ArrowRight, CheckCircle2, Store, Bike, AlertCircle
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrecio } from '@/lib/productos';
import { createClient } from '@/lib/supabase/client';
import { distanciaDesdeLocal, RADIO_MAXIMO_KM, COSTO_ENVIO } from '@/lib/envio';

// Únicos dos métodos de pago: Mercado Pago (online) o efectivo (al recibir/retirar)
const METODOS_PAGO = [
  { id: 'mercadopago', label: 'Mercado Pago', icon: '💳', desc: 'Pagás online desde tu cuenta de MP, con tarjeta o QR. Se acredita al instante.', badge: 'Recomendado' },
  { id: 'efectivo',    label: 'Efectivo',     icon: '💵', desc: 'Pagás al retirar en el local o cuando te llega el pedido.',                      badge: null },
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
  const [mpError, setMpError]       = useState(null);
  const [pagoEstado, setPagoEstado]         = useState(null);  // aprobado | pendiente | rechazado
  const [verificandoPago, setVerificando]   = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    direccion: '', nota: '', notaCadete: '',
  });
  const [geo, setGeo]             = useState(null); // { lat, lng, distanciaKm, direccionFormateada }
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | ok | fuera_rango | error
  const [geoErrorMsg, setGeoErrorMsg] = useState('');

  const costoEnvio    = entrega === 'delivery' && geoStatus === 'ok' ? COSTO_ENVIO : 0;
  const totalConEnvio = totalPrecio + costoEnvio;

  // Detectar retorno desde Mercado Pago
  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const mpStatus    = params.get('mp_status');
    if (!mpStatus) return;

    const pedidoParam = params.get('pedido') || params.get('external_reference');
    // MP agrega payment_id (o collection_id) al volver al sitio
    const paymentId   = params.get('payment_id') || params.get('collection_id');

    window.history.replaceState({}, '', '/carrito');
    setMetodoPago('mercadopago');

    if (mpStatus === 'failure') {
      setPagoEstado('rechazado');
      setMpError('El pago con Mercado Pago no fue aprobado. Podés intentar de nuevo o pagar en efectivo.');
      // Volvemos al paso de datos y pago: ahí es donde se ve el aviso y puede reintentar.
      cargarDatosUsuario();
      setPaso(2);
      // El pedido quedó esperando un pago que nunca llegó: lo damos de baja para
      // que el reintento no deje pedidos fantasma en el panel.
      if (pedidoParam) {
        fetch('/api/cancelar-pedido', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pedidoId: pedidoParam }),
        }).catch(err => console.error('Error al cancelar el pedido sin pagar:', err));
      }
      return;
    }

    clearCart();
    setPedidoId(pedidoParam);
    setPagoEstado(mpStatus === 'approved' ? 'aprobado' : 'pendiente');
    setPaso(3);

    // La URL no es confiable: verificamos el pago contra la API de MP y ahí
    // recién se confirma el pedido en la base.
    if (paymentId && paymentId !== 'null') {
      setVerificando(true);
      fetch('/api/confirmar-pago', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pedidoId: pedidoParam, paymentId }),
      })
        .then(res => res.json())
        .then(json => { if (json.estadoPago) setPagoEstado(json.estadoPago); })
        .catch(err => console.error('Error al verificar el pago:', err))
        .finally(() => setVerificando(false));
    }
  }, []);

  const handleFormChange = e => {
    setMpError(null);
    if (e.target.name === 'direccion') {
      setGeo(null);
      setGeoStatus('idle');
      setGeoErrorMsg('');
    }
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Geocodifica la dirección y calcula si está dentro del radio de reparto.
  const verificarDireccion = async () => {
    if (!form.direccion.trim()) return;
    setGeoStatus('loading');
    setGeoErrorMsg('');
    try {
      const res = await fetch('/api/geocodificar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion: form.direccion }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setGeo(null);
        setGeoStatus('error');
        setGeoErrorMsg(data.error || 'No pudimos verificar la dirección.');
        return;
      }
      const distanciaKm = distanciaDesdeLocal(data.lat, data.lng);
      setGeo({ lat: data.lat, lng: data.lng, distanciaKm, direccionFormateada: data.direccionFormateada });
      setGeoStatus(distanciaKm > RADIO_MAXIMO_KM ? 'fuera_rango' : 'ok');
    } catch (err) {
      console.error('Error al verificar dirección:', err);
      setGeo(null);
      setGeoStatus('error');
      setGeoErrorMsg('No pudimos verificar la dirección. Probá de nuevo.');
    }
  };

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

  // Crea el pedido en Supabase y devuelve el objeto pedido
  const crearPedidoEnDB = async (estado = 'pendiente') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .insert([{
        cliente_id:        user?.id || null,
        estado,
        forma_entrega:     entrega,
        forma_pago:        metodoPago,
        direccion_entrega: entrega === 'delivery' ? form.direccion : null,
        direccion_lat:     entrega === 'delivery' ? geo?.lat ?? null : null,
        direccion_lng:     entrega === 'delivery' ? geo?.lng ?? null : null,
        distancia_km:      entrega === 'delivery' ? geo?.distanciaKm ?? null : null,
        costo_envio:       costoEnvio,
        total:             totalConEnvio,
        observaciones:     form.nota || null,
        nota_cadete:       entrega === 'delivery' ? (form.notaCadete || null) : null,
        nombre_cliente:    `${form.nombre} ${form.apellido}`.trim() || null,
        telefono_cliente:  form.telefono || null,
        email_cliente:     form.email    || null,
      }])
      .select()
      .single();

    if (error) throw error;

    const detalles = items.map(item => ({
      pedido_id:       pedido.id,
      codigo_producto: String(item.codAb || item.id),
      descripcion:     item.nombre,
      cantidad:        item.cantidad,
      precio_unitario: item.precio,
      subtotal:        item.precio * item.cantidad,
    }));

    await supabase.from('detalle_pedidos').insert(detalles);

    return pedido;
  };

  const handleConfirmar = async () => {
    if (entrega === 'delivery' && geoStatus !== 'ok') {
      setMpError('Verificá la dirección de entrega antes de continuar.');
      return;
    }
    setLoading(true);
    setMpError(null);
    try {
      if (metodoPago === 'mercadopago') {
        // Crear pedido con estado 'pendiente_mp' y redirigir a MP
        const pedido = await crearPedidoEnDB('pendiente_mp');

        const res = await fetch('/api/crear-preferencia', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            pedidoId:   pedido.id,
            payerEmail: form.email || null,
          }),
        });

        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || 'Error MP');

        // Redirigir a Mercado Pago (abre la app o web de MP)
        window.location.href = json.init_point;
        return; // no llegar a setLoading(false) para evitar parpadeo
      }

      // Pago no-MP: flujo normal
      const pedido = await crearPedidoEnDB('pendiente');
      setPedidoId(pedido.id);
      clearCart();
      setPaso(3);
    } catch (err) {
      console.error('Error al confirmar pedido:', err);
      if (metodoPago === 'mercadopago') {
        setMpError('No se pudo conectar con Mercado Pago. Verificá tu conexión o elegí pagar en efectivo.');
      } else {
        alert('Hubo un error al procesar tu pedido. Intentá de nuevo.');
      }
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
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            {pagoEstado === 'pendiente' ? '¡Pedido recibido!' : '¡Pedido confirmado!'}
          </h1>
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
          {/* Estado del pago con Mercado Pago */}
          {metodoPago === 'mercadopago' && (
            verificandoPago ? (
              <div className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3 mb-4 text-sm text-gray-500">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Verificando el pago con Mercado Pago...
              </div>
            ) : pagoEstado === 'aprobado' ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-sm font-semibold text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Pago acreditado con Mercado Pago
              </div>
            ) : pagoEstado === 'pendiente' ? (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-4 text-sm text-yellow-800 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Mercado Pago todavía está procesando el pago. Cuando se acredite, el pedido pasa a preparación automáticamente.</span>
              </div>
            ) : null
          )}

          {metodoPago === 'efectivo' && (
            <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-4 text-sm font-semibold text-yellow-800">
              💵 Pagás en efectivo {entrega === 'retiro' ? 'al retirar' : 'al recibir el pedido'}
            </div>
          )}

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
                      <input
                        name="direccion"
                        value={form.direccion}
                        onChange={handleFormChange}
                        onBlur={verificarDireccion}
                        className="input"
                        placeholder="Calle, número, piso/dpto"
                        required
                      />
                      {geoStatus === 'loading' && (
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          Verificando dirección...
                        </p>
                      )}
                      {geoStatus === 'ok' && geo && (
                        <div className="mt-1.5">
                          <p className="text-xs text-green-600 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            Llegamos hasta ahí ({geo.distanciaKm.toFixed(1)} km del local) — envío {formatPrecio(COSTO_ENVIO)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 ml-5">¿Es correcta? {geo.direccionFormateada}</p>
                        </div>
                      )}
                      {geoStatus === 'fuera_rango' && geo && (
                        <div className="mt-1.5">
                          <p className="text-xs text-red-600 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            Esa dirección está a {geo.distanciaKm.toFixed(1)} km del local, fuera de nuestro radio de reparto ({RADIO_MAXIMO_KM} km). Elegí "Retiro en el local" o probá con otra dirección.
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 ml-5">Interpretamos: {geo.direccionFormateada}</p>
                        </div>
                      )}
                      {geoStatus === 'error' && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {geoErrorMsg}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nota para el local</label>
                    <textarea name="nota" value={form.nota} onChange={handleFormChange} className="input resize-none" rows={2} placeholder="Ej: sin cebolla, sin tacc..." />
                  </div>

                  {/* Nota para el cadete — solo en delivery */}
                  {entrega === 'delivery' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        🛵 Indicaciones para el cadete
                      </label>
                      <textarea
                        name="notaCadete"
                        value={form.notaCadete}
                        onChange={handleFormChange}
                        className="input resize-none"
                        rows={3}
                        placeholder="Ej: timbre roto, tocar bocina / portón verde, segunda casa desde la esquina / departamento 3B, timbre 'García'"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Ayudá al cadete a encontrar tu dirección: color del portón, si el timbre funciona, referencia de la casa, etc.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pago */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Método de pago</h2>
                <div className="space-y-3">
                  {METODOS_PAGO.map(m => (
                    <button key={m.id} onClick={() => { setMetodoPago(m.id); setMpError(null); }}
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

                {/* Aviso MP error */}
                {mpError && (
                  <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{mpError}</span>
                  </div>
                )}
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
                <span className={entrega === 'retiro' || geoStatus === 'ok' ? 'text-green-600 font-medium' : 'text-gray-400 font-medium'}>
                  {entrega === 'retiro'
                    ? 'Gratis'
                    : geoStatus === 'ok'
                      ? formatPrecio(COSTO_ENVIO)
                      : 'A verificar'}
                </span>
              </div>
              <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-brand-purple-800">{formatPrecio(totalConEnvio)}</span>
              </div>
            </div>

            {paso === 1 ? (
              <button onClick={irAPaso2} className="btn-primary w-full justify-center">
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleConfirmar}
                disabled={!form.nombre || !form.telefono || loading || (entrega === 'delivery' && geoStatus !== 'ok')}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" />
                    {metodoPago === 'mercadopago' ? 'Abriendo Mercado Pago...' : 'Procesando...'}
                  </span>
                ) : (
                  metodoPago === 'mercadopago'
                    ? <>Pagar con Mercado Pago <ArrowRight className="w-4 h-4" /></>
                    : <>Confirmar pedido <CheckCircle2 className="w-4 h-4" /></>
                )}
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
