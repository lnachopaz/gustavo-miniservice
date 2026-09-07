/**
 * Lógica compartida entre la carga client-side (productos.js) y la
 * server-side (productos-server.js). Vivía duplicada en los dos archivos y las
 * copias se desincronizaron, así que ahora hay una sola.
 *
 * Schema de la tabla productos:
 *   id, codigo, descripcion, precio, stock, unidad, categoria, foto_url,
 *   descripcion_web, activo, destacado, oferta, precio_anterior
 */
import { categorias } from '@/data/mockData';

const IMAGEN_POR_CATEGORIA = {
  'Panificados':          'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'Almacén General':      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
  'Fideos y Pastas':      'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=400&fit=crop',
  'Arroz':                'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'Conservas':            'https://images.unsplash.com/photo-1584385002340-d886f3a0f097?w=400&h=400&fit=crop',
  'Salsas y Tomates':     'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop',
  'Dulces y Mieles':      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
  'Lácteos':              'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
  'Quesos':               'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'Fiambres y Frescos':   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
  'Hambur. y Congelados': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'Bebidas':              'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  'Limpieza del Hogar':   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
  'Higiene Personal':     'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
};

const CATEGORIA_POR_DEFECTO = 'Almacén General';
const IMAGEN_FALLBACK = IMAGEN_POR_CATEGORIA[CATEGORIA_POR_DEFECTO];

// nombre exacto de la base → id de la categoría del menú
const CAT_ID = Object.fromEntries(categorias.map(c => [c.nombre, c.id]));

// Solo se usa cuando el producto vino sin categoría desde el miniservice.
function deducirCategoria(descripcion) {
  const n = (descripcion || '').toLowerCase();
  if (/queso|muzzarella|mozzarella|rallado/.test(n))                                    return 'Quesos';
  if (/leche|yogur|crema|manteca|danonino|flan|ricota|postre/.test(n))                  return 'Lácteos';
  if (/coca|pepsi|sprite|fanta|gaseosa|soda|agua|vino|cerveza|fernet|whisky|vodka|champagne|sidra|gatorade|levite|torasso|jugo/.test(n)) return 'Bebidas';
  if (/\bpan\b|factura|tortilla|prepizza|medialuna|budín|galletit|bizcochuelo/.test(n)) return 'Panificados';
  if (/fideo|pasta|tallarin|mostachol|spaghetti|ravioles|ñoqui|codito|lasa[ñn]a/.test(n)) return 'Fideos y Pastas';
  if (/\barroz\b/.test(n))                                                              return 'Arroz';
  if (/at[uú]n|caballa|sardina|arveja|choclo|lenteja|poroto|garbanzo|conserva/.test(n)) return 'Conservas';
  if (/salsa|pur[eé] de tomate|tomate perita|extracto de tomate|ketchup/.test(n))       return 'Salsas y Tomates';
  if (/dulce de|miel |mermelada|jalea|az[uú]car/.test(n))                                return 'Dulces y Mieles';
  if (/fiambre|mortadela|salame|jam[oó]n|salchicha|panceta/.test(n))                    return 'Fiambres y Frescos';
  if (/hamburguesa|milanesa|nugget|suprema|patitas|helado|congelad/.test(n))            return 'Hambur. y Congelados';
  if (/shampoo|acondicionador|jab[oó]n de tocador|desodorante|pa[ñn]al|papel hig|colgate|rexona|nivea|pantene|cepillo dental|toallita|barbijo/.test(n)) return 'Higiene Personal';
  if (/detergente|lavandina|limpiador|esponja|cif |ariel|skip |omo |suavizante|insecticida|virulana|trapo|escoba|f[oó]sforo/.test(n)) return 'Limpieza del Hogar';
  return CATEGORIA_POR_DEFECTO;
}

function titulo(s) {
  if (!s) return '';
  const minusc = new Set(['x','de','del','la','las','el','los','y','a','con','en','por','c/','al','s/','sin','kg','lt','ml','gr','grs','cc','x1','x2','x4','x6']);
  return s.toLowerCase().split(' ').map((p, i) =>
    (i === 0 || !minusc.has(p)) ? p.charAt(0).toUpperCase() + p.slice(1) : p
  ).join(' ');
}

export function normalizar(p) {
  // Se respeta la categoría de la base; solo se deduce si vino vacía.
  const catRaw = p.categoria || deducirCategoria(p.descripcion);
  const imagen = p.foto_url || IMAGEN_POR_CATEGORIA[catRaw] || IMAGEN_FALLBACK;

  return {
    id:             p.id,
    categoriaId:    CAT_ID[catRaw] ?? CAT_ID[CATEGORIA_POR_DEFECTO],
    categoria:      catRaw,
    nombre:         titulo(p.descripcion),
    descripcion:    p.descripcion_web || titulo(p.descripcion),
    precio:         Number(p.precio)  || 0,
    precioAnterior: p.precio_anterior ? Number(p.precio_anterior) : null,
    imagen,
    stock:          Math.max(0, Number(p.stock) || 0),
    oferta:         p.oferta    ?? false,
    destacado:      p.destacado ?? false,
    unidad:         p.unidad    || 'Uni',
    codigo:         p.codigo    || '',
  };
}

// PostgREST corta en 1000 filas por request, así que hay que paginar.
export const PAGINA = 1000;
export const MAX_PAGINAS = 20;

export const COLUMNAS = [
  'id', 'codigo', 'descripcion', 'descripcion_web',
  'precio', 'precio_anterior', 'stock', 'unidad',
  'categoria', 'foto_url', 'oferta', 'destacado', 'activo',
];
