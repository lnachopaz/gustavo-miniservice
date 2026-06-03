'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, User, Shield, Mail, Phone,
  Pencil, Lock, Unlock, Trash2, Save, X, Bike,
  AlertTriangle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ROLES = ['usuario', 'cadete']; // 'admin' solo se asigna desde Supabase

const ROL_CFG = {
  admin:   { label: '👑 Admin',   color: 'bg-brand-purple-100 text-brand-purple-800' },
  cadete:  { label: '🏍 Cadete',  color: 'bg-blue-100 text-blue-800' },
  usuario: { label: 'Cliente',    color: 'bg-gray-100 text-gray-600' },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios]       = useState([]);
  const [busqueda, setBusqueda]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [editando, setEditando]       = useState(null);   // id en edición
  const [editForm, setEditForm]       = useState({});
  const [guardando, setGuardando]     = useState(false);
  const [confirmDel, setConfirmDel]   = useState(null);   // id a eliminar
  const [expandido, setExpand]        = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('clientes')
      .select('*')
      .order('creado_en', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setUsuarios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  // ── Edición ──────────────────────────────────────────────
  const abrirEdicion = (u) => {
    setEditando(u.id);
    setEditForm({
      nombre:    u.nombre    || '',
      apellido:  u.apellido  || '',
      telefono:  u.telefono  || '',
      ciudad:    u.ciudad    || '',
      barrio:    u.barrio    || '',
      direccion: u.direccion || '',
      rol:       u.rol       || 'usuario',
    });
    setExpand(u.id);
  };

  const guardar = async (id) => {
    setGuardando(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('clientes')
      .update(editForm)
      .eq('id', id);

    if (err) {
      alert(`Error al guardar: ${err.message}`);
    } else {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...editForm } : u));
      setEditando(null);
    }
    setGuardando(false);
  };

  // ── Bloquear / desbloquear ──────────────────────────────
  const toggleBloquear = async (u) => {
    const nuevo = !u.bloqueado;
    const supabase = createClient();
    const { error: err } = await supabase
      .from('clientes')
      .update({ bloqueado: nuevo })
      .eq('id', u.id);

    if (err) {
      alert(`Error: ${err.message}`);
    } else {
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, bloqueado: nuevo } : x));
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const eliminar = async (id) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (err) {
      alert(`Error al eliminar: ${err.message}`);
    } else {
      setUsuarios(prev => prev.filter(u => u.id !== id));
    }
    setConfirmDel(null);
  };

  // ── Filtrado ──────────────────────────────────────────────
  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return !q ||
      (u.nombre   || '').toLowerCase().includes(q) ||
      (u.apellido || '').toLowerCase().includes(q) ||
      (u.email    || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-brand-yellow-400">Gestión de Usuarios</h1>
        </div>
        <button onClick={cargar} className="text-brand-purple-300 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Buscador */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="input pl-10 bg-white w-full" />
          </div>
          <span className="self-center text-sm text-gray-500 whitespace-nowrap">
            {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Error RLS */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold text-sm">No se pudieron cargar los usuarios</p>
              <p className="text-red-500 text-xs mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2 font-medium">
                → Ejecutá el SQL de políticas RLS en Supabase para que el admin pueda ver todos los usuarios.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(u => {
              const cfg       = ROL_CFG[u.rol] || ROL_CFG.usuario;
              const esEditando = editando === u.id;
              const esExpand  = expandido === u.id || esEditando;
              const esBorrar  = confirmDel === u.id;

              return (
                <div key={u.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  u.bloqueado ? 'border-red-200 opacity-75' : 'border-gray-100'
                }`}>

                  {/* Fila principal */}
                  <div className="p-4 flex items-center gap-3 flex-wrap">

                    {/* Avatar + nombre */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        u.bloqueado
                          ? 'bg-red-100'
                          : u.rol === 'admin'  ? 'bg-brand-purple-100'
                          : u.rol === 'cadete' ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {u.rol === 'admin'  ? <Shield className="w-5 h-5 text-brand-purple-700" />
                        : u.rol === 'cadete' ? <Bike className="w-5 h-5 text-blue-600" />
                        : <User className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-none">
                          {[u.nombre, u.apellido].filter(Boolean).join(' ') || 'Sin nombre'}
                          {u.bloqueado && (
                            <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                              BLOQUEADO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email || '—'}</p>
                      </div>
                    </div>

                    {/* Rol badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {/* Teléfono */}
                    <span className="text-xs text-gray-400 hidden sm:block flex-shrink-0">
                      {u.telefono || '—'}
                    </span>

                    {/* Fecha */}
                    <span className="text-xs text-gray-400 hidden md:block flex-shrink-0">
                      {u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-AR') : '—'}
                    </span>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Editar — solo si NO es admin */}
                      {u.rol !== 'admin' && (
                        <button onClick={() => esEditando ? setEditando(null) : abrirEdicion(u)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-purple-700 hover:bg-brand-purple-50 transition-colors"
                          title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      {/* Bloquear / Desbloquear — solo si NO es admin */}
                      {u.rol !== 'admin' && (
                        <button onClick={() => toggleBloquear(u)}
                          className={`p-2 rounded-lg transition-colors ${
                            u.bloqueado
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={u.bloqueado ? 'Desbloquear' : 'Bloquear'}>
                          {u.bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Eliminar — solo si NO es admin */}
                      {u.rol !== 'admin' && (
                        <button onClick={() => setConfirmDel(esBorrar ? null : u.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Expandir */}
                      <button onClick={() => setExpand(esExpand ? null : u.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        {esExpand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmación de eliminación */}
                  {esBorrar && (
                    <div className="bg-red-50 border-t border-red-100 px-4 py-3 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-medium flex-1">
                        ¿Eliminar a {u.nombre || u.email} permanentemente?
                      </p>
                      <button onClick={() => eliminar(u.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                        Sí, eliminar
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        className="bg-white border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl">
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Panel expandido: info + edición */}
                  {esExpand && !esBorrar && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 fade-in">
                      {esEditando ? (
                        /* Formulario de edición */
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                            Editando usuario
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Nombre</label>
                              <input value={editForm.nombre}
                                onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                                className="input text-sm py-1.5 w-full" placeholder="Nombre" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Apellido</label>
                              <input value={editForm.apellido}
                                onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))}
                                className="input text-sm py-1.5 w-full" placeholder="Apellido" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Teléfono</label>
                              <input value={editForm.telefono}
                                onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))}
                                className="input text-sm py-1.5 w-full" placeholder="11 XXXX-XXXX" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Rol</label>
                              <select value={editForm.rol}
                                onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))}
                                className="input text-sm py-1.5 w-full">
                                {ROLES.map(r => (
                                  <option key={r} value={r}>
                                    {ROL_CFG[r]?.label || r}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Ciudad</label>
                              <input value={editForm.ciudad}
                                onChange={e => setEditForm(f => ({ ...f, ciudad: e.target.value }))}
                                className="input text-sm py-1.5 w-full" placeholder="Ciudad" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-semibold block mb-1">Barrio</label>
                              <input value={editForm.barrio}
                                onChange={e => setEditForm(f => ({ ...f, barrio: e.target.value }))}
                                className="input text-sm py-1.5 w-full" placeholder="Barrio" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold block mb-1">Dirección</label>
                            <input value={editForm.direccion}
                              onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))}
                              className="input text-sm py-1.5 w-full" placeholder="Calle, número..." />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => guardar(u.id)} disabled={guardando}
                              className="flex items-center gap-1.5 bg-brand-purple-800 hover:bg-brand-purple-900 disabled:opacity-50 text-brand-yellow-400 font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                              <Save className="w-4 h-4" />
                              {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => setEditando(null)}
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vista de detalle */
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Email</p>
                            <p className="text-gray-800">{u.email || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Teléfono</p>
                            <p className="text-gray-800">{u.telefono || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Ciudad</p>
                            <p className="text-gray-800">{[u.ciudad, u.barrio].filter(Boolean).join(', ') || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Dirección</p>
                            <p className="text-gray-800">{u.direccion || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">ID</p>
                            <p className="text-gray-500 font-mono">{u.id.slice(0, 12)}…</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold mb-0.5">Estado</p>
                            <p className={u.bloqueado ? 'text-red-600 font-semibold' : 'text-green-600'}>
                              {u.bloqueado ? 'Bloqueado' : 'Activo'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filtrados.length === 0 && !loading && !error && (
              <div className="text-center py-12 text-gray-400">
                {busqueda ? 'No hay resultados' : 'No hay usuarios registrados'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
