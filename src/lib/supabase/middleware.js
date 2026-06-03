import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rutas protegidas para admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/cuenta/login?next=/admin', request.url));
    }
    const { data: cliente } = await supabase
      .from('clientes')
      .select('rol')
      .eq('id', user.id)
      .single();
    if (cliente?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Rutas protegidas para usuarios
  if (request.nextUrl.pathname.startsWith('/cuenta/perfil') ||
      request.nextUrl.pathname.startsWith('/cuenta/historial')) {
    if (!user) {
      return NextResponse.redirect(new URL('/cuenta/login', request.url));
    }
  }

  return supabaseResponse;
}
