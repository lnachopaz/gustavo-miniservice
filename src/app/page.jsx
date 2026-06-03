import { CreditCard, Truck, Store, Shield, ArrowRight, Tag, Star } from 'lucide-react';
import Link from 'next/link';
import { categorias } from '@/data/mockData';
import { getProductosServer as getProductos } from '@/lib/productos-server';
import ProductCard from '@/components/catalog/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';

export const revalidate = 60; // revalidar cada 60 segundos

export default async function HomePage() {
  const productos = await getProductos();
  const destacados = productos.filter(p => p.destacado).slice(0, 6);
  const ofertas    = productos.filter(p => p.oferta).slice(0, 5);

  const beneficios = [
    { icon: <Truck className="w-7 h-7" />,    titulo: 'Envío a domicilio',  desc: 'Llegamos a tu puerta el mismo día en zonas cercanas.' },
    { icon: <Store className="w-7 h-7" />,    titulo: 'Retiro en local',    desc: 'Hacé tu pedido y retiralo sin esperas.' },
    { icon: <CreditCard className="w-7 h-7" />, titulo: 'Múltiples pagos', desc: 'Mercado Pago, tarjetas, transferencia o efectivo.' },
    { icon: <Shield className="w-7 h-7" />,   titulo: 'Compra segura',      desc: 'Garantizamos la calidad de todos nuestros productos.' },
  ];

  return (
    <>
      <HeroBanner />

      {/* Categorías */}
      <section className="py-10">
        <div className="container-max">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Categorías</h2>
            <Link href="/catalogo" className="text-brand-purple-700 hover:text-brand-purple-900 text-sm font-medium transition-colors">Ver todo →</Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categorias.map(cat => (
              <Link key={cat.id} href={`/catalogo?cat=${cat.slug}`}
                className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-brand-purple-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ofertas */}
      {ofertas.length > 0 && (
        <section className="py-10 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="container-max">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 text-sm font-bold uppercase tracking-wider">Precio especial</span>
                </div>
                <h2 className="section-title">Ofertas del día</h2>
              </div>
              <Link href="/catalogo?cat=ofertas" className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">Ver todas →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {ofertas.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Destacados */}
      {destacados.length > 0 && (
        <section className="py-10">
          <div className="container-max">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-brand-purple-600 fill-brand-purple-600" />
                  <span className="text-brand-purple-600 text-sm font-bold uppercase tracking-wider">Lo más pedido</span>
                </div>
                <h2 className="section-title">Productos destacados</h2>
              </div>
              <Link href="/catalogo" className="text-brand-purple-700 hover:text-brand-purple-900 text-sm font-medium transition-colors">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {destacados.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Beneficios */}
      <section className="py-12 bg-brand-purple-800">
        <div className="container-max">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="bg-brand-yellow-400/20 text-brand-yellow-400 p-3 rounded-2xl">{b.icon}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{b.titulo}</p>
                  <p className="text-brand-purple-300 text-xs mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-yellow-400 to-brand-yellow-300">
        <div className="container-max text-center">
          <h2 className="text-3xl md:text-4xl font-black text-brand-purple-900 mb-3">
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-brand-purple-800 text-lg mb-8 max-w-xl mx-auto">
            Más de {productos.length} productos disponibles. Entrega rápida o retiro en el local.
          </p>
          <Link href="/catalogo"
            className="inline-flex items-center gap-2 bg-brand-purple-800 hover:bg-brand-purple-900 text-brand-yellow-400 font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95">
            Ver todos los productos
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
