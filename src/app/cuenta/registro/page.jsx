'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmar: '',
    telefono: '', direccion: '', barrio: '', ciudad: ''
  });
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [ok, setOk]           = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    setLoading(true);
    const supabase = createClient();

    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre } },
    });

    if (err) {
      setError(err.message.includes('already') ? 'Ya existe una cuenta con ese email' : 'Error al registrarse.');
      setLoading(false);
      return;
    }

    // Actualizar el registro en clientes con todos los datos
    if (data.user) {
      await supabase.from('clientes').upsert({
        id:        data.user.id,
        email:     form.email,
        nombre:    form.nombre,
        apellido:  form.apellido,
        telefono:  form.telefono,
        direccion: form.direccion,
        barrio:    form.barrio,
        ciudad:    form.ciudad,
      });
    }

    setOk(true);
    setLoading(false);
  };

  if (ok) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-500 mb-2">Revisá tu email <strong>{form.email}</strong> para confirmar tu cuenta.</p>
          <p className="text-gray-400 text-sm mb-6">Después podés iniciar sesión.</p>
          <Link href="/cuenta/login" className="btn-primary justify-center">Ir al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/cuenta/login" className="text-brand-purple-700 font-semibold hover:underline">Iniciá sesión</Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Juan" className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Apellido *</label>
                <input name="apellido" value={form.apellido} onChange={handleChange} required placeholder="Pérez" className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  required placeholder="tu@email.com" className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono / WhatsApp</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="11 XXXX-XXXX" className="input" type="tel" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Barrio</label>
                <input name="barrio" value={form.barrio} onChange={handleChange} placeholder="Nombre del barrio" className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ciudad</label>
                <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ciudad" className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, número, piso/dpto" className="input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={handleChange} required placeholder="Mín. 6 caracteres" className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShow(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Repetir contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="confirmar" type={showPass ? 'text' : 'password'} value={form.confirmar}
                    onChange={handleChange} required placeholder="Repetir" className="input pl-10" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2 disabled:opacity-60">
              {loading ? <span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
