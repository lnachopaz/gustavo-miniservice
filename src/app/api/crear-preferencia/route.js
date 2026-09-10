import { Preference } from 'mercadopago';
import { getMpClient } from '@/lib/mp';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Crea la preferencia de Checkout Pro y devuelve el link de pago de Mercado Pago.
 * El cliente paga en la página de MP con su cuenta / tarjeta / QR y la plata
 * cae directo en la cuenta de MP del negocio (la del MP_ACCESS_TOKEN).
 */
export async function POST(request) {
  try {
    const { items = [], pedidoId, payerEmail } = await request.json();

    if (!pedidoId) {
      return Response.json({ error: 'Falta el número de pedido' }, { status: 400 });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return Response.json({ error: 'MP_ACCESS_TOKEN no configurado en .env.local' }, { status: 500 });
    }

    // El detalle guardado en la base manda: así lo que se cobra en MP es siempre
    // lo mismo que ve el negocio en el pedido. Si no se puede leer, usamos el
    // carrito que mandó el navegador.
    const mpItems = (await itemsDelPedido(pedidoId)) || items.map(item => ({
      title:       String(item.nombre || 'Producto'),
      quantity:    Number(item.cantidad),
      unit_price:  Number(item.precio),
      currency_id: 'ARS',
    }));

    // El costo de envío también sale de la base (lo calculó el checkout al
    // verificar la dirección), no de lo que mande el navegador.
    const costoEnvio = await costoEnvioDelPedido(pedidoId);
    if (costoEnvio > 0) {
      mpItems.push({
        title:       'Envío a domicilio',
        quantity:    1,
        unit_price:  costoEnvio,
        currency_id: 'ARS',
      });
    }

    const invalido = mpItems.find(i => !(i.quantity > 0) || !(i.unit_price > 0));
    if (!mpItems.length || invalido) {
      return Response.json({ error: 'El pedido no tiene items válidos para cobrar' }, { status: 400 });
    }

    const siteUrl = baseUrl(request);

    const body = {
      items: mpItems,
      back_urls: {
        success: `${siteUrl}/carrito?mp_status=approved&pedido=${pedidoId}`,
        failure: `${siteUrl}/carrito?mp_status=failure&pedido=${pedidoId}`,
        pending: `${siteUrl}/carrito?mp_status=pending&pedido=${pedidoId}`,
      },
      auto_return:         'approved',
      binary_mode:         true, // aprobado o rechazado, sin quedar "en proceso"
      external_reference:  String(pedidoId),
      statement_descriptor: 'GUSTAVO 1',
      metadata:            { pedido_id: String(pedidoId) },
    };

    // MP no acepta localhost como notification_url: sólo la mandamos en producción.
    if (siteUrl.startsWith('https://')) {
      body.notification_url = `${siteUrl}/api/mp-webhook`;
    }

    if (payerEmail) body.payer = { email: payerEmail };

    const result = await new Preference(getMpClient()).create({ body });

    return Response.json({
      init_point: result.init_point,
      preference_id: result.id,
      total: mpItems.reduce((acc, i) => acc + i.quantity * i.unit_price, 0),
    });
  } catch (err) {
    console.error('[crear-preferencia]', err);
    return Response.json({ error: err.message || 'Error al crear la preferencia de Mercado Pago' }, { status: 500 });
  }
}

/** Items del pedido tal como quedaron guardados en Supabase. null si no se pudieron leer. */
async function itemsDelPedido(pedidoId) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('detalle_pedidos')
      .select('descripcion, cantidad, precio_unitario')
      .eq('pedido_id', pedidoId);

    if (error || !data?.length) return null;

    return data.map(d => ({
      title:       String(d.descripcion || 'Producto'),
      quantity:    Number(d.cantidad),
      unit_price:  Number(d.precio_unitario),
      currency_id: 'ARS',
    }));
  } catch {
    return null;
  }
}

/** Costo de envío guardado en el pedido. 0 si no tiene o no se pudo leer. */
async function costoEnvioDelPedido(pedidoId) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pedidos')
      .select('costo_envio')
      .eq('id', pedidoId)
      .single();

    if (error || !data) return 0;
    return Number(data.costo_envio) || 0;
  } catch {
    return 0;
  }
}

function baseUrl(request) {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  if (configurada) return configurada.replace(/\/$/, '');
  return (request.headers.get('origin') || 'http://localhost:3000').replace(/\/$/, '');
}
