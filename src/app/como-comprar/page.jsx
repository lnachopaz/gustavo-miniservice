import Link from 'next/link';
import { ShoppingCart, CreditCard, Package, Bike, Store, CheckCircle2, ArrowRight } from 'lucide-react';

const pasos = [
  {
    numero: '01',
    icon: ShoppingCart,
    titulo: 'Elegí tus productos',
    desc: 'Navegá por el catálogo, filtrá por categoría o buscá lo que necesitás. Hacé clic en el carrito para agregar productos.',
    color: 'bg-brand-purple-100 text-brand-purple-700',
  },
  {
    numero: '02',
    icon: Package,
    titulo: 'Revisá tu carrito',
    desc: 'Verificá los productos, las cantidades y el total. Podés modificar o eliminar items antes de continuar.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    numero: '03',
    icon: Package,
    titulo: 'Completá tus datos',
    desc: 'Ingresá tu nombre, teléfono y dirección de entrega (si pedís delivery). Si ya tenés cuenta, se pre-completan solos.',
    color: 'bg-green-100 text-green-700',
  },
  {
    numero: '04',
    icon: CreditCard,
    titulo: 'Elegí cómo pagar',
    desc: 'Mercado Pago (pagás online y el pedido se confirma solo) o efectivo al retirar o recibir.',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    numero: '05',
    icon: CheckCircle2,
    titulo: '¡Confirmado!',
    desc: 'Recibís confirmación del pedido. Te avisamos por WhatsApp cuando esté listo para retiro o en camino.',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

export default function ComoComprarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-brand-purple-800 text-white py-14">
        <div className="container-max text-center">
          <h1 className="text-4xl font-black text-brand-yellow-400 mb-3">¿Cómo comprar?</h1>
          <p className="text-brand-purple-200 text-lg max-w-xl mx-auto">
            Hacer tu pedido es muy fácil. En menos de 5 minutos lo tenés listo.
          </p>
        </div>
      </div>

      {/* Pasos */}
      <div className="container-max py-14 max-w-3xl mx-auto">
        <div className="space-y-6">
          {pasos.map((paso, i) => {
            const Icon = paso.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-5 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paso.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 tracking-widest">PASO {paso.numero}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">{paso.titulo}</h3>
                  <p className="text-gray-600 leading-relaxed">{paso.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métodos de entrega */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <div className="bg-brand-purple-800 text-white rounded-2xl p-6">
            <Store className="w-8 h-8 text-brand-yellow-400 mb-3" />
            <h3 className="font-black text-lg mb-2">Retiro en el local</h3>
            <p className="text-brand-purple-200 text-sm leading-relaxed">
              Sin costo adicional. Te avisamos cuando el pedido está listo. Pasás, mostrás el número de pedido y retirás.
            </p>
            <p className="mt-3 text-brand-yellow-400 text-sm font-semibold">Lun–Sáb 8:00 – 21:00 · Dom 9:00 – 14:00</p>
          </div>
          <div className="bg-brand-yellow-400 text-brand-purple-900 rounded-2xl p-6">
            <Bike className="w-8 h-8 mb-3" />
            <h3 className="font-black text-lg mb-2">Delivery a domicilio</h3>
            <p className="text-brand-purple-800 text-sm leading-relaxed">
              Hacemos entregas en zonas cercanas al local. El costo de envío se coordina por WhatsApp según la distancia.
            </p>
            <p className="mt-3 text-brand-purple-700 text-sm font-semibold">Consultá disponibilidad en tu zona</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link href="/catalogo" className="btn-primary text-base justify-center">
            Ver productos
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-gray-500 text-sm">
            ¿Tenés dudas? Escribinos por WhatsApp y te ayudamos.
          </p>
        </div>
      </div>
    </div>
  );
}
