import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/admin';

/** Estado del pedido mientras esperamos que se acredite el pago con MP. */
export const ESTADO_ESPERANDO_PAGO = 'pendiente_mp';
/** Estado del pedido cuando MP ya acreditó la plata. */
export const ESTADO_PAGADO = 'confirmado';

export function getMpClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado en .env.local');
  return new MercadoPagoConfig({ accessToken });
}

/** approved | pending | rejected, normalizado a algo que entiende la UI. */
export function normalizarEstadoPago(status) {
  if (status === 'approved') return 'aprobado';
  if (status === 'rejected' || status === 'cancelled') return 'rechazado';
  if (status === 'refunded' || status === 'charged_back') return 'devuelto';
  return 'pendiente'; // pending, in_process, authorized
}

/**
 * Consulta el pago en la API de MP y sincroniza el estado del pedido en Supabase.
 * Es la única fuente de verdad: no confiamos en los parámetros que vuelven en la URL.
 *
 * Devuelve { ok, estadoPago, status, pedidoId, monto, actualizado }.
 */
export async function sincronizarPago(paymentId, pedidoIdEsperado = null) {
  const payment = await new Payment(getMpClient()).get({ id: String(paymentId) });

  const pedidoId   = payment.external_reference || pedidoIdEsperado;
  const estadoPago = normalizarEstadoPago(payment.status);

  // Si el front nos manda un pedido que no coincide con el del pago, no tocamos nada.
  if (pedidoIdEsperado && pedidoId && String(pedidoId) !== String(pedidoIdEsperado)) {
    return {
      ok: false,
      error: 'El pago no corresponde a este pedido',
      estadoPago,
      status: payment.status,
      pedidoId,
      monto: payment.transaction_amount,
      actualizado: false,
    };
  }

  let actualizado = false;

  if (pedidoId) {
    const supabase = createAdminClient();
    const nuevoEstado = estadoPago === 'aprobado' ? ESTADO_PAGADO : ESTADO_ESPERANDO_PAGO;

    // Campos opcionales: si la tabla `pedidos` todavía no tiene estas columnas,
    // reintentamos actualizando sólo el estado.
    let { error } = await supabase
      .from('pedidos')
      .update({
        estado:          nuevoEstado,
        mp_payment_id:   String(payment.id),
        mp_estado_pago:  payment.status,
      })
      .eq('id', pedidoId);

    if (error) {
      const retry = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId);
      error = retry.error;
    }

    if (error) console.error('[mercadopago] no se pudo actualizar el pedido', pedidoId, error);
    else actualizado = true;
  }

  return {
    ok: true,
    estadoPago,
    status: payment.status,
    statusDetail: payment.status_detail,
    pedidoId,
    monto: payment.transaction_amount,
    actualizado,
  };
}
