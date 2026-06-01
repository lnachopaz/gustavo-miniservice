'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Search, X, ChevronDown, Tag, LayoutGrid } from 'lucide-react';
import { productos, categorias, formatPrecio } from '@/data/mockData';
import ProductCard from '@/components/catalog/ProductCard';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat') || '';

  const [busqueda, setBusqueda]         = useState('');
  const [catSeleccionada, setCat]       = useState(catParam === 'ofertas' ? '' : catParam);
  const [orden, setOrden]               = useState('destacados');
  const [soloOfertas, setSoloOfertas]   = useState(catParam === 'ofertas');

  const productosFiltrados = useMemo(() => {
    let lista = [...productos];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      );
    }

    if (catSeleccionada) {
      const cat = categorias.find(c => c.slug === catSeleccionada);
      if (cat) lista = lista.filter(p => p.categoriaId === cat.id);
    }

    if (soloOfertas) lista = lista.filter(p => p.oferta);

    switch (orden) {
      case 'precio-asc':  lista.sort((a, b) => a.precio - b.precio);  break;
      case 'precio-desc': lista.sort((a, b) => b.precio - a.precio);  break;
      case 'nombre':      lista.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
      default:            lista.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    }

    return lista;
  }, [busqueda, catSeleccionada, soloOfertas, orden]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setCat('');
    setSoloOfertas(false);
    setOrden('destacados');
  };

  const tituloActual = soloOfertas
    ? '🔥 Ofertas del día'
    : catSeleccionada
      ? (categorias.find(c => c.slug === catSeleccionada)?.emoji + ' ' +
         categorias.find(c => c.slug === catSeleccionada)?.nombre)
      : '🛒 Todos los productos';

  return (
    <div className="container-max py-6">
      <div className="flex gap-6">

        {/* ════════════════════════════════
            SIDEBAR — siempre visible
            ════════════════════════════════ */}
        <aside className="hidden md:flex flex-col gap-2 w-56 flex-shrink-0">

          {/* Todas */}
          <button
            onClick={() => { setCat(''); setSoloOfertas(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left w-full ${
              !catSeleccionada && !soloOfertas
                ? 'bg-brand-purple-800 text-brand-yellow-400 shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
            Todos los productos
          </button>

          {/* Ofertas */}
          <button
            onClick={() => { setSoloOfertas(true); setCat(''); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left w-full ${
              soloOfertas
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <Tag className="w-4 h-4 flex-shrink-0" />
            Ofertas del día
          </button>

          {/* Divisor */}
          <div className="h-px bg-gray-200 my-1" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">
            Categorías
          </p>

          {/* Categorías */}
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCat(cat.slug); setSoloOfertas(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                catSeleccionada === cat.slug
                  ? 'bg-brand-purple-100 text-brand-purple-800 font-semibold border border-brand-purple-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              <span className="truncate">{cat.nombre}</span>
              {catSeleccionada === cat.slug && (
                <span className="ml-auto text-xs bg-brand-purple-200 text-brand-purple-800 rounded-full px-1.5 py-0.5 font-bold">
                  {productos.filter(p => p.categoriaId === cat.id).length}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* ════════════════════════════════
            CONTENIDO PRINCIPAL
            ════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* Header con título */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl font-black text-gray-900">{tituloActual}</h1>
              <p className="text-gray-400 text-sm">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Orden — desktop */}
            <div className="relative hidden sm:block flex-shrink-0">
              <select
                value={orden}
                onChange={e => setOrden(e.target.value)}
                className="appearance-none border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple-400 cursor-pointer"
              >
                <option value="destacados">Destacados</option>
                <option value="precio-asc">Precio ↑</option>
                <option value="precio-desc">Precio ↓</option>
                <option value="nombre">A–Z</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en esta sección..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple-400 focus:border-transparent transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categorías mobile — scroll horizontal */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => { setCat(''); setSoloOfertas(false); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !catSeleccionada && !soloOfertas
                  ? 'bg-brand-purple-800 text-brand-yellow-400'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setSoloOfertas(true); setCat(''); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                soloOfertas ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🔥 Ofertas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCat(cat.slug); setSoloOfertas(false); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  catSeleccionada === cat.slug
                    ? 'bg-brand-purple-800 text-brand-yellow-400'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.emoji} {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grid productos */}
          {productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
              {productosFiltrados.map(p => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="text-6xl">😕</span>
              <p className="text-gray-500 font-medium mt-4">No encontramos productos</p>
              <button onClick={limpiarFiltros} className="mt-4 btn-primary text-sm">
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="container-max py-8 text-center text-gray-400">Cargando productos...</div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
