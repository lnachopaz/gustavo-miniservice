/**
 * Carga de productos para Server Components (app/page.jsx) — fetch directo a la
 * API REST de Supabase. La normalización vive en productos-shared.js.
 */
import { normalizar, COLUMNAS, PAGINA, MAX_PAGINAS } from '@/lib/productos-shared';

export async function getProductosServer() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const filas = [];
    const base = `${url}/rest/v1/productos?select=${COLUMNAS.join(',')}`
               + `&activo=eq.true&precio=gt.0&order=descripcion,id&limit=${PAGINA}`;

    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const res = await fetch(`${base}&offset=${pagina * PAGINA}`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        next: { revalidate: 60 },
      });

      if (!res.ok) break;
      const data = await res.json();
      filas.push(...(data || []));
      if (!data || data.length < PAGINA) break;
    }

    return filas.map(normalizar);
  } catch {
    return [];
  }
}
