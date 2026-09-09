import { createAdminClient } from '@/lib/supabase/admin';
import { ESTADO_ESPERANDO_PAGO } from '@/lib/mp';

/**
 * Cancela un pedido que quedó esperando el pago de Mercado Pago y no se concretó
 * (pago rechazado o checkout abandonado). Sin esto, cada reintento del cliente
 * dejaba un pedido fantasma en el panel.
 *
 * Sólo toca pedidos en estado `pendiente_mp`: nunca puede cancelar uno ya pagado,
 * confirmado o en camino.
 */
export async function POST(request) {
  try {
    const { pedidoId } = await request.json();
    if (!pedidoId) {
      return Response.json({ error: 'Falta el número de pedido' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', pedidoId)
      .eq('estado', ESTADO_ESPERANDO_PAGO)
      .select('id');

    if (error) {
      console.error('[cancelar-pedido]', error);
      return Response.json({ error: 'No se pudo cancelar el pedido' }, { status: 500 });
    }

    return Response.json({ cancelado: (data?.length || 0) > 0 });
  } catch (err) {
    console.error('[cancelar-pedido]', err);
    return Response.json({ error: err.message || 'Error al cancelar el pedido' }, { status: 500 });
  }
}
