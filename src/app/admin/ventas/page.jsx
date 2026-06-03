'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, TrendingDown, Package, ShoppingBag,
  DollarSign, BarChart2, Activity, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownRight, Minus, Search, Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/productos';

/* ─── helpers ─────────────────────────────────────────────────── */
function ultimosDias(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function catMatch(n = '') {
  const s = n.toLowerCase();
  if (/leche|yogur|queso|crema|manteca|flan|ricota/.test(s))         return 'Lácteos';
  if (/coca|pepsi|gaseosa|agua|vino|cerveza|fernet|jugo|sidra/.test(s)) return 'Bebidas';
  if (/pan|factura|medialuna|budín|galleta/.test(s))                  return 'Panadería';
  if (/detergente|lavandina|jabón|shampoo|esponja|vela|desodorante/.test(s)) return 'Limpieza';
  if (/milanesa|hamburguesa|nugget|helado|congelado/.test(s))         return 'Congelados';
  return 'Comestibles';
}

const CAT_COLORS = {
  'Lácteos':     '#3b82f6',
  'Bebidas':     '#ef4444',
  'Panadería':   '#f59e0b',
  'Limpieza':    '#22c55e',
  'Congelados':  '#06b6d4',
  'Comestibles': '#8b5cf6',
};

const PAGO_LABELS = {
  mercadopago:   'Mercado Pago',
  tarjeta:       'Tarjeta',
  transferencia: 'Transferencia',
  efectivo:      'Efectivo',
};

/* ─── mini componentes ────────────────────────────────────────── */
function DeltaBadge({ pct }) {
  if (pct === null) return null;
  const up = pct > 0, flat = pct === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
      flat ? 'bg-gray-100 text-gray-500' : up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      {flat ? <Minus className="w-3 h-3" /> : up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {flat ? '0%' : `${up ? '+' : ''}${pct.toFixed(0)}%`}
    </span>
  );
}

/* ─── página principal ────────────────────────────────────────── */
export default function AdminVentas() {
  const [periodo, setPeriodo]     = useState(30);
  const [pedidos, setPedidos]     = useState([]);
  const [pedidosAnt, setPedAnt]   = useState([]);
  const [detalles, setDetalles]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // chart
  const [chartTipo, setChartTipo] = useState('bar');   // 'bar' | 'line'
  const [tooltip, setTooltip]     = useState(null);    // { x, y, label, value }
  const [hovIdx, setHovIdx]       = useState(null);
  const svgRef = useRef(null);

  // productos
  const [prodView, setProdView]   = useState('revenue'); // 'revenue' | 'cantidad'
  const [prodSort, setProdSort]   = useState('revenue');
  const [prodSearch, setProdSearch] = useState('');
  const [catFilter, setCatFilter] = useState(null);     // categoría seleccionada

  // día seleccionado (drilldown)
  const [diaSelec, setDiaSelec]   = useState(null);

  /* ── carga de datos ───────────────────────────────────────── */
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const supabase = createClient();
      const ahora   = new Date();
      const desde   = new Date(ahora); desde.setDate(desde.getDate() - periodo);
      const desdeAnt = new Date(desde); desdeAnt.setDate(desdeAnt.getDate() - periodo);

      const [{ data: peds }, { data: pedsAnt }, { data: dets }] = await Promise.all([
        supabase.from('pedidos').select('id, total, estado, creado_en, forma_pago, forma_entrega')
          .neq('estado', 'cancelado').gte('creado_en', desde.toISOString()),
        supabase.from('pedidos').select('total, estado')
          .neq('estado', 'cancelado')
          .gte('creado_en', desdeAnt.toISOString())
          .lt('creado_en', desde.toISOString()),
        supabase.from('detalle_pedidos').select('descripcion, cantidad, precio_unitario, subtotal, pedido_id'),
      ]);

      setPedidos(peds   || []);
      setPedAnt(pedsAnt || []);
      setDetalles(dets  || []);
      setLoading(false);
    };
    cargar();
  }, [periodo]);

  /* ── métricas ──────────────────────────────────────────────── */
  const totalIngresos  = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const totalAnt       = pedidosAnt.reduce((s, p) => s + (p.total || 0), 0);
  const ticketProm     = pedidos.length ? totalIngresos / pedidos.length : 0;
  const ticketPromAnt  = pedidosAnt.length ? totalAnt / pedidosAnt.length : 0;
  const entregados     = pedidos.filter(p => p.estado === 'entregado').length;

  const delta = (cur, ant) => ant === 0 ? null : ((cur - ant) / ant) * 100;

  const CARDS = [
    { label: 'Ingresos totales',  value: formatPrecio(totalIngresos), pct: delta(totalIngresos, totalAnt),   icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Pedidos',           value: pedidos.length,               pct: delta(pedidos.length, pedidosAnt.length), icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: 'Entregados',        value: entregados,                   pct: null,                             icon: Package,    color: 'bg-purple-100 text-purple-700' },
    { label: 'Ticket promedio',   value: formatPrecio(ticketProm),     pct: delta(ticketProm, ticketPromAnt), icon: TrendingUp, color: 'bg-yellow-100 text-yellow-700' },
  ];

  /* ── datos del gráfico ─────────────────────────────────────── */
  const dias = ultimosDias(periodo);
  const ingPorDia = dias.map(dia => ({
    dia,
    label: new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', {
      day: 'numeric', month: 'short'
    }),
    total: pedidos
      .filter(p => p.creado_en?.slice(0, 10) === dia)
      .reduce((s, p) => s + (p.total || 0), 0),
    count: pedidos.filter(p => p.creado_en?.slice(0, 10) === dia).length,
  }));
  const maxDia = Math.max(...ingPorDia.map(d => d.total), 1);

  /* ── productos ──────────────────────────────────────────────── */
  const porProducto = {};
  detalles.forEach(d => {
    const k = d.descripcion || 'Sin nombre';
    const c = catMatch(k);
    if (!porProducto[k]) porProducto[k] = { cantidad: 0, revenue: 0, cat: c };
    porProducto[k].cantidad += d.cantidad || 0;
    porProducto[k].revenue  += d.subtotal || 0;
  });

  const prodFiltrados = Object.entries(porProducto)
    .filter(([nombre, data]) => {
      const matchCat  = !catFilter || data.cat === catFilter;
      const matchText = !prodSearch || nombre.toLowerCase().includes(prodSearch.toLowerCase());
      return matchCat && matchText;
    })
    .sort((a, b) => {
      if (prodSort === 'nombre') return a[0].localeCompare(b[0]);
      return b[1][prodSort] - a[1][prodSort];
    });

  const maxProdVal = Math.max(...prodFiltrados.map(([, d]) => d[prodView]), 1);

  /* ── categorías ─────────────────────────────────────────────── */
  const porCat = {};
  detalles.forEach(d => {
    const c = catMatch(d.descripcion || '');
    if (!porCat[c]) porCat[c] = { revenue: 0, cantidad: 0 };
    porCat[c].revenue  += d.subtotal || 0;
    porCat[c].cantidad += d.cantidad || 0;
  });
  const catEntries = Object.entries(porCat).sort((a, b) => b[1].revenue - a[1].revenue);
  const totalCat   = catEntries.reduce((s, [, v]) => s + v.revenue, 0);

  /* ── métodos de pago / entrega ──────────────────────────────── */
  const porPago = {};
  const porEntrega = { retiro: 0, delivery: 0 };
  pedidos.forEach(p => {
    const mp = p.forma_pago || 'otro';
    porPago[mp] = (porPago[mp] || 0) + (p.total || 0);
    if (p.forma_entrega === 'retiro') porEntrega.retiro += p.total || 0;
    else porEntrega.delivery += p.total || 0;
  });
  const pagoEntries = Object.entries(porPago).sort((a, b) => b[1] - a[1]);
  const maxPago     = Math.max(...pagoEntries.map(([, v]) => v), 1);

  /* ── drilldown día ──────────────────────────────────────────── */
  const pedidosDia = diaSelec
    ? pedidos.filter(p => p.creado_en?.slice(0, 10) === diaSelec)
    : [];

  /* ── SVG eventos ────────────────────────────────────────────── */
  const W = 800, H = 160, PAD = { l: 40, r: 10, t: 10, b: 30 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const handleBarEnter = useCallback((e, d, i) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const box = svgEl.getBoundingClientRect();
    setTooltip({
      x: e.clientX - box.left,
      y: e.clientY - box.top - 60,
      label: d.label, value: d.total, count: d.count,
    });
    setHovIdx(i);
  }, []);

  const handleBarLeave = useCallback(() => {
    setTooltip(null);
    setHovIdx(null);
  }, []);

  // Line chart path
  const linePoints = ingPorDia.map((d, i) => {
    const x = PAD.l + (i / Math.max(ingPorDia.length - 1, 1)) * chartW;
    const y = PAD.t + chartH - (d.total / maxDia) * chartH;
    return `${x},${y}`;
  }).join(' ');

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-brand-yellow-400 leading-none">Análisis de Ventas</h1>
            <p className="text-brand-purple-300 text-xs mt-0.5">vs. período anterior de igual duración</p>
          </div>
        </div>
        {/* Selector de período */}
        <div className="flex items-center gap-1 bg-brand-purple-800 rounded-xl p-1">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => { setPeriodo(d); setDiaSelec(null); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                periodo === d
                  ? 'bg-brand-yellow-400 text-brand-purple-900'
                  : 'text-brand-purple-300 hover:text-white'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-4 h-4" />
                </div>
                <DeltaBadge pct={c.pct} />
              </div>
              <p className="text-2xl font-black text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Gráfico de ingresos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Ingresos por día</h2>
              <p className="text-xs text-gray-400">Clic en una barra para ver detalle del día</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setChartTipo('bar')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  chartTipo === 'bar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}>
                <BarChart2 className="w-3 h-3" /> Barras
              </button>
              <button onClick={() => setChartTipo('line')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  chartTipo === 'line' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}>
                <Activity className="w-3 h-3" /> Línea
              </button>
            </div>
          </div>

          {/* SVG chart */}
          <div className="relative overflow-x-auto">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: '180px', cursor: 'crosshair' }}
              onMouseLeave={handleBarLeave}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f}
                  x1={PAD.l} y1={PAD.t + chartH - f * chartH}
                  x2={W - PAD.r} y2={PAD.t + chartH - f * chartH}
                  stroke="#f3f4f6" strokeWidth="1"
                />
              ))}

              {/* Eje Y labels */}
              {[0, 0.5, 1].map(f => (
                <text key={f}
                  x={PAD.l - 4} y={PAD.t + chartH - f * chartH + 4}
                  textAnchor="end" fontSize="9" fill="#9ca3af">
                  {f === 0 ? '$0' : formatPrecio(maxDia * f).replace('$', '$')}
                </text>
              ))}

              {/* Baseline */}
              <line x1={PAD.l} y1={PAD.t + chartH} x2={W - PAD.r} y2={PAD.t + chartH} stroke="#e5e7eb" strokeWidth="1" />

              {chartTipo === 'bar' ? (
                /* Barras */
                ingPorDia.map((d, i) => {
                  const bw   = Math.max(chartW / ingPorDia.length - 2, 2);
                  const x    = PAD.l + (i / ingPorDia.length) * chartW + 1;
                  const bh   = d.total > 0 ? Math.max((d.total / maxDia) * chartH, 2) : 0;
                  const y    = PAD.t + chartH - bh;
                  const sel  = diaSelec === d.dia;
                  const hov  = hovIdx === i;
                  return (
                    <g key={d.dia}>
                      <rect
                        x={x} y={y} width={bw} height={bh} rx="2"
                        fill={sel ? '#f59e0b' : hov ? '#7c3aed' : '#6d28d9'}
                        style={{ transition: 'fill 0.15s' }}
                        onMouseEnter={e => handleBarEnter(e, d, i)}
                        onClick={() => setDiaSelec(sel ? null : d.dia)}
                        style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                      />
                      {/* Eje X label — solo algunos */}
                      {(i === 0 || i === ingPorDia.length - 1 || i % Math.ceil(ingPorDia.length / 8) === 0) && (
                        <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">
                          {d.label}
                        </text>
                      )}
                    </g>
                  );
                })
              ) : (
                /* Línea */
                <>
                  {/* Área */}
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`${PAD.l},${PAD.t + chartH} ${linePoints} ${W - PAD.r},${PAD.t + chartH}`}
                    fill="url(#areaGrad)"
                  />
                  <polyline points={linePoints} fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinejoin="round" />
                  {/* Puntos interactivos */}
                  {ingPorDia.map((d, i) => {
                    const x = PAD.l + (i / Math.max(ingPorDia.length - 1, 1)) * chartW;
                    const y = PAD.t + chartH - (d.total / maxDia) * chartH;
                    return (
                      <circle key={d.dia}
                        cx={x} cy={y} r={hovIdx === i ? 5 : 3}
                        fill={diaSelec === d.dia ? '#f59e0b' : '#6d28d9'}
                        stroke="white" strokeWidth="1.5"
                        style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                        onMouseEnter={e => handleBarEnter(e, d, i)}
                        onClick={() => setDiaSelec(diaSelec === d.dia ? null : d.dia)}
                      />
                    );
                  })}
                </>
              )}
            </svg>

            {/* Tooltip flotante */}
            {tooltip && (
              <div
                className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl z-10 whitespace-nowrap"
                style={{ left: tooltip.x + 12, top: Math.max(tooltip.y, 8) }}
              >
                <p className="font-bold text-brand-yellow-400">{tooltip.label}</p>
                <p>{formatPrecio(tooltip.value)}</p>
                <p className="text-gray-400">{tooltip.count} pedido{tooltip.count !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {/* Drilldown del día */}
          {diaSelec && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 fade-in">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-yellow-800">
                  {new Date(diaSelec + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </p>
                <button onClick={() => setDiaSelec(null)} className="text-yellow-600 hover:text-yellow-800 text-xs">
                  ✕ cerrar
                </button>
              </div>
              {pedidosDia.length === 0 ? (
                <p className="text-yellow-600 text-sm">Sin pedidos ese día</p>
              ) : (
                <div className="space-y-1">
                  {pedidosDia.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">#{String(p.id).slice(-6).toUpperCase()} · {p.forma_entrega}</span>
                      <span className="font-bold text-gray-900">{formatPrecio(p.total)}</span>
                    </div>
                  ))}
                  <div className="border-t border-yellow-200 pt-2 flex justify-between font-bold text-sm">
                    <span className="text-yellow-800">Total del día</span>
                    <span className="text-yellow-900">{formatPrecio(pedidosDia.reduce((s, p) => s + p.total, 0))}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fila: Productos + Categorías */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Productos — 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-bold text-gray-900">Productos</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle revenue / cantidad */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  {[['revenue', '$'], ['cantidad', '#']].map(([v, label]) => (
                    <button key={v} onClick={() => setProdView(v)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all ${
                        prodView === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                      }`}>
                      {label} {v === 'revenue' ? 'Ingreso' : 'Vendidos'}
                    </button>
                  ))}
                </div>
                {/* Sort */}
                <select value={prodSort} onChange={e => setProdSort(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white">
                  <option value="revenue">Ordenar: Ingreso</option>
                  <option value="cantidad">Ordenar: Cantidad</option>
                  <option value="nombre">Ordenar: Nombre</option>
                </select>
              </div>
            </div>

            {/* Buscador y filtro de categoría */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  placeholder="Buscar producto..." className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-purple-400" />
              </div>
              {catFilter && (
                <button onClick={() => setCatFilter(null)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Filter className="w-3 h-3" />
                  {catFilter} ✕
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {prodFiltrados.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin resultados</p>
              ) : prodFiltrados.map(([nombre, data], i) => {
                const val = data[prodView];
                const pct = (val / maxProdVal) * 100;
                return (
                  <div key={nombre} className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-300 w-5 text-right flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-medium truncate" title={nombre}>{nombre}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">×{data.cantidad}</span>
                        <span className="text-xs font-bold text-gray-900 min-w-[70px] text-right">
                          {prodView === 'revenue' ? formatPrecio(data.revenue) : data.cantidad}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 flex-shrink-0" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CAT_COLORS[data.cat] || '#6d28d9',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              {prodFiltrados.length} producto{prodFiltrados.length !== 1 ? 's' : ''}
              {catFilter ? ` en ${catFilter}` : ''}
            </p>
          </div>

          {/* Categorías — 1/3 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Categorías</h2>
            <p className="text-xs text-gray-400 mb-4">Clic para filtrar productos</p>

            <div className="space-y-3">
              {catEntries.map(([cat, data]) => {
                const pct = totalCat > 0 ? Math.round((data.revenue / totalCat) * 100) : 0;
                const activa = catFilter === cat;
                return (
                  <button key={cat} onClick={() => setCatFilter(activa ? null : cat)}
                    className={`w-full text-left rounded-xl p-2.5 transition-all border ${
                      activa ? 'border-2 shadow-sm' : 'border-transparent hover:bg-gray-50'
                    }`}
                    style={{ borderColor: activa ? CAT_COLORS[cat] : undefined }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{cat}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">{pct}%</span>
                        <span className="text-xs font-bold text-gray-900">{formatPrecio(data.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[cat] }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{data.cantidad} unidades vendidas</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fila: Pagos + Entrega */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Métodos de pago */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Métodos de pago</h2>
            <div className="space-y-3">
              {pagoEntries.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
              ) : pagoEntries.map(([pago, val]) => {
                const pct = Math.round((val / maxPago) * 100);
                const pctTotal = totalIngresos > 0 ? Math.round((val / totalIngresos) * 100) : 0;
                const PAGO_COLORS = {
                  mercadopago:   '#009ee3',
                  tarjeta:       '#6d28d9',
                  transferencia: '#f59e0b',
                  efectivo:      '#22c55e',
                };
                return (
                  <div key={pago}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {PAGO_LABELS[pago] || pago}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pctTotal}%</span>
                        <span className="text-sm font-bold text-gray-900">{formatPrecio(val)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: PAGO_COLORS[pago] || '#6b7280' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retiro vs Delivery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Tipo de entrega</h2>
            <div className="space-y-4">
              {[
                { label: '🏪 Retiro en local', key: 'retiro',   color: '#6d28d9' },
                { label: '🚚 Delivery',         key: 'delivery', color: '#f59e0b' },
              ].map(({ label, key, color }) => {
                const val   = porEntrega[key] || 0;
                const total = porEntrega.retiro + porEntrega.delivery || 1;
                const pct   = Math.round((val / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-sm font-bold text-gray-900">{formatPrecio(val)}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}

              {/* Barra combinada */}
              <div className="mt-2 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full transition-all duration-700 bg-brand-purple-700"
                  style={{ width: `${Math.round((porEntrega.retiro / (porEntrega.retiro + porEntrega.delivery || 1)) * 100)}%` }} />
                <div className="h-full flex-1 bg-brand-yellow-400" />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>🏪 Retiro</span>
                <span>🚚 Delivery</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
