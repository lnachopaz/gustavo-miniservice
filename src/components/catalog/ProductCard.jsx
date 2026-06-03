'use client';

import Link from 'next/link';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrecio } from '@/lib/productos';

export default function ProductCard({ producto }) {
  const { addItem, updateCantidad, items } = useCart();

  const cartItem = items.find(i => i.id === producto.id);
  const cantidad = cartItem?.cantidad || 0;

  const descuento = producto.precioAnterior
    ? Math.round((1 - producto.precio / producto.precioAnterior) * 100)
    : null;

  const sinStock = producto.stock <= 0;

  return (
    <div className="card group flex flex-col overflow-hidden">
      {/* Imagen */}
      <Link href={`/producto/${producto.id}`} className="relative block overflow-hidden bg-gray-50 aspect-square">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {producto.oferta && descuento && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{descuento}%
            </span>
          )}
          {producto.destacado && !producto.oferta && (
            <span className="badge-purple text-[10px]">⭐ Destacado</span>
          )}
        </div>

        {/* Stock bajo — solo si es Uni y queda entre 1 y 4 */}
        {producto.stock > 0 && producto.stock < 5 &&
         (producto.unidad || '').toLowerCase() === 'uni' && (
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas unidades!
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-brand-purple-600 mb-1">{producto.categoria}</span>

        <Link href={`/producto/${producto.id}`} className="flex-1">
          <h3 className="text-gray-900 font-semibold text-sm leading-snug hover:text-brand-purple-700 transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
        </Link>

        {/* Precio */}
        <div className="mt-1">
          <p className="text-brand-purple-800 font-black text-lg leading-none">
            {formatPrecio(producto.precio)}
          </p>
          {producto.precioAnterior && (
            <p className="text-gray-400 text-xs line-through mt-0.5">
              {formatPrecio(producto.precioAnterior)}
            </p>
          )}
        </div>

        {/* Controles del carrito */}
        <div className="mt-3">
          {sinStock ? (
            <div className="w-full text-center text-xs text-gray-400 font-medium py-2.5 bg-gray-50 rounded-xl">
              Sin stock
            </div>
          ) : cantidad === 0 ? (
            <button
              onClick={() => addItem(producto)}
              className="w-full flex items-center justify-center gap-2 bg-brand-purple-800 hover:bg-brand-purple-900 text-brand-yellow-400 font-bold text-sm py-3 rounded-xl transition-all duration-200 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar
            </button>
          ) : (
            <div className="flex items-center justify-between bg-brand-purple-800 rounded-xl overflow-hidden">
              <button
                onClick={() => updateCantidad(producto.id, cantidad - 1)}
                className="text-brand-yellow-400 hover:bg-brand-purple-900 w-12 h-12 flex items-center justify-center transition-colors active:bg-brand-purple-900 flex-shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-black text-base flex-1 text-center">
                {cantidad}
              </span>
              <button
                onClick={() => addItem(producto)}
                className="text-brand-yellow-400 hover:bg-brand-purple-900 w-12 h-12 flex items-center justify-center transition-colors active:bg-brand-purple-900 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
