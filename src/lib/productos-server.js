/**
 * Versión server-side — usa fetch directo a la API REST de Supabase
 * Para usar en Server Components (app/page.jsx)
 * Schema: id, codigo, descripcion, precio, stock, unidad,
 *         categoria, foto_url, descripcion_web, activo,
 *         destacado, oferta, precio_anterior
 */

const IMAGEN_POR_CATEGORIA = {
  'Lácteos':          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
  'Bebidas':          'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Panadería':        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'Art. de Limpieza': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
  'Congelados':       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'Rotisería':        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
  'Comestibles':      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
  'General':          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
};

function deducirCategoria(desc) {
  const n = (desc || '').toLowerCase();
  if (/leche|yogur|queso|crema|manteca|danonino|flan|ricota/.test(n))          return 'Lácteos';
  if (/coca|pepsi|sprite|fanta|gaseosa|soda|agua|vino|cerveza|fernet|whisky|vodka|champagne|sidra|gatorade|levite|torasso|jugo/.test(n)) return 'Bebidas';
  if (/\bpan\b|factura|tortilla|prepizza|medialuna|budín|galletit/.test(n))    return 'Panadería';
  if (/detergente|lavandina|jabón|shampoo|acondicionador|esponja|fosforo|vela |desodorante|cif |colgate|ola |skip |ariel|omo |rexona|nivea|pantene|barbijo|papel hig/.test(n)) return 'Art. de Limpieza';
  if (/milanesa|hamburguesa|nugget|suprema|patitas|helado/.test(n))            return 'Congelados';
  if (/salchicha|sandwich|empanada|tarta|hummus|garbanzo|fiambre|mortadela|salame/.test(n)) return 'Rotisería';
  return 'Comestibles';
}

const CAT_ID = {
  'Panadería': 1, 'Comestibles': 2, 'Lácteos': 3,
  'Bebidas': 4, 'Art. de Limpieza': 5, 'Rotisería': 6, 'Congelados': 9, 'General': 2,
};

function titulo(s) {
  if (!s) return '';
  const minusc = new Set(['x','de','del','la','las','el','los','y','a','con','en','por','c/','al','s/','sin','kg','lt','ml','gr','grs','cc']);
  return s.toLowerCase().split(' ').map((p, i) =>
    (i === 0 || !minusc.has(p)) ? p.charAt(0).toUpperCase() + p.slice(1) : p
  ).join(' ');
}

function normalizar(p) {
  const catRaw = (!p.categoria || p.categoria === 'General')
    ? deducirCategoria(p.descripcion)
    : p.categoria;
  return {
    id:             p.id,
    categoriaId:    CAT_ID[catRaw] ?? 2,
    categoria:      catRaw,
    nombre:         titulo(p.descripcion),
    descripcion:    p.descripcion_web || titulo(p.descripcion),
    precio:         Number(p.precio)  || 0,
    precioAnterior: p.precio_anterior ? Number(p.precio_anterior) : null,
    imagen:         p.foto_url || IMAGEN_POR_CATEGORIA[catRaw] || IMAGEN_POR_CATEGORIA['General'],
    stock:          Math.max(0, Number(p.stock) || 0),
    oferta:         p.oferta    ?? false,
    destacado:      p.destacado ?? false,
    unidad:         p.unidad    || 'Uni',
    codigo:         p.codigo    || '',
  };
}

export async function getProductosServer() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const res = await fetch(
      `${url}/rest/v1/productos?select=id,codigo,descripcion,descripcion_web,precio,precio_anterior,stock,unidad,categoria,foto_url,oferta,destacado&activo=eq.true&precio=gt.0&order=descripcion&limit=1000`,
      {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map(normalizar);
  } catch {
    return [];
  }
}
