'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, User, Shield, Mail, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading]  = useState(true);

  const cargar = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, email, telefono, rol, ciudad, barrio, creado_en')
      .order('creado_en', { ascending: false });
    setUsuarios(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return !q ||
      (u.nombre   || '').toLowerCase().includes(q) ||
      (u.apellido || '').toLowerCase().includes(q) ||
      (u.email    || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-brand-yellow-400">Gestión de Usuarios</h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="input pl-10 bg-white"
            />
          </div>
          <span className="self-center text-sm text-gray-500 whitespace-nowrap">
            {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Ciudad</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-purple-100 flex items-center justify-center flex-shrink-0">
                          {u.rol === 'admin'
                            ? <Shield className="w-4 h-4 text-brand-purple-700" />
                            : <User className="w-4 h-4 text-brand-purple-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {[u.nombre, u.apellido].filter(Boolean).join(' ') || 'Sin nombre'}
                          </p>
                          {/* Email visible en mobile debajo del nombre */}
                          <p className="text-xs text-gray-400 md:hidden">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.email
                        ? <a href={`mailto:${u.email}`} className="text-brand-purple-600 hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />{u.email}
                          </a>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {u.telefono || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {[u.ciudad, u.barrio].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.rol === 'admin'
                          ? 'bg-brand-purple-100 text-brand-purple-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.rol === 'admin' ? '👑 Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                      {u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-AR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {busqueda ? 'No hay resultados para esa búsqueda' : 'No hay usuarios registrados'}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-brand-purple-50 rounded-xl border border-brand-purple-100">
          <p className="text-xs text-brand-purple-700 font-medium">
            💡 Para asignar rol admin a un usuario, cambiá el campo <code className="bg-white px-1 rounded">rol</code> a <code className="bg-white px-1 rounded">'admin'</code> directamente en Supabase → Table Editor → clientes.
          </p>
        </div>
      </div>
    </div>
  );
}
