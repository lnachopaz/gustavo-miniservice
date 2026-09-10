// Local: Corrientes 99, San Miguel de Tucumán.
// Coordenadas obtenidas por geocodificación; si no coinciden con el local real,
// ajustarlas acá.
export const LOCAL_LAT = -26.8238895;
export const LOCAL_LNG = -65.1965706;

export const RADIO_MAXIMO_KM = 3;
export const COSTO_ENVIO = 1000;

// Distancia en línea recta entre dos coordenadas (fórmula de Haversine), en km.
export function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanciaDesdeLocal(lat, lng) {
  return calcularDistanciaKm(LOCAL_LAT, LOCAL_LNG, lat, lng);
}
