import { createClient } from '@/lib/supabase/client';
import { productos as mockProductos } from '@/data/mockData';

// Asigna categoría automáticamente según palabras clave del nombre
function asignarCategoria(nombre) {
  const n = (nombre || '').toLowerCase();

  if (/leche|yogur|queso|crema|manteca|postre|danonino|flan/.test(n))
    return { cat: 'Lácteos', catId: 3 };

  if (/coca|pepsi|sprite|fanta|7up|gaseosa|soda|agua|jugo|vino|cerveza|fernet|whisky|vodka|champagne|sidra|gatorade|powerade|levite|torasso|h2o/.test(n))
    return { cat: 'Bebidas', catId: 4 };

  if (/pan |facturas|tortilla|prepizza|medialunas|budín|galletit|chips la/.test(n))
    return { cat: 'Panadería', catId: 1 };

  if (/detergente|lavandina|jabón|jabón|shampoo|acondicionador|papel higién|servilleta|esponja|fosforo|vela|desodorante|rociador|cif|magistral|ala |skip|ariel|persil|omo |colgate|oral.b|gillette|dove|rexona|nivea|pantene|head|barbijo/.test(n))
    return { cat: 'Art. de Limpieza', catId: 5 };

  if (/milanesa|hamburguesa|nuggets|suprema|patitas|helado|congel/.test(n))
    return { cat: 'Congelados', catId: 9 };

  if (/salchicha|sandwich|empanada|tarta|pollo|hummus|garbanzo|fiambre|mortadela|salame|jamón|jamon/.test(n))
    return { cat: 'Rotisería', catId: 6 };

  return { cat: 'Comestibles', catId: 2 };
}

// Imagen genérica según categoría
const IMAGEN_DEFAULT = {
  1: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  2: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
  3: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
  4: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
  5: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
  6: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
  9: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
};

// Convierte MAYÚSCULAS a Título Propio
function titulo(s) {
  if (!s) return '';
  const minusc = new Set(['x','de','del','la','las','el','los','y','a','con','en','por','c/','al','s/','sin','kg','lt','ml','gr','grs','cc']);
  return s.toLowerCase().split(' ').map((p, i) =>
    (i === 0 || !minusc.has(p)) ? p.charAt(0).toUpperCase() + p.slice(1) : p
  ).join(' ');
}

export async function getProductos() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return mockProductos;

    const supabase = createClient();

    // No filtramos por activo=true porque puede ser NULL
    // Filtramos precio > 0 para excluir productos sin precio
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, descripcion, descripcion_web, precio, precio_anterior, stock, unidad, categoria, foto_url, oferta, destacado, activo')
      .gt('precio', 0)
      .or('activo.is.null,activo.eq.true')  // activo null o true
      .order('descripcion')
      .limit(500);

    if (error) { console.error('Supabase error:', error); return mockProductos; }
    if (!data?.length) return mockProductos;

    return data.map(p => {
      const { cat, catId } = p.categoria
        ? { cat: p.categoria, catId: asignarCategoria(p.categoria).catId }
        : asignarCategoria(p.descripcion);

      return {
        id:             p.id,
        categoriaId:    catId,
        categoria:      cat,
        nombre:         titulo(p.descripcion),
        descripcion:    p.descripcion_web || titulo(p.descripcion),
        precio:         Number(p.precio)  || 0,
        precioAnterior: p.precio_anterior ? Number(p.precio_anterior) : null,
        imagen:         p.foto_url || IMAGEN_DEFAULT[catId] || IMAGEN_DEFAULT[2],
        stock:          Math.max(0, Number(p.stock) || 0), // negativo → 0
        oferta:         p.oferta    || false,
        destacado:      p.destacado || false,
        unidad:         p.unidad    || 'unidad',
        codAb:          p.codigo    || null,
        codBarra:       '',
      };
    });

  } catch (err) {
    console.error('getProductos error:', err);
    return mockProductos;
  }
}

export function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(precio);
}
