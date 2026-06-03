'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CuentaPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: cliente } = await supabase
          .from('clientes').select('rol').eq('id', user.id).single();
        router.replace(cliente?.rol === 'admin' ? '/admin' : '/cuenta/perfil');
      } else {
        router.replace('/cuenta/login');
      }
    };
    check();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
