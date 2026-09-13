'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { buscarProductosAutocompletado, formatPrecio } from '@/lib/productos';

// Buscador con sugerencias en vivo. Se usa tanto en la barra de escritorio
// como en el menú mobile del Navbar (variant cambia solo el padding/tamaño).
export default function BuscadorProductos({ variant = 'desktop', onNavigate }) {
  const [q, setQ]                 = useState('');
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto]     = useState(false);
  const [buscando, setBuscando]   = useState(false);
  const router  = useRouter();
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResultados([]);
      setAbierto(false);
      return;
    }
    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      const data = await buscarProductosAutocompletado(q);
      setResultados(data);
      setAbierto(true);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  useEffect(() => {
    const onClickFuera = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  const irACatalogo = () => {
    if (!q.trim()) return;
    setAbierto(false);
    router.push(`/catalogo?q=${encodeURIComponent(q.trim())}`);
    onNavigate?.();
  };

  const irAProducto = id => {
    setAbierto(false);
    setQ('');
    router.push(`/producto/${id}`);
    onNavigate?.();
  };

  const inputClass = variant === 'mobile'
    ? 'w-full pl-10 pr-9 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none'
    : 'w-full pl-10 pr-9 py-2 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow-400 placeholder-gray-400';

  return (
    <div className="relative w-full" ref={wrapRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar productos..."
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => { if (resultados.length) setAbierto(true); }}
        onKeyDown={e => {
          if (e.key === 'Enter') irACatalogo();
          if (e.key === 'Escape') setAbierto(false);
        }}
        className={inputClass}
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(''); setResultados([]); setAbierto(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {buscando ? (
            <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
          ) : resultados.length > 0 ? (
            <>
              {resultados.map(p => (
                <button
                  key={p.id}
                  onClick={() => irAProducto(p.id)}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                >
                  <img src={p.imagen} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                    <p className="text-xs text-brand-purple-700 font-semibold">{formatPrecio(p.precio)}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={irACatalogo}
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-brand-purple-700 hover:bg-brand-purple-50 border-t border-gray-100"
              >
                Ver todos los resultados para &quot;{q}&quot;
              </button>
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400">No encontramos productos para &quot;{q}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}
