'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/cuenta/perfil';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (err) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: cliente } = await supabase
      .from('clientes')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rol = cliente?.rol;
    let destino;
    if (rol === 'admin')  destino = '/admin';
    else if (rol === 'cadete') destino = '/cadete';
    else destino = (next && next !== '/cuenta/perfil') ? next : '/';

    router.push(destino);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="bg-brand-yellow-400 rounded-2xl p-2.5">
              <Store className="w-8 h-8 text-brand-purple-900" />
            </div>
            <div className="text-left">
              <p className="text-brand-yellow-400 font-black text-2xl leading-none">Gustavo 1°</p>
              <p className="text-brand-purple-300 text-xs">Miniservice</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mb-6">
            ¿No tenés cuenta?{' '}
            <Link href="/cuenta/registro" className="text-brand-purple-700 font-semibold hover:underline">
              Registrate gratis
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="email" type="email" value={form.email}
                  onChange={handleChange} required autoComplete="email"
                  placeholder="tu@email.com" className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  required autoComplete="current-password"
                  placeholder="••••••••" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShow(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60">
              {loading
                ? <span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" />
                : <LogIn className="w-4 h-4" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
