-- ============================================================
-- SQL ADICIONAL — Solo agrega lo que falta, no toca lo existente
-- Ejecutar en Supabase → SQL Editor → New query
-- ============================================================

-- 1. Agregar columna "rol" a clientes (para distinguir admin/usuario)
alter table public.clientes
  add column if not exists rol text not null default 'usuario'
  check (rol in ('usuario', 'admin'));

-- 2. Agregar columna "precio_anterior" a productos (para mostrar descuentos)
alter table public.productos
  add column if not exists precio_anterior numeric;

-- 3. Agregar columna "oferta" a productos
alter table public.productos
  add column if not exists oferta boolean default false;

-- 4. Vincular clientes con auth.users automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.clientes (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Row Level Security
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedidos enable row level security;

-- Clientes: cada uno ve solo su propio registro
drop policy if exists "cliente propio" on public.clientes;
create policy "cliente propio" on public.clientes
  for all using (auth.uid() = id);

-- Productos: todos pueden leer, solo admin puede modificar
drop policy if exists "leer productos" on public.productos;
create policy "leer productos" on public.productos
  for select using (activo = true);

drop policy if exists "admin modifica productos" on public.productos;
create policy "admin modifica productos" on public.productos
  for all using (
    exists (select 1 from public.clientes where id = auth.uid() and rol = 'admin')
  );

-- Pedidos: usuario ve los suyos, admin ve todos
drop policy if exists "pedidos propios" on public.pedidos;
create policy "pedidos propios" on public.pedidos
  for select using (auth.uid() = cliente_id);

drop policy if exists "crear pedido" on public.pedidos;
create policy "crear pedido" on public.pedidos
  for insert with check (true);

drop policy if exists "admin pedidos" on public.pedidos;
create policy "admin pedidos" on public.pedidos
  for all using (
    exists (select 1 from public.clientes where id = auth.uid() and rol = 'admin')
  );

-- Detalle pedidos
drop policy if exists "insertar detalle" on public.detalle_pedidos;
create policy "insertar detalle" on public.detalle_pedidos
  for insert with check (true);

drop policy if exists "ver detalle propio" on public.detalle_pedidos;
create policy "ver detalle propio" on public.detalle_pedidos
  for select using (
    exists (
      select 1 from public.pedidos
      where id = pedido_id and cliente_id = auth.uid()
    )
  );

-- 6. Storage para fotos de productos (si no existe)
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "foto publica" on storage.objects;
create policy "foto publica" on storage.objects
  for select using (bucket_id = 'productos');

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects
  for insert with check (
    bucket_id = 'productos' and
    exists (select 1 from public.clientes where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects
  for delete using (
    bucket_id = 'productos' and
    exists (select 1 from public.clientes where id = auth.uid() and rol = 'admin')
  );
