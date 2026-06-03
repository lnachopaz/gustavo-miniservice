'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, LogOut, Save, ShoppingBag, ChevronRight, Store, Home } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser]     = useState(null);
  const [form, setForm]     = useState({ nombre: '', apellido: '', telefono: '', direccion: '', barrio: '', ciudad: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/cuenta/login'); return; }
      setUser(user);

      const { data } = await supabase.from('clientes').select('*').eq('id', user.id).single();
      if (data) setForm({
        nombre:    data.nombre    || '',
        apellido:  data.spellido  || '',   // columna "spellido" en la BD
        telefono:  data.telefono  || '',
        direccion: data.direccion || '',
        barrio:    data.barrio    || '',
        ciudad:    data.ciudad    || '',
      });
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('clientes').update({
      nombre:    form.nombre,
      spellido:  form.apellido,
      telefono:  form.telefono,
      direccion: form.direccion,
      barrio:    form.barrio,
      ciudad:    form.ciudad,
    }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="container-max py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mi cuenta</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
          <LogOut className="w-4 h-4" />Salir
        </button>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/cuenta/historial" className="card p-4 flex items-center gap-3 hover:border-brand-purple-300 transition-all">
          <div className="bg-brand-purple-100 text-brand-purple-700 p-2 rounded-xl"><ShoppingBag className="w-5 h-5" /></div>
          <div><p className="font-semibold text-sm text-gray-900">Mis pedidos</p><p className="text-xs text-gray-500">Ver historial</p></div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
        <Link href="/" className="card p-4 flex items-center gap-3 hover:border-brand-purple-300 transition-all">
          <div className="bg-brand-yellow-100 text-brand-yellow-700 p-2 rounded-xl"><Store className="w-5 h-5" /></div>
          <div><p className="font-semibold text-sm text-gray-900">Ver productos</p><p className="text-xs text-gray-500">Hacer un pedido</p></div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* Formulario */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-5">Datos personales</h2>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-5">
            ✓ Datos guardados correctamente
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  className="input pl-10" placeholder="Tu nombre" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Apellido</label>
              <input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                className="input" placeholder="Tu apellido" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                className="input pl-10" placeholder="11 XXXX-XXXX" type="tel" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
                className="input pl-10 resize-none" rows={2} placeholder="Calle, número, piso/dpto" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Barrio</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.barrio} onChange={e => setForm(p => ({ ...p, barrio: e.target.value }))}
                  className="input pl-10" placeholder="Nombre del barrio" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ciudad</label>
              <input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))}
                className="input" placeholder="Ciudad" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
