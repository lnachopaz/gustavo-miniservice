import { LOCAL_LAT, LOCAL_LNG } from '@/lib/envio';

export async function POST(request) {
  try {
    const { direccion } = await request.json();
    if (!direccion || !direccion.trim()) {
      return Response.json({ error: 'Falta la dirección' }, { status: 400 });
    }

    // Solo se agrega la provincia (no la ciudad): forzar "San Miguel de Tucumán"
    // hace que Nominatim matchee mal direcciones de otras localidades (ej. "Tafí
    // Viejo" terminaba resolviendo a una calle homónima dentro de la capital).
    const query = `${direccion}, Tucumán, Argentina`;

    // viewbox sin bounded=1: prioriza resultados cercanos al local ante
    // direcciones ambiguas, pero sigue resolviendo bien las que están lejos de
    // verdad (necesario para poder rechazarlas por radio).
    const margen = 0.5; // ~55km
    const viewbox = [
      LOCAL_LNG - margen, LOCAL_LAT + margen,
      LOCAL_LNG + margen, LOCAL_LAT - margen,
    ].join(',');

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ar&viewbox=${viewbox}`;

    const res = await fetch(url, {
      headers: {
        // La política de uso de Nominatim exige identificar la app que hace la llamada.
        'User-Agent': 'gustavo-miniservice-checkout/1.0',
      },
    });
    const data = await res.json();

    if (!data?.length) {
      return Response.json({ error: 'No pudimos encontrar esa dirección. Revisá que esté bien escrita.' }, { status: 404 });
    }

    const resultado = data[0];

    return Response.json({
      lat: parseFloat(resultado.lat),
      lng: parseFloat(resultado.lon),
      direccionFormateada: resultado.display_name,
    });
  } catch (err) {
    console.error('[geocodificar]', err);
    return Response.json({ error: 'Error al geocodificar la dirección' }, { status: 500 });
  }
}
