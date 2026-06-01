"""
Script: importar_dbf_supabase.py
Importa los productos del STOCKM.DBF a Supabase.

Uso:
    1. Instalar dependencias: pip install dbfread supabase
    2. Crear el archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY
    3. Ejecutar: python scripts/importar_dbf_supabase.py --dbf ruta/STOCKM.DBF

Tablas que crea en Supabase:
    - productos (id, nombre, precio, stock, categoria_id, codigo_barra, etc.)
    - categorias (id, nombre, slug, emoji)
"""

import os, sys, argparse, datetime
from dbfread import DBF

# Mapeado de código interno → categoría
CAT_MAP = {
    'MM09': (1, 'Panadería',        'panaderia',  '🍞'),
    'MM10': (2, 'Comestibles',      'comestibles','🛒'),
    'MM11': (2, 'Comestibles',      'comestibles','🛒'),
    'MM12': (2, 'Comestibles',      'comestibles','🛒'),
    'MM13': (2, 'Comestibles',      'comestibles','🛒'),
    'MM14': (2, 'Comestibles',      'comestibles','🛒'),
    'MM15': (2, 'Comestibles',      'comestibles','🛒'),
    'II01': (2, 'Comestibles',      'comestibles','🛒'),
    'MM01': (3, 'Lácteos',          'lacteos',    '🧀'),
    'MM03': (3, 'Lácteos',          'lacteos',    '🧀'),
    'MM02': (4, 'Bebidas',          'bebidas',    '🥤'),
    'MM16': (5, 'Art. de Limpieza', 'limpieza',   '🧹'),
    'MM17': (5, 'Art. de Limpieza', 'limpieza',   '🧹'),
    'MM05': (6, 'Rotisería',        'rotiseria',  '🍗'),
    'MM06': (9, 'Congelados',       'congelados', '🧊'),
}

def titulo(s):
    s = (s or '').replace('¥','Ñ').replace('¿','').strip()
    minusc = {'x','de','del','la','las','el','los','y','a','con','en','por','c/','al','s/','sin'}
    palabras = s.lower().split()
    return ' '.join(p if (i > 0 and p in minusc) else p.capitalize() for i, p in enumerate(palabras))

def leer_productos(dbf_path, desde_fecha=None):
    """Lee STOCKM.DBF y devuelve lista de productos activos."""
    if desde_fecha is None:
        desde_fecha = datetime.date(2022, 1, 1)

    db = DBF(dbf_path, encoding='latin-1', load=True, ignore_missing_memofile=True)
    productos = []

    for r in db:
        if not r['LISTA1'] or r['LISTA1'] <= 0:
            continue
        if not r['ACTUALIZA1'] or r['ACTUALIZA1'] < desde_fecha:
            continue
        cod = (r['COD_AG'] or '').strip()[:4]
        if cod not in CAT_MAP:
            continue

        cat_id, cat_nombre, cat_slug, cat_emoji = CAT_MAP[cod]
        productos.append({
            'cod_ab':       r['COD_AB'],
            'nombre':       titulo(r['DESCRIP']),
            'precio':       int(r['LISTA1']),
            'stock':        max(0, int(r['EXI_ACT1'] or 0)),
            'unidad':       (r['UNIDAD'] or 'Uni').strip(),
            'categoria_id': cat_id,
            'cod_barra':    str(r['COD_BARRA']) if r['COD_BARRA'] else '',
            'ultima_actualizacion': str(r['ACTUALIZA1']),
            'activo':       True,
        })

    return productos

def importar_a_supabase(productos, supabase_url, supabase_key, batch_size=100):
    """Sube los productos a Supabase en lotes."""
    try:
        from supabase import create_client
    except ImportError:
        print("❌ Instalá el cliente: pip install supabase")
        sys.exit(1)

    client = create_client(supabase_url, supabase_key)

    print(f"🚀 Subiendo {len(productos)} productos a Supabase...")
    errores = 0

    for i in range(0, len(productos), batch_size):
        lote = productos[i:i + batch_size]
        try:
            client.table('productos').upsert(lote, on_conflict='cod_ab').execute()
            print(f"  ✓ Lote {i//batch_size + 1}: {len(lote)} productos")
        except Exception as e:
            print(f"  ✗ Error en lote {i//batch_size + 1}: {e}")
            errores += 1

    print(f"\n✅ Importación completa. Errores: {errores}")

def main():
    parser = argparse.ArgumentParser(description='Importa STOCKM.DBF a Supabase')
    parser.add_argument('--dbf',   required=True, help='Ruta al archivo STOCKM.DBF')
    parser.add_argument('--desde', default='2022-01-01', help='Fecha mínima AAAA-MM-DD (default: 2022-01-01)')
    parser.add_argument('--dry',   action='store_true', help='Solo muestra los productos, no sube')
    args = parser.parse_args()

    desde = datetime.date.fromisoformat(args.desde)
    print(f"📂 Leyendo {args.dbf} (desde {desde})...")
    productos = leer_productos(args.dbf, desde)
    print(f"✓ {len(productos)} productos encontrados")

    if args.dry:
        for p in productos[:10]:
            print(f"  [{p['precio']:>6}] {p['nombre']} (cat={p['categoria_id']})")
        print("  ... (modo dry, no se sube nada)")
        return

    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # service_role key (no la anon)

    if not supabase_url or not supabase_key:
        print("❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env")
        sys.exit(1)

    importar_a_supabase(productos, supabase_url, supabase_key)

if __name__ == '__main__':
    main()
