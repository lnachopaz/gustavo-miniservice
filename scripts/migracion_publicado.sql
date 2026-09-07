-- ============================================================
-- Separa "publicado en la web" de "activo en el miniservice".
--
-- Contexto: hasta ahora `activo` hacía dos trabajos — lo escribía el import
-- (activo = precio > 0) y además decidía qué se veía en la página. Por eso un
-- import dejó el catálogo en cero. Con la importación de ~6000 productos, la
-- base pasa a ser el catálogo completo y la web muestra solo un subconjunto
-- curado, así que hace falta una columna que el import no toque nunca.
--
-- Ejecutar en Supabase → SQL Editor, UNA sola vez, ANTES del próximo import.
-- ============================================================

-- 1. La columna. Arranca en false: lo que entre nuevo no se publica solo.
alter table public.productos
  add column if not exists publicado boolean not null default false;

-- 1b. Marca de carga manual. Un producto dado de alta a mano desde el panel no
--     existe en el miniservice, así que nunca va a venir en el JSON: sin esta
--     marca la despublicación automática lo sacaría de la web en el próximo
--     import.
alter table public.productos
  add column if not exists carga_manual boolean not null default false;

-- 2. Backfill de los 2325 que hoy están en la página.
--    El guard aborta si la tabla ya no tiene exactamente esas filas: una vez
--    que entraron los ~6000 del import ya no hay forma de distinguir cuáles
--    eran los originales, y publicarlos todos sería peor que no hacer nada.
do $$
declare
  filas int;
begin
  select count(*) into filas from public.productos;

  if filas <> 2325 then
    raise exception
      'La tabla tiene % filas y se esperaban 2325. Si el import ya corrió, no se puede identificar el subconjunto original: parar y revisar a mano.', filas;
  end if;

  update public.productos set publicado = true;
end $$;

-- 3. Índices: el filtro de la web y el buscador del alta pegan contra estas
--    columnas sobre una tabla que va a rondar las 6000 filas.
create index if not exists productos_publicado_idx on public.productos (publicado);
create index if not exists productos_codigo_idx    on public.productos (codigo);

-- 4. RLS: el público pasa a ver solo lo publicado. Sin esto los ~3700 no
--    publicados serían visibles consultando la API REST directo, aunque la
--    interfaz no los muestre.
--    La policy de admin ya es `for all` contra clientes.rol = 'admin', así que
--    el buscador del alta sigue viendo la tabla entera.
drop policy if exists "leer productos" on public.productos;
create policy "leer productos" on public.productos
  for select to anon, authenticated
  using (publicado = true);

-- 5. Verificación.
select
  count(*)                                   as total,
  count(*) filter (where publicado)          as publicados,
  count(*) filter (where not publicado)      as no_publicados,
  count(*) filter (where publicado and precio > 0) as visibles_en_la_web
from public.productos;
