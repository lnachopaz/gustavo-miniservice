'use client';

/** Carga de productos desde el browser. La normalización vive en productos-shared.js. */
import { createClient } from '@/lib/supabase/client';
import { normalizar, COLUMNAS, PAGINA, MAX_PAGINAS } from '@/lib/productos-shared';

export async function getProductos() {
  try {
    const supabase = createClient();
    const filas = [];

    // El order por id desempata: sin un orden total la paginación puede
    // repetir o saltear filas entre requests.
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const desde = pagina * PAGINA;
      const { data, error } = await supabase
        .from('productos')
        .select(COLUMNAS.join(','))
        // `publicado` es lo que decide qué se ve en la web y el import no lo
        // toca; `precio > 0` esconde lo que quedó sin precio en el miniservice.
        .eq('publicado', true)
        .gt('precio', 0)
        .order('descripcion')
        .order('id')
        .range(desde, desde + PAGINA - 1);

      if (error) throw error;
      filas.push(...(data || []));
      if (!data || data.length < PAGINA) break;
    }

    return filas.map(normalizar);
  } catch (err) {
    console.error('getProductos error:', err);
    return [];
  }
}

// Para el autocompletado del buscador: consulta directo Supabase (no el
// catálogo ya cargado), así funciona desde cualquier página sin traer los
// ~2300 productos primero.
export async function buscarProductosAutocompletado(query, limite = 6) {
  try {
    const q = (query || '').trim().replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ\s.-]/g, ' ').trim();
    if (!q) return [];

    const supabase = createClient();
    const { data, error } = await supabase
      .from('productos')
      .select(COLUMNAS.join(','))
      .eq('publicado', true)
      .gt('precio', 0)
      .or(`descripcion_web.ilike.%${q}%,descripcion.ilike.%${q}%,codigo.ilike.%${q}%`)
      .limit(limite);

    if (error) throw error;
    return (data || []).map(normalizar);
  } catch (err) {
    console.error('buscarProductosAutocompletado error:', err);
    return [];
  }
}

export function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(precio);
}
