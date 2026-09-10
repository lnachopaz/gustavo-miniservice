import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request) {
  try {
    const { items, pedidoId, payerEmail, costoEnvio } = await request.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return Response.json({ error: 'MP_ACCESS_TOKEN no configurado en .env.local' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // Detectar base URL del sitio
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const body = {
      items: [
        ...items.map(item => ({
          title:      item.nombre,
          quantity:   item.cantidad,
          unit_price: Number(item.precio),
          currency_id: 'ARS',
        })),
        ...(costoEnvio > 0 ? [{
          title:      'Envío a domicilio',
          quantity:   1,
          unit_price: Number(costoEnvio),
          currency_id: 'ARS',
        }] : []),
      ],
      back_urls: {
        success: `${origin}/carrito?mp_status=approved&pedido=${pedidoId}`,
        failure: `${origin}/carrito?mp_status=failure&pedido=${pedidoId}`,
        pending: `${origin}/carrito?mp_status=pending&pedido=${pedidoId}`,
      },
      auto_return:        'approved',
      external_reference: String(pedidoId),
    };

    if (payerEmail) {
      body.payer = { email: payerEmail };
    }

    const result = await preference.create({ body });

    return Response.json({ init_point: result.init_point });
  } catch (err) {
    console.error('[crear-preferencia]', err);
    return Response.json({ error: err.message || 'Error al crear preferencia MP' }, { status: 500 });
  }
}
