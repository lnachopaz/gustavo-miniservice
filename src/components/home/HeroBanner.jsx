'use client';

import Link from 'next/link';
import { ArrowRight, Tag, Truck, Clock } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-700 overflow-hidden">
      {/* Decoración fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 left-8 text-9xl">🛒</div>
        <div className="absolute top-4 right-20 text-7xl">🍞</div>
        <div className="absolute bottom-8 left-32 text-6xl">🥤</div>
        <div className="absolute bottom-4 right-8 text-8xl">🧀</div>
      </div>

      <div className="container-max relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 py-16 lg:py-24 items-center">

          {/* Texto */}
          <div className="fade-in">
            <div className="inline-flex items-center gap-2 bg-brand-yellow-400/20 border border-brand-yellow-400/30 text-brand-yellow-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Tag className="w-4 h-4" />
              ¡Ofertas de la semana disponibles!
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              Todo lo que{' '}
              <span className="text-brand-yellow-400">necesitás</span>{' '}
              en un solo lugar
            </h1>

            <p className="text-brand-purple-200 text-lg leading-relaxed mb-8 max-w-lg">
              Panadería fresca, almacén, lácteos, bebidas, limpieza y más.
              Pedí online y recibilo en tu casa o retirá en el local.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-secondary text-base">
                Ver todos los productos
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/catalogo?cat=ofertas" className="btn-outline border-brand-yellow-400 text-brand-yellow-400 hover:bg-brand-yellow-400 hover:text-brand-purple-900 text-base">
                Ver ofertas
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 mt-10">
              <div className="flex items-center gap-2 text-brand-purple-200 text-sm">
                <Truck className="w-5 h-5 text-brand-yellow-400" />
                Envío a domicilio
              </div>
              <div className="flex items-center gap-2 text-brand-purple-200 text-sm">
                <Clock className="w-5 h-5 text-brand-yellow-400" />
                Lun–Sáb 8:00–21:00
              </div>
              <div className="flex items-center gap-2 text-brand-purple-200 text-sm">
                <span className="text-brand-yellow-400 font-bold">$</span>
                Mercado Pago y efectivo
              </div>
            </div>
          </div>

          {/* Imagen/ilustración lado derecho */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative">
              <div className="w-72 h-72 bg-brand-yellow-400/20 rounded-full flex items-center justify-center">
                <div className="w-56 h-56 bg-brand-yellow-400/30 rounded-full flex items-center justify-center">
                  <span className="text-9xl">🛒</span>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -left-8 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
                <span className="text-2xl">🍞</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Panadería fresca</p>
                  <p className="text-xs text-green-600 font-medium">disponible</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-brand-yellow-400 rounded-2xl shadow-xl p-3">
                <p className="text-brand-purple-900 text-xs font-bold">🚚 Delivery</p>
                <p className="text-brand-purple-800 text-xs">en tu zona</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
