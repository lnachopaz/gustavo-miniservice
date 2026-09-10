import Link from 'next/link';
import { CheckCircle2, Shield } from 'lucide-react';

const metodos = [
  {
    icon: '💳',
    titulo: 'Mercado Pago',
    subtitulo: 'Online',
    desc: 'Al confirmar el pedido te llevamos a la página de Mercado Pago con el monto exacto ya cargado. Pagás con tu cuenta de MP, con tarjeta o escaneando el QR, y volvés al sitio con el pedido ya confirmado.',
    detalles: [
      'Dinero en cuenta de Mercado Pago',
      'Tarjetas de crédito y débito (con cuotas según tu banco)',
      'El monto va cargado, no lo tenés que escribir',
      'Acreditación inmediata: el pedido se confirma solo',
    ],
    color: 'border-brand-purple-300 bg-brand-purple-50',
    badge: 'bg-brand-purple-700 text-white',
  },
  {
    icon: '💵',
    titulo: 'Efectivo',
    subtitulo: 'Al retirar o recibir',
    desc: 'Hacés el pedido online y pagás en persona: cuando pasás a retirarlo por el local o cuando el cadete te lo lleva a domicilio.',
    detalles: [
      'Sin necesidad de tarjeta ni app',
      'Pago al retirar en el local',
      'Pago al cadete en delivery',
      'Tener el monto justo agiliza la entrega',
    ],
    color: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
  },
];

const pasosMp = [
  { n: '01', t: 'Confirmás el pedido', d: 'Elegís Mercado Pago como método de pago en el carrito.' },
  { n: '02', t: 'Te llevamos a Mercado Pago', d: 'Se abre la página de MP con el detalle y el total de tu compra.' },
  { n: '03', t: 'Pagás', d: 'Con tu saldo de MP, tarjeta o QR, como más te guste.' },
  { n: '04', t: 'Volvés al sitio', d: 'Verificamos el pago con Mercado Pago y el pedido queda confirmado al instante.' },
];

export default function PagosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-purple-800 text-white py-14">
        <div className="container-max text-center">
          <h1 className="text-4xl font-black text-brand-yellow-400 mb-3">Métodos de pago</h1>
          <p className="text-brand-purple-200 text-lg max-w-xl mx-auto">
            Dos formas de pagar, simple y sin vueltas: Mercado Pago online o efectivo al recibir tu pedido.
          </p>
        </div>
      </div>

      <div className="container-max py-14 max-w-4xl mx-auto">

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {metodos.map((m, i) => (
            <div key={i} className={`bg-white rounded-3xl p-6 shadow-sm border-2 ${m.color}`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{m.icon}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.badge}`}>
                  {m.subtitulo}
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">{m.titulo}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{m.desc}</p>
              <div className="space-y-1.5">
                {m.detalles.map((d, j) => (
                  <div key={j} className="flex items-center gap-2 text-gray-600 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cómo funciona el pago con MP */}
        <h2 className="text-2xl font-black text-gray-900 mb-5">Cómo es pagar con Mercado Pago</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {pasosMp.map(p => (
            <div key={p.n} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <span className="text-brand-purple-300 font-black text-2xl">{p.n}</span>
              <h3 className="font-bold text-gray-900 mt-2 mb-1 text-sm">{p.t}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>

        {/* Seguridad */}
        <div className="bg-brand-purple-800 text-white rounded-3xl p-8 flex gap-6 items-start mb-8">
          <div className="bg-brand-yellow-400/20 p-3 rounded-2xl flex-shrink-0">
            <Shield className="w-8 h-8 text-brand-yellow-400" />
          </div>
          <div>
            <h3 className="font-black text-xl text-brand-yellow-400 mb-2">Tus pagos son seguros</h3>
            <p className="text-brand-purple-200 leading-relaxed">
              Los pagos online se procesan íntegramente dentro de Mercado Pago. Nosotros nunca vemos ni
              guardamos los datos de tu tarjeta: sólo recibimos la confirmación de que el pago se acreditó.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-black text-gray-900 mb-5">Preguntas frecuentes</h2>
        <div className="space-y-4 mb-10">
          {[
            { q: '¿Puedo pagar en cuotas?', a: 'Sí, con tarjeta de crédito a través de Mercado Pago podés pagar en cuotas. Las cuotas sin interés dependen de tu banco y de la promoción vigente.' },
            { q: '¿Tengo que tener cuenta en Mercado Pago?', a: 'No es obligatorio. Podés pagar con tu cuenta de MP o directamente con tarjeta de crédito o débito desde la misma pantalla de pago.' },
            { q: '¿Cuándo se confirma mi pedido?', a: 'Con Mercado Pago, apenas se acredita el pago: volvés al sitio y el pedido ya figura confirmado. Si pagás en efectivo, el pedido queda pendiente y lo confirmamos desde el local.' },
            { q: '¿Qué pasa si el pago no se aprueba?', a: 'El pedido queda esperando pago y no se prepara. Podés volver al carrito e intentar de nuevo, o elegir pagar en efectivo al retirar o recibir.' },
            { q: '¿Puedo pagar con tarjeta al cadete?', a: 'No. En el domicilio y en el local sólo se recibe efectivo. Si querés pagar con tarjeta, hacelo online con Mercado Pago.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/catalogo" className="btn-primary justify-center">Ir a comprar</Link>
        </div>
      </div>
    </div>
  );
}
