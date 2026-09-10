import { sincronizarPago } from '@/lib/mp';

/**
 * Webhook de Mercado Pago (notification_url de la preferencia).
 * Sirve de red de seguridad: si el cliente cierra la pestaña de MP antes de
 * volver al sitio, el pedido igual queda confirmado.
 *
 * Siempre respondemos 200: si devolvemos error, MP reintenta la notificación
 * durante horas y llena los logs.
 */
export async function POST(request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const tipo = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    if (tipo !== 'payment') {
      return Response.json({ ignorado: tipo || 'sin tipo' });
    }

    const paymentId = body?.data?.id || body?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!paymentId) return Response.json({ ignorado: 'sin payment id' });

    const resultado = await sincronizarPago(paymentId);
    console.log('[mp-webhook]', paymentId, resultado.status, 'pedido', resultado.pedidoId);

    return Response.json({ recibido: true });
  } catch (err) {
    console.error('[mp-webhook]', err);
    return Response.json({ recibido: true });
  }
}

// MP a veces pega un GET para validar la URL.
export async function GET() {
  return Response.json({ ok: true });
}
