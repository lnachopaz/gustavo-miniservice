import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { CreditCard, Truck, Store, Shield } from 'lucide-react';

export default function HomePage() {
  const beneficios = [
    {
      icon: <Truck className="w-7 h-7" />,
      titulo: 'Envío a domicilio',
      desc: 'Llegamos a tu puerta el mismo día en zonas cercanas.',
    },
    {
      icon: <Store className="w-7 h-7" />,
      titulo: 'Retiro en local',
      desc: 'Hacé tu pedido y retiralo sin esperas en el local.',
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      titulo: 'Múltiples pagos',
      desc: 'Mercado Pago, tarjetas, transferencia o efectivo.',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      titulo: 'Compra segura',
      desc: 'Garantizamos la calidad de todos nuestros productos.',
    },
  ];

  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />

      {/* Banner de beneficios */}
      <section className="py-12 bg-brand-purple-800">
        <div className="container-max">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="bg-brand-yellow-400/20 text-brand-yellow-400 p-3 rounded-2xl">
                  {b.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{b.titulo}</p>
                  <p className="text-brand-purple-300 text-xs mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-brand-yellow-400 to-brand-yellow-300">
        <div className="container-max text-center">
          <h2 className="text-3xl md:text-4xl font-black text-brand-purple-900 mb-3">
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-brand-purple-800 text-lg mb-8 max-w-xl mx-auto">
            Más de 100 productos disponibles. Entrega rápida o retiro en el local.
          </p>
          <a href="/catalogo" className="inline-flex items-center gap-2 bg-brand-purple-800 hover:bg-brand-purple-900 text-brand-yellow-400 font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95">
            Ver todos los productos →
          </a>
        </div>
      </section>
    </>
  );
}
