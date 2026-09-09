import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para rutas de API (nunca en el browser).
 *
 * Usa la service role key si está configurada: el webhook de Mercado Pago y la
 * confirmación de pago corren sin sesión de usuario, y las políticas RLS de
 * `pedidos` sólo dejan actualizar al admin logueado.
 *
 * Si no está configurada cae al anon key para no romper nada, pero el UPDATE
 * del pedido probablemente falle por RLS.
 */
export function createAdminClient() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.warn(
      '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY no configurada — ' +
      'los pedidos pagados con MP pueden no marcarse como confirmados (RLS).'
    );
  }

  return createSupabaseClient(url, serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
