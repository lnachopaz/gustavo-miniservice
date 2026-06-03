'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Package, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

// Genera últimos N días
function ultimosDias(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function AdminVentas() {
  const [pedidos, setPedidos]   = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [periodo, setPeriodo]   = useState(30); // días

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const supabase = createClient();
      const desde = new Date();
      desde.setDate(desde.getDate() - periodo);

      const [{ data: peds }, { data: dets }] = await Promise.all([
        supabase
          .from('pedidos')
          .select('id, total, estado, creado_en')
          .neq('estado', 'cancelado')
          .gte('creado_en', desde.toISOString()),
        supabase
          .from('detalle_pedidos')
          .select('descripcion, cantidad, precio_unitario, subtotal, pedido_id'),
      ]);

      setPedidos(peds || []);
      setDetalles(dets || []);
      setLoading(false);
    };
    cargar();
  }, [periodo]);

  // ── Métricas generales ──────────────────────────────────
  const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado');
  const totalIngresos     = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const ticketPromedio    = pedidos.length ? totalIngresos / pedidos.length : 0;

  // ── Ingresos por día ────────────────────────────────────
  const dias = ultimosDias(periodo);
  const ingPorDia = dias.map(dia => ({
    dia,
    label: new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    total: pedidos
      .filter(p => p.creado_en?.slice(0, 10) === dia)
      .reduce((s, p) => s + (p.total || 0), 0),
  }));
  const maxDia = Math.max(...ingPorDia.map(d => d.total), 1);

  // ── Top productos ────────────────────────────────────────
  const porProducto = {};
  detalles.forEach(d => {
    const k = d.descripcion || 'Sin nombre';
    if (!porProducto[k]) porProducto[k] = { cantidad: 0, revenue: 0 };
    porProducto[k].cantidad += d.cantidad || 0;
    porProducto[k].revenue  += d.subtotal || 0;
  });
  const topProductos = Object.entries(porProducto)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);
  const maxRevProd = topProductos[0]?.[1].revenue || 1;

  // ── Por categoría (aproximada por palabras clave) ────────
  const categorias = {
    'Lácteos':          0,
    'Bebidas':          0,
    'Panadería':        0,
    'Limpieza':         0,
    'Congelados':       0,
    'Comestibles':      0,
  };
  const catMatch = (n) => {
    const s = n.toLowerCase();
    if (/leche|yogur|queso|crema|manteca|flan|ricota/.test(s)) return 'Lácteos';
    if (/coca|pepsi|gaseosa|agua|vino|cerveza|fernet|jugo|sidra/.test(s)) return 'Bebidas';
    if (/pan|factura|medialuna|budín|galleta/.test(s)) return 'Panadería';
    if (/detergente|lavandina|jabón|shampoo|esponja|vela|desodorante/.test(s)) return 'Limpieza';
    if (/milanesa|hamburguesa|nugget|helado|congelado/.test(s)) return 'Congelados';
    return 'Comestibles';
  };
  detalles.forEach(d => {
    const cat = catMatch(d.descripcion || '');
    categorias[cat] = (categorias[cat] || 0) + (d.subtotal || 0);
  });
  const catEntries = Object.entries(categorias).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] || 1;
  const totalCat = catEntries.reduce((s, [, v]) => s + v, 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-brand-yellow-400">Análisis de Ventas</h1>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d}
              onClick={() => setPeriodo(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                periodo === d
                  ? 'bg-brand-yellow-400 text-brand-purple-900'
                  : 'text-brand-purple-300 hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Ingresos totales', value: formatPrecio(totalIngresos), icon: DollarSign, color: 'bg-green-100 text-green-700' },
            { label: 'Pedidos',          value: pedidos.length,              icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
            { label: 'Entregados',       value: pedidosEntregados.length,    icon: Package,    color: 'bg-purple-100 text-purple-700' },
            { label: 'Ticket promedio',  value: formatPrecio(ticketPromedio), icon: TrendingUp, color: 'bg-yellow-100 text-yellow-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Gráfico de ingresos por día */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Ingresos por día</h2>
          <p className="text-xs text-gray-400 mb-5">Últimos {periodo} días · solo pedidos no cancelados</p>

          {/* Barras SVG */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(periodo * 28, 300) + 'px' }}>
              <svg viewBox={`0 0 ${Math.max(periodo * 28, 300)} 120`} className="w-full" style={{ height: '120px' }}>
                {ingPorDia.map((d, i) => {
                  const h = d.total > 0 ? Math.max((d.total / maxDia) * 100, 3) : 0;
                  const x = i * 28 + 4;
                  return (
                    <g key={d.dia}>
                      <rect
                        x={x} y={110 - h} width={20} height={h}
                        rx="3"
                        fill={d.total > 0 ? '#6d28d9' : '#e5e7eb'}
                      />
                      {d.total > 0 && (
                        <title>{d.label}: {formatPrecio(d.total)}</title>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Labels cada 5 días */}
              <div className="flex" style={{ marginTop: '4px' }}>
                {ingPorDia.map((d, i) => (
                  <div key={d.dia} style={{ width: '28px', flexShrink: 0 }}>
                    {(i === 0 || i === ingPorDia.length - 1 || i % 7 === 0) && (
                      <p className="text-[9px] text-gray-400 text-center leading-tight">{d.label}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini leyenda */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
            <span>Mín: {formatPrecio(Math.min(...ingPorDia.map(d => d.total).filter(v => v > 0), 0))}</span>
            <span>Máx: {formatPrecio(maxDia)}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top productos por ingreso */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Top 10 productos</h2>
            <p className="text-xs text-gray-400 mb-5">Por ingreso generado</p>
            <div className="space-y-3">
              {topProductos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Sin datos</p>
              ) : topProductos.map(([nombre, data], i) => (
                <div key={nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-gray-400 w-4 flex-shrink-0">#{i + 1}</span>
                      <p className="text-xs text-gray-700 font-medium truncate">{nombre}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3 ml-2">
                      <span className="text-xs text-gray-400">×{data.cantidad}</span>
                      <span className="text-xs font-bold text-gray-900">{formatPrecio(data.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-purple-600"
                      style={{ width: `${(data.revenue / maxRevProd) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por categoría */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Por categoría</h2>
            <p className="text-xs text-gray-400 mb-5">Porcentaje del ingreso total</p>

            {catEntries.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Sin datos</p>
            ) : (
              <>
                {/* Gráfico de barras horizontal */}
                <div className="space-y-4">
                  {catEntries.map(([cat, val]) => {
                    const pct = Math.round((val / totalCat) * 100);
                    const COLORS = {
                      'Lácteos': 'bg-blue-500', 'Bebidas': 'bg-red-500',
                      'Panadería': 'bg-yellow-500', 'Limpieza': 'bg-green-500',
                      'Congelados': 'bg-cyan-500', 'Comestibles': 'bg-purple-500',
                    };
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-xs font-bold text-gray-900">{formatPrecio(val)}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${COLORS[cat] || 'bg-gray-500'}`}
                            style={{ width: `${(val / maxCat) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Donut SVG simple */}
                <div className="flex justify-center mt-6">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {(() => {
                      const COLORS_SVG = ['#8b5cf6','#ef4444','#f59e0b','#22c55e','#06b6d4','#a855f7'];
                      let offset = 0;
                      return catEntries.map(([cat, val], i) => {
                        const pct = (val / totalCat) * 100;
                        const dash = `${pct} ${100 - pct}`;
                        const el = (
                          <circle key={cat}
                            cx="50" cy="50" r="15.915"
                            fill="transparent"
                            stroke={COLORS_SVG[i % COLORS_SVG.length]}
                            strokeWidth="8"
                            strokeDasharray={dash}
                            strokeDashoffset={-offset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                    <circle cx="50" cy="50" r="10" fill="white" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
