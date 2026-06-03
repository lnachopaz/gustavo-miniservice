import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/perfil', '/cuenta/historial'],
};
