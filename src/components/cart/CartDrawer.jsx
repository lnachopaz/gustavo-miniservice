'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrecio } from '@/data/mockData';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateCantidad, totalPrecio, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col slide-in-right">

        {/* Header */}
        <div className="bg-brand-purple-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-yellow-400" />
            <h2 className="text-brand-yellow-400 font-bold text-lg">
              Mi Carrito {totalItems > 0 && <span className="text-brand-purple-200 font-normal text-sm">({totalItems} items)</span>}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="text-brand-purple-200 hover:text-brand-yellow-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm mt-1">Agregá productos para comenzar</p>
              <button
                onClick={closeCart}
                className="mt-6 btn-primary text-sm"
              >
                Ver productos
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                {/* Imagen */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium text-sm truncate">{item.nombre}</p>
                  <p className="text-brand-purple-700 font-bold text-sm mt-0.5">
                    {formatPrecio(item.precio)} c/u
                  </p>

                  {/* Cantidad */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                      className="w-6 h-6 rounded-full bg-brand-purple-100 hover:bg-brand-purple-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 text-brand-purple-800" />
                    </button>
                    <span className="text-gray-900 font-semibold text-sm w-6 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                      className="w-6 h-6 rounded-full bg-brand-purple-100 hover:bg-brand-purple-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3 text-brand-purple-800" />
                    </button>
                  </div>
                </div>

                {/* Precio total + eliminar */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="text-gray-900 font-bold text-sm">
                    {formatPrecio(item.precio * item.cantidad)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-brand-purple-800 font-black text-xl">
                {formatPrecio(totalPrecio)}
              </span>
            </div>
            <Link
              href="/carrito"
              onClick={closeCart}
              className="btn-primary w-full justify-center text-sm"
            >
              Finalizar pedido
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
