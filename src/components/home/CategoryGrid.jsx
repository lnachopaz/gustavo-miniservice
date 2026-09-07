import Link from 'next/link';
import { categorias } from '@/data/mockData';

export default function CategoryGrid() {
  return (
    <section className="py-10">
      <div className="container-max">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Categorías</h2>
          <Link href="/catalogo" className="text-brand-purple-700 hover:text-brand-purple-900 text-sm font-medium flex items-center gap-1 transition-colors">
            Ver todo →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categorias.map(cat => (
            <Link
              key={cat.id}
              href={`/catalogo?cat=${cat.slug}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-purple-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                {cat.emoji}
              </span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
