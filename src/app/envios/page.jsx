import Link from 'next/link';
import { Truck, Store, Clock, MapPin, Phone, CheckCircle2 } from 'lucide-react';

export default function EnviosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-purple-800 text-white py-14">
        <div className="container-max text-center">
          <h1 className="text-4xl font-black text-brand-yellow-400 mb-3">Envíos y retiro</h1>
          <p className="text-brand-purple-200 text-lg max-w-xl mx-auto">
            Elegí la opción que más te convenga para recibir tu pedido.
          </p>
        </div>
      </div>

      <div className="container-max py-14 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-12">

          {/* Retiro en local */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-brand-purple-100 text-brand-purple-700 rounded-2xl flex items-center justify-center mb-5">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Retiro en el local</h2>
            <div className="space-y-3 mb-6">
              {[
                'Sin costo adicional',
                'Pedido listo en 30-60 minutos',
                'Te avisamos por WhatsApp cuando está',
                'Mostrás el número de pedido y retirás',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-brand-purple-50 rounded-2xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <Clock className="w-4 h-4 text-brand-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-brand-purple-800">Horarios de atención</p>
                  <p className="text-sm text-brand-purple-600">Lunes a Sábado: 8:00 – 21:00</p>
                  <p className="text-sm text-brand-purple-600">Domingo: 9:00 – 14:00</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-brand-purple-800">Dirección</p>
                  <p className="text-sm text-brand-purple-600">Dirección del local, Ciudad</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-brand-yellow-100 text-brand-yellow-700 rounded-2xl flex items-center justify-center mb-5">
              <Truck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Delivery a domicilio</h2>
            <div className="space-y-3 mb-6">
              {[
                'Entrega en zonas cercanas al local',
                'Costo según distancia (se coordina por WhatsApp)',
                'Estimado de entrega: 30-90 minutos',
                'El cadete cobra al momento de la entrega',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-brand-yellow-50 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-brand-yellow-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-brand-yellow-800">Consultá tu zona</p>
                  <p className="text-sm text-brand-yellow-700">Escribinos por WhatsApp antes de hacer el pedido para confirmar que llegamos a tu dirección.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preguntas frecuentes */}
        <h2 className="text-2xl font-black text-gray-900 mb-5">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuánto tarda en llegar mi pedido?', a: 'El retiro en local demora entre 30 y 60 minutos. El delivery depende de la distancia, generalmente entre 30 y 90 minutos.' },
            { q: '¿Hacen envíos fuera de la zona?', a: 'Por ahora solo hacemos delivery en zonas cercanas al local. Consultanos por WhatsApp si tenés dudas sobre tu dirección.' },
            { q: '¿Qué pasa si no estoy cuando llega el pedido?', a: 'El cadete te va a llamar antes de llegar. Si no contestás, va a esperar unos minutos. Te recomendamos estar disponible en el horario del pedido.' },
            { q: '¿Puedo cambiar la dirección después de hacer el pedido?', a: 'Sí, mientras el pedido no haya salido para entrega. Escribinos por WhatsApp lo antes posible.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/catalogo" className="btn-primary justify-center">Ver productos</Link>
        </div>
      </div>
    </div>
  );
}
