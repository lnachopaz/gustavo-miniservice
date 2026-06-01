import Link from 'next/link';
import { Store, MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-purple-900 text-white mt-16">
      {/* Main footer */}
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brand-yellow-400 rounded-xl p-1.5">
                <Store className="w-6 h-6 text-brand-purple-900" />
              </div>
              <div>
                <span className="block text-brand-yellow-400 font-black text-xl">Gustavo 1°</span>
                <span className="block text-brand-purple-300 text-xs">Miniservice</span>
              </div>
            </div>
            <p className="text-brand-purple-300 text-sm leading-relaxed">
              Tu miniservice de confianza. Comestibles, bebidas, rotisería, lácteos y artículos de limpieza.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="bg-brand-purple-700 hover:bg-brand-purple-600 p-2 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-brand-yellow-400" />
              </a>
              <a
                href="#"
                className="bg-brand-purple-700 hover:bg-brand-purple-600 p-2 rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-brand-yellow-400" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-brand-yellow-400 font-semibold mb-4 text-sm uppercase tracking-wider">Categorías</h3>
            <ul className="space-y-2">
              {['Panadería', 'Comestibles', 'Lácteos', 'Bebidas', 'Art. de Limpieza', 'Rotisería'].map(cat => (
                <li key={cat}>
                  <Link
                    href={`/catalogo?cat=${cat.toLowerCase().replace(/ /g, '-').replace(/\./g, '')}`}
                    className="text-brand-purple-300 hover:text-brand-yellow-400 text-sm transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-brand-yellow-400 font-semibold mb-4 text-sm uppercase tracking-wider">Información</h3>
            <ul className="space-y-2">
              {[
                { href: '/catalogo', label: 'Ver todos los productos' },
                { href: '/catalogo?cat=ofertas', label: 'Ofertas del día' },
                { href: '/como-comprar', label: 'Cómo comprar' },
                { href: '/envios', label: 'Envíos y retiro' },
                { href: '/pagos', label: 'Métodos de pago' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-brand-purple-300 hover:text-brand-yellow-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-brand-yellow-400 font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-brand-purple-300 text-sm">
                  Dirección del local<br/>Ciudad, Provincia
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-yellow-400 flex-shrink-0" />
                <a href="tel:+54911XXXXXXXX" className="text-brand-purple-300 hover:text-brand-yellow-400 text-sm transition-colors">
                  +54 9 11 XXXX-XXXX
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-brand-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-brand-purple-300 text-sm">
                  <p>Lun–Sáb: 8:00 – 21:00</p>
                  <p>Dom: 9:00 – 14:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment methods bar */}
      <div className="border-t border-brand-purple-700 py-4">
        <div className="container-max">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-brand-purple-400">
              © {new Date().getFullYear()} Gustavo 1°. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-3 text-brand-purple-300">
              <span className="text-xs">Aceptamos:</span>
              <span className="bg-brand-purple-700 px-2 py-0.5 rounded text-xs font-medium">Mercado Pago</span>
              <span className="bg-brand-purple-700 px-2 py-0.5 rounded text-xs font-medium">Tarjetas</span>
              <span className="bg-brand-purple-700 px-2 py-0.5 rounded text-xs font-medium">Efectivo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
