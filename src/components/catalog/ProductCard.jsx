'use client';

import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrecio } from '@/data/mockData';

export default function ProductCard({ producto }) {
  const { addItem } = useCart();

  const descuento = producto.precioAnterior
    ? Math.round((1 - producto.precio / producto.precioAnterior) * 100)
    : null;

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

        {/* Stock bajo */}
        {producto.stock <= 5 && (
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
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-brand-purple-800 font-black text-lg leading-none">
              {formatPrecio(producto.precio)}
            </p>
            {producto.precioAnterior && (
              <p className="text-gray-400 text-xs line-through mt-0.5">
                {formatPrecio(producto.precioAnterior)}
              </p>
            )}
          </div>

          <button
            onClick={() => addItem(producto)}
            disabled={producto.stock === 0}
            className="bg-brand-purple-800 hover:bg-brand-purple-900 disabled:bg-gray-300 text-brand-yellow-400 p-2 rounded-xl transition-all duration-200 active:scale-95 flex-shrink-0"
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
