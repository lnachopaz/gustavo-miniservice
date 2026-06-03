-- ============================================================
-- SCHEMA Gustavo 1° Miniservice
-- Ejecutar en Supabase → SQL Editor → New query
-- ============================================================

-- 1. PERFILES (extiende auth.users)
create table public.perfiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  nombre      text,
  apellido    text,
  telefono    text,
  direccion   text,
  rol         text not null default 'usuario' check (rol in ('usuario', 'admin')),
  creado_en   timestamptz default now()
);

alter table public.perfiles enable row level security;

-- Cada usuario solo ve y edita su propio perfil
create policy "perfil propio" on public.perfiles
  for all using (auth.uid() = id);

-- Admins pueden ver todos los perfiles
create policy "admin ve todos" on public.perfiles
  for select using (
    exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- 2. PRODUCTOS
create table public.productos (
  id            serial primary key,
  categoria_id  int not null,
  categoria     text not null,
  nombre        text not null,
  descripcion   text,
  precio        numeric not null,
  precio_anterior numeric,
  imagen        text,
  stock         int default 0,
  oferta        boolean default false,
  destacado     boolean default false,
  unidad        text default 'unidad',
  cod_ab        int,
  cod_barra     text,
  activo        boolean default true,
  creado_en     timestamptz default now(),
  actualizado_en timestamptz default now()
);

alter table public.productos enable row level security;

-- Todos pueden leer productos activos
create policy "leer productos" on public.productos
  for select using (activo = true);

-- Solo admin puede modificar
create policy "admin modifica productos" on public.productos
  for all using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- 3. PEDIDOS
create table public.pedidos (
  id              uuid default gen_random_uuid() primary key,
  usuario_id      uuid references auth.users(id),
  estado          text default 'pendiente' check (estado in ('pendiente','confirmado','en_camino','entregado','cancelado')),
  metodo_pago     text,
  metodo_entrega  text,
  direccion       text,
  nota            text,
  total           numeric not null,
  nombre_cliente  text,
  telefono        text,
  creado_en       timestamptz default now()
);

alter table public.pedidos enable row level security;

-- Usuarios ven sus propios pedidos
create policy "pedidos propios" on public.pedidos
  for select using (auth.uid() = usuario_id);

-- Cualquiera puede crear un pedido (incluso sin cuenta)
create policy "crear pedido" on public.pedidos
  for insert with check (true);

-- Admin ve todos los pedidos
create policy "admin ve pedidos" on public.pedidos
  for all using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- 4. LÍNEAS DE PEDIDO
create table public.pedido_items (
  id          serial primary key,
  pedido_id   uuid references public.pedidos(id) on delete cascade,
  producto_id int,
  nombre      text not null,
  precio      numeric not null,
  cantidad    int not null,
  imagen      text
);

alter table public.pedido_items enable row level security;

create policy "items de pedidos propios" on public.pedido_items
  for select using (
    exists (
      select 1 from public.pedidos
      where id = pedido_id and usuario_id = auth.uid()
    )
  );

create policy "insertar items" on public.pedido_items
  for insert with check (true);

create policy "admin ve items" on public.pedido_items
  for all using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ============================================================
-- 5. FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data->>'nombre');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 6. STORAGE para imágenes de productos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true);

create policy "imagen publica" on storage.objects
  for select using (bucket_id = 'productos');

create policy "admin sube imagenes" on storage.objects
  for insert with check (
    bucket_id = 'productos' and
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "admin borra imagenes" on storage.objects
  for delete using (
    bucket_id = 'productos' and
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );
