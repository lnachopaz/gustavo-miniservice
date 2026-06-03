import Link from 'next/link';
import { CreditCard, Banknote, Smartphone, Building2, CheckCircle2, Shield } from 'lucide-react';

const metodos = [
  {
    icon: '💳',
    titulo: 'Mercado Pago',
    subtitulo: 'Recomendado',
    desc: 'Pagá con tu billetera de Mercado Pago, tarjeta de crédito o débito, o mediante código QR.',
    detalles: ['Todas las tarjetas Visa, Mastercard, Amex', 'Cuotas sin interés según banco', 'QR presencial o link de pago', 'Acreditación inmediata'],
    color: 'border-brand-purple-300 bg-brand-purple-50',
    badge: 'bg-brand-purple-700 text-white',
  },
  {
    icon: '🏦',
    titulo: 'Tarjeta de débito',
    subtitulo: 'Online',
    desc: 'Pagá directamente con tu tarjeta de débito. Descuento inmediato de tu cuenta bancaria.',
    detalles: ['Visa Débito', 'Mastercard Débito', 'Cabal Débito', 'Sin costo adicional'],
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-600 text-white',
  },
  {
    icon: '📲',
    titulo: 'Transferencia bancaria',
    subtitulo: 'CVU / CBU / Alias',
    desc: 'Transferí desde tu banco o billetera virtual. Mandá el comprobante por WhatsApp.',
    detalles: ['CVU de Mercado Pago', 'CBU bancario', 'Alias disponible', 'Confirmamos al recibir'],
    color: 'border-green-200 bg-green-50',
    badge: 'bg-green-600 text-white',
  },
  {
    icon: '💵',
    titulo: 'Efectivo',
    subtitulo: 'Al retirar o recibir',
    desc: 'Pagás cuando retirás en el local o cuando llega el cadete a tu domicilio.',
    detalles: ['Sin necesidad de tarjeta', 'Pago al retirar en local', 'Pago al cadete en delivery', 'Tener el monto exacto ayuda'],
    color: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
  },
];

export default function PagosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-purple-800 text-white py-14">
        <div className="container-max text-center">
          <h1 className="text-4xl font-black text-brand-yellow-400 mb-3">Métodos de pago</h1>
          <p className="text-brand-purple-200 text-lg max-w-xl mx-auto">
            Aceptamos múltiples formas de pago para que elijas la que más te convenga.
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

        {/* Seguridad */}
        <div className="bg-brand-purple-800 text-white rounded-3xl p-8 flex gap-6 items-start mb-8">
          <div className="bg-brand-yellow-400/20 p-3 rounded-2xl flex-shrink-0">
            <Shield className="w-8 h-8 text-brand-yellow-400" />
          </div>
          <div>
            <h3 className="font-black text-xl text-brand-yellow-400 mb-2">Tus pagos son seguros</h3>
            <p className="text-brand-purple-200 leading-relaxed">
              Los pagos online se procesan a través de Mercado Pago, la plataforma de pagos más segura de Latinoamérica.
              Nunca guardamos datos de tu tarjeta. Tus datos están protegidos con encriptación SSL.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-black text-gray-900 mb-5">Preguntas frecuentes</h2>
        <div className="space-y-4 mb-10">
          {[
            { q: '¿Puedo pagar en cuotas?', a: 'Sí, con tarjeta de crédito a través de Mercado Pago podés pagar en cuotas. Las cuotas sin interés dependen de tu banco y la promoción vigente.' },
            { q: '¿Es seguro pagar online?', a: 'Totalmente. Usamos Mercado Pago que cumple con todos los estándares de seguridad internacionales (PCI DSS). No guardamos datos de tu tarjeta.' },
            { q: '¿Qué hago si el pago no se acredita?', a: 'Si realizaste la transferencia y el pedido no se confirmó, enviá el comprobante por WhatsApp y lo verificamos en el momento.' },
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
