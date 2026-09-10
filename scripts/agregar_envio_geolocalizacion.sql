-- Agrega los campos necesarios para calcular el envío por distancia
-- (geocodificación + radio de cobertura de 3km desde el local).
-- Ejecutar en el SQL Editor de Supabase.

alter table pedidos
  add column if not exists direccion_lat numeric,
  add column if not exists direccion_lng numeric,
  add column if not exists distancia_km numeric,
  add column if not exists costo_envio numeric default 0;
