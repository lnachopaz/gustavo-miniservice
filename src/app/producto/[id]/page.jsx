'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, ArrowLeft, Package, Truck, Store } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getProductos, formatPrecio } from '@/lib/productos';
import ProductCard from '@/components/catalog/ProductCard';

export default function ProductoPage() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [producto, setProducto]     = useState(null);
  const [relacionados, setRelac]    = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [cantidad, setCantidad]     = useState(1);
  const [agregado, setAgregado]     = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const todos = await getProductos();
      const p = todos.find(x => String(x.id) === String(id));
      setProducto(p || null);
      if (p) {
        setRelac(todos.filter(x => x.categoriaId === p.categoriaId && x.id !== p.id).slice(0, 4));
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  const handleAgregar = () => {
    for (let i = 0; i < cantidad; i++) addItem(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  if (cargando) return (
    <div className="container-max py-16 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!producto) return (
    <div className="container-max py-16 text-center">
      <span className="text-6xl">😕</span>
      <p className="text-gray-500 font-medium mt-4">Producto no encontrado</p>
      <Link href="/catalogo" className="mt-4 btn-primary inline-flex">
        <ArrowLeft className="w-4 h-4" />Volver al catálogo
      </Link>
    </div>
  );

  const descuento = producto.precioAnterior
    ? Math.round((1 - producto.precio / producto.precioAnterior) * 100)
    : null;

  return (
    <div className="container-max py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-purple-700 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-brand-purple-700 transition-colors">Productos</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{producto.nombre}</span>
      </nav>

      {/* Producto */}
      <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-10">

        {/* Imagen */}
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
            <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
          </div>
          {producto.oferta && descuento && (
            <div className="absolute top-4 left-4 bg-red-500 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow">
              -{descuento}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="badge-purple text-sm mb-3 inline-flex w-fit">{producto.categoria}</span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{producto.nombre}</h1>
          {producto.codigo && (
            <p className="text-gray-400 text-xs mb-6">Código: {producto.codigo}</p>
          )}

          {/* Precio */}
          <div className="bg-brand-purple-50 rounded-2xl p-4 mb-6">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-brand-purple-800">
                {formatPrecio(producto.precio)}
              </span>
              {producto.precioAnterior && (
                <span className="text-gray-400 text-lg line-through mb-1">
                  {formatPrecio(producto.precioAnterior)}
                </span>
              )}
            </div>
            {descuento && (
              <p className="text-green-600 font-semibold text-sm mt-1">
                ¡Ahorrás {formatPrecio(producto.precioAnterior - producto.precio)}!
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">por {producto.unidad}</p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full ${producto.stock > 5 ? 'bg-green-500' : producto.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${producto.stock > 5 ? 'text-green-700' : producto.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {producto.stock <= 0
                ? 'Sin stock'
                : producto.stock > 0 && producto.stock < 5 && (producto.unidad || '').toLowerCase() === 'uni'
                  ? `¡Últimas ${producto.stock} unidades!`
                  : 'Disponible'}
            </span>
          </div>

          {/* Cantidad */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Cantidad:</span>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all">
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{cantidad}</span>
              <button onClick={() => setCantidad(Math.min(Math.max(producto.stock, 99), cantidad + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all">
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Subtotal: <strong className="text-gray-900">{formatPrecio(producto.precio * cantidad)}</strong>
            </span>
          </div>

          {/* CTAs */}
          <button onClick={handleAgregar} disabled={producto.stock === 0}
            className={`btn-primary text-base justify-center mb-3 ${agregado ? 'bg-green-600' : ''}`}>
            <ShoppingCart className="w-5 h-5" />
            {agregado ? '¡Agregado al carrito!' : 'Agregar al carrito'}
          </button>
          <Link href="/carrito" className="btn-secondary text-base justify-center">
            Comprar ahora
          </Link>

          {/* Info entrega */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-brand-purple-600" />
              <span>Envío a domicilio disponible</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Store className="w-4 h-4 text-brand-purple-600" />
              <span>Retiro gratis en el local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section>
          <h2 className="section-title mb-5">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relacionados.map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
