/**
 * Carga productos desde Supabase.
 * Si Supabase falla o las variables no están, usa mockData como fallback.
 */
import { createClient } from '@/lib/supabase/client';
import { productos as mockProductos, categorias as mockCategorias } from '@/data/mockData';

export async function getProductos() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return mockProductos;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('descripcion');

    if (error || !data?.length) return mockProductos;

    // Normalizar campos de Supabase al formato que usa la app
    return data.map(p => ({
      id:             p.id,
      categoriaId:    p.categoria_id || getCatId(p.categoria),
      categoria:      p.categoria    || '',
      nombre:         p.descripcion  || '',          // en la BD el nombre está en "descripcion"
      descripcion:    p.descripcion_web || p.descripcion || '',
      precio:         p.precio       || 0,
      precioAnterior: p.precio_anterior || null,
      imagen:         p.foto_url     || null,
      stock:          p.stock        || 0,
      oferta:         p.oferta       || false,
      destacado:      p.destacado    || false,
      unidad:         p.unidad       || 'unidad',
      codAb:          p.codigo       || null,
      codBarra:       p.cod_barra    || '',
    }));
  } catch {
    return mockProductos;
  }
}

function getCatId(nombre) {
  const map = {
    'Panadería': 1, 'Comestibles': 2, 'Lácteos': 3,
    'Bebidas': 4, 'Art. de Limpieza': 5, 'Rotisería': 6, 'Congelados': 9,
  };
  return map[nombre] || 2;
}

export function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(precio);
}
