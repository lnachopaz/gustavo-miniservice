import Link from 'next/link';
import { productosDestacados, productosEnOferta } from '@/data/mockData';
import ProductCard from '@/components/catalog/ProductCard';

export default function FeaturedProducts() {
  return (
    <>
      {/* Ofertas */}
      <section className="py-10 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container-max">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-red-500 text-sm font-semibold uppercase tracking-wider">🔥 Precio especial</span>
              <h2 className="section-title">Ofertas del día</h2>
            </div>
            <Link href="/catalogo?cat=ofertas" className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productosEnOferta.slice(0, 5).map(p => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="py-10">
        <div className="container-max">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-brand-purple-600 text-sm font-semibold uppercase tracking-wider">⭐ Lo más pedido</span>
              <h2 className="section-title">Productos destacados</h2>
            </div>
            <Link href="/catalogo" className="text-brand-purple-700 hover:text-brand-purple-900 text-sm font-medium transition-colors">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productosDestacados.slice(0, 5).map(p => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
