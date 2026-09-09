import { sincronizarPago } from '@/lib/mp';

/**
 * Confirma el pago cuando el cliente vuelve de Mercado Pago al sitio.
 * No confía en el `status` que viene en la URL: consulta el pago en la API de MP
 * y con esa respuesta marca el pedido como confirmado (o lo deja esperando pago).
 */
export async function POST(request) {
  try {
    const { pedidoId, paymentId } = await request.json();

    if (!paymentId) {
      return Response.json({ error: 'Falta el identificador del pago' }, { status: 400 });
    }

    const resultado = await sincronizarPago(paymentId, pedidoId);

    if (!resultado.ok) {
      return Response.json(resultado, { status: 409 });
    }

    return Response.json(resultado);
  } catch (err) {
    console.error('[confirmar-pago]', err);
    return Response.json({ error: err.message || 'No se pudo verificar el pago' }, { status: 500 });
  }
}
