'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Search, Upload, ImageIcon, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { categorias } from '@/data/mockData';
import { formatPrecio } from '@/lib/productos';

const EMPTY = {
  codigo: '', descripcion: '', descripcion_web: '', precio: '', precio_anterior: '',
  categoria: 'Almacén General', stock: '', unidad: 'unidad',
  oferta: false, destacado: false, activo: true, foto_url: '', cod_barra: '',
};

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [catFiltro, setCat]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const supabase = createClient();

  // PostgREST devuelve como máximo 1000 filas por request: hay que paginar o
  // el panel muestra solo una parte del catálogo.
  const cargar = async () => {
    const PAGINA = 1000;
    const filas = [];

    for (let pagina = 0; pagina < 20; pagina++) {
      const desde = pagina * PAGINA;
      const { data, error } = await supabase
        .from('productos').select('*')
        .order('categoria').order('descripcion').order('id')
        .range(desde, desde + PAGINA - 1);

      if (error) break;
      filas.push(...(data || []));
      if (!data || data.length < PAGINA) break;
    }

    setProductos(filas);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear  = () => { setForm(EMPTY); setModal('crear'); };
  const abrirEditar = p  => {
    setForm({ ...p, precio: String(p.precio), precio_anterior: String(p.precio_anterior || ''), stock: String(p.stock || '') });
    setModal(p.id);
  };
  const cerrar = () => setModal(null);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const subirImagen = async file => {
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('productos').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path);
      setForm(p => ({ ...p, foto_url: publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      precio:          Number(form.precio),
      precio_anterior: form.precio_anterior ? Number(form.precio_anterior) : null,
      stock:           Number(form.stock) || 0,
      actualizado_en:  new Date().toISOString(),
    };
    if (modal === 'crear') {
      await supabase.from('productos').insert([payload]);
    } else {
      await supabase.from('productos').update(payload).eq('id', modal);
    }
    await cargar();
    setSaving(false);
    cerrar();
  };

  const handleEliminar = async id => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('productos').update({ activo: false }).eq('id', id);
    await cargar();
  };

  const filtrados = productos.filter(p => {
    const q = busqueda.toLowerCase();
    return (!q || (p.descripcion || '').toLowerCase().includes(q)) &&
           (!catFiltro || p.categoria === catFiltro);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-brand-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-brand-yellow-400 flex-1">Gestión de Productos</h1>
        <button onClick={abrirCrear} className="btn-secondary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />Nuevo producto
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..." className="input pl-10 bg-white" />
          </div>
          <select value={catFiltro} onChange={e => setCat(e.target.value)} className="input bg-white w-auto">
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
          <span className="self-center text-sm text-gray-500">{filtrados.length} productos</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Categoría</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Precio</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Tags</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.foto_url
                          ? <img src={p.foto_url} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                        }
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.descripcion}</p>
                          {p.codigo && <p className="text-xs text-gray-400">#{p.codigo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.categoria}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-purple-800">{formatPrecio(p.precio)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {p.oferta && <span className="badge bg-red-100 text-red-700 text-[10px]">Oferta</span>}
                        {p.destacado && <span className="badge bg-brand-purple-100 text-brand-purple-700 text-[10px]">⭐</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => abrirEditar(p)}
                          className="p-1.5 text-gray-500 hover:text-brand-purple-700 hover:bg-brand-purple-50 rounded-lg transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEliminar(p.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length === 0 && <div className="text-center py-12 text-gray-400">No hay productos</div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-gray-900 text-lg">
                {modal === 'crear' ? 'Nuevo producto' : 'Editar producto'}
              </h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Foto */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Foto</label>
                <div className="flex gap-3 items-start">
                  {form.foto_url
                    ? <img src={form.foto_url} className="w-20 h-20 rounded-xl object-cover border" />
                    : <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                  }
                  <div className="flex-1 space-y-2">
                    <input value={form.foto_url}
                      onChange={e => setForm(p => ({ ...p, foto_url: e.target.value }))}
                      className="input text-xs" placeholder="URL de imagen" />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="btn-outline text-xs py-1.5 px-3">
                      <Upload className="w-3 h-3" />
                      {uploading ? 'Subiendo...' : 'Subir archivo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && subirImagen(e.target.files[0])} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Código</label>
                  <input name="codigo" value={form.codigo} onChange={handleChange}
                    className="input" placeholder="Código interno" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Código de barra</label>
                  <input name="cod_barra" value={form.cod_barra} onChange={handleChange}
                    className="input" placeholder="(opcional)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del producto *</label>
                <input name="descripcion" value={form.descripcion} onChange={handleChange}
                  required className="input" placeholder="Nombre del producto" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción web</label>
                <textarea name="descripcion_web" value={form.descripcion_web} onChange={handleChange}
                  className="input resize-none" rows={2} placeholder="Descripción para la página web" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio *</label>
                  <input name="precio" value={form.precio} onChange={handleChange}
                    required type="number" min="0" className="input" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Precio anterior (tachado)</label>
                  <input name="precio_anterior" value={form.precio_anterior} onChange={handleChange}
                    type="number" min="0" className="input" placeholder="(opcional)" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
                  <select name="categoria" value={form.categoria} onChange={handleChange} className="input">
                    {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock</label>
                  <input name="stock" value={form.stock} onChange={handleChange}
                    type="number" min="0" className="input" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidad</label>
                  <select name="unidad" value={form.unidad} onChange={handleChange} className="input">
                    {['unidad','kg','litro','paquete','botella','porción'].map(u =>
                      <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="oferta" checked={form.oferta} onChange={handleChange}
                    className="w-4 h-4 accent-brand-purple-700" />
                  <span className="text-sm font-medium text-gray-700">En oferta 🔥</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange}
                    className="w-4 h-4 accent-brand-purple-700" />
                  <span className="text-sm font-medium text-gray-700">Destacado ⭐</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {saving ? <span className="w-4 h-4 border-2 border-brand-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={cerrar} className="btn-outline px-4">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
