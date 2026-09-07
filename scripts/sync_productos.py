#!/usr/bin/env python3
"""
sync_productos.py
-----------------
Sincroniza los productos exportados del miniservice a Supabase.

Modelo de datos
---------------
Supabase guarda el catálogo COMPLETO del miniservice (~6000 productos). La
página web muestra solo un subconjunto curado, el de `publicado = true`.

  · `precio`, `stock` y `activo` los maneja este script: se actualizan en cada
    corrida para todos los productos, estén publicados o no.
  · `publicado` lo maneja una persona desde Admin → Gestión de Productos. El
    script solo lo toca para despublicar una baja (un producto publicado que
    dejó de venir en el JSON).
  · `carga_manual = true` marca los productos dados de alta a mano en el panel.
    No existen en el miniservice, así que quedan afuera de esa despublicación.

Requiere la migración scripts/migracion_publicado.sql aplicada.

Uso:
    python sync_productos.py                          # busca el JSON más reciente en CARPETA_JSON
    python sync_productos.py productos-xxx.json       # usa ese archivo específico
    python sync_productos.py productos-xxx.json --dry # simula, no escribe nada
    python sync_productos.py ... --forzar-bajas       # permite despublicar más de LIMITE_BAJAS
    python sync_productos.py ... --sin-chequeo-fecha  # acepta un export viejo

Sale con código != 0 si algo falló, para que el Programador de Tareas lo detecte.

Instalación (una sola vez):
    pip install requests
"""

import json
import os
import re
import glob
import sys
import logging
import time
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Falta el paquete 'requests'. Ejecutá: pip install requests")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
#  CONFIGURACIÓN — completar antes de usar
# ─────────────────────────────────────────────────────────────────────────────

SUPABASE_URL = "https://olecculgbgmsegubnpsl.supabase.co"

# Service Role Key (NO la anon key): Supabase → Settings → API → "service_role secret".
# Se lee del entorno para que la clave no quede escrita en el archivo:
#     set SUPABASE_SERVICE_KEY=eyJ...      (cmd)
#     $env:SUPABASE_SERVICE_KEY="eyJ..."   (PowerShell)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Carpeta donde el miniservice guarda los JSON exportados
# Podés usar la carpeta de Descargas, Documentos, o donde lo exportes
CARPETA_JSON = r"C:\Users\lnach\Documents"

# Patrón del nombre de archivo del JSON exportado
PATRON_JSON = "productos-*.json"

# Freno para exports viejos o incompletos. Un JSON desactualizado no contiene
# los productos dados de alta después de generarlo, y sin este límite la
# despublicación de bajas los sacaría de la web en silencio.
LIMITE_BAJAS = 25

# Antigüedad máxima del export, en horas. Si el miniservice no generó el archivo
# (PC apagada, export fallido), encontrar_json_reciente() devolvería el de ayer
# o uno de hace meses, y se resincronizarían precios viejos como si fueran de
# hoy. En una corrida desatendida eso pasa sin que nadie se entere.
MAX_ANTIGUEDAD_HORAS = 20

# ─────────────────────────────────────────────────────────────────────────────


# Log: guarda historial en sync_log.txt al lado del script
LOG_FILE = Path(__file__).parent / "sync_log.txt"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger()


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers HTTP (Supabase REST API directa, sin SDK extra)
# ─────────────────────────────────────────────────────────────────────────────

# Lotes que Supabase rechazó. Se revisa al final para salir con código != 0:
# el .bat y el Programador de Tareas necesitan ese código para saber que algo
# falló, y un warning en el log no alcanza porque nadie lo mira a diario.
LOTES_FALLIDOS = []


def headers_base():
    return {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type":  "application/json",
    }


def sb_get_all(tabla: str, columnas: str) -> list:
    """Trae TODOS los registros de una tabla (maneja paginación automática)."""
    url     = f"{SUPABASE_URL}/rest/v1/{tabla}?select={columnas}"
    results = []
    PAGE    = 1000
    offset  = 0

    while True:
        h = {**headers_base(), "Range-Unit": "items", "Range": f"{offset}-{offset+PAGE-1}"}
        r = requests.get(url, headers=h, timeout=30)
        r.raise_for_status()
        batch = r.json()
        results.extend(batch)
        if len(batch) < PAGE:
            break
        offset += PAGE

    return results


def sb_insert_batch(tabla: str, registros: list, batch_size=500) -> int:
    """Inserta registros en lotes. Devuelve la cantidad insertada."""
    url = f"{SUPABASE_URL}/rest/v1/{tabla}"
    h   = {**headers_base(), "Prefer": "return=minimal"}
    total = 0

    for i in range(0, len(registros), batch_size):
        lote = registros[i:i+batch_size]
        r    = requests.post(url, headers=h, json=lote, timeout=60)
        if not r.ok:
            log.warning(f"  ⚠  Error insertando lote {i//batch_size+1}: {r.status_code} {r.text[:200]}")
            LOTES_FALLIDOS.append(("insert", i//batch_size+1, r.status_code))
        else:
            total += len(lote)

    return total


def sb_upsert_batch(tabla: str, registros: list, batch_size=500) -> int:
    """
    Upsert por clave primaria (id). Actualiza SOLO los campos provistos.
    No toca foto_url, categoria, descripcion_web, destacado, oferta, etc.
    """
    url = f"{SUPABASE_URL}/rest/v1/{tabla}"
    h   = {**headers_base(), "Prefer": "resolution=merge-duplicates,return=minimal"}
    total = 0

    for i in range(0, len(registros), batch_size):
        lote = registros[i:i+batch_size]
        r    = requests.post(url, headers=h, json=lote, timeout=60)
        if not r.ok:
            log.warning(f"  ⚠  Error actualizando lote {i//batch_size+1}: {r.status_code} {r.text[:200]}")
            LOTES_FALLIDOS.append(("update", i//batch_size+1, r.status_code))
        else:
            total += len(lote)

    return total


# ─────────────────────────────────────────────────────────────────────────────
#  Procesamiento del JSON
# ─────────────────────────────────────────────────────────────────────────────

def leer_json(path: str) -> list:
    """
    Lee el JSON del miniservice.
    Maneja:
      - Codificación cp1252 (Windows)
      - Coma trailing al final del array (bug del miniservice)
    """
    with open(path, "rb") as f:
        raw = f.read()

    texto = raw.decode("cp1252", errors="replace")
    # Quitar coma trailing antes del ] final → ",\n]" → "\n]"
    texto = re.sub(r",(\s*\])\s*$", r"\1", texto)
    return json.loads(texto)


def limpiar_nombre(s: str) -> str:
    """Convierte a Title Case limpio (como lo hace la web)."""
    if not s:
        return ""
    # Caracteres mal codificados comunes del miniservice
    s = s.replace("�", "ñ").replace("Ñ", "Ñ")
    minusc = {"x","de","del","la","las","el","los","y","a","con","en","por","al","s/","sin","kg","lt","ml","gr","grs","cc"}
    palabras = s.lower().split()
    return " ".join(
        p if (i > 0 and p in minusc) else p[0].upper() + p[1:]
        for i, p in enumerate(palabras)
    )


def mapear(p: dict) -> dict:
    """Convierte un registro del JSON al formato de la tabla `productos`."""
    precio = float(p.get("lista1") or 0)
    stock  = int(p.get("exi_act1") or 0)
    return {
        "codigo":      str(p["cod_ab"]),
        "descripcion": limpiar_nombre(str(p.get("descrip", ""))),
        "precio":      precio,
        "stock":       max(0, stock),   # no mostrar stock negativo en la web
        "activo":      precio > 0,
        "unidad":      "Uni",
        # `publicado` queda en false (default de la tabla): un producto entra a
        # la base con el import, pero a la página lo sube una persona desde
        # Admin → Gestión de Productos. El script NUNCA escribe esta columna
        # salvo para despublicar una baja (ver sincronizar()).
        "publicado":   False,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Sincronización principal
# ─────────────────────────────────────────────────────────────────────────────

def sincronizar(json_path: str, dry: bool = False, forzar_bajas: bool = False):
    t0 = time.time()
    log.info("=" * 60)
    log.info(f"Inicio sincronización: {json_path}" + ("  [SIMULACIÓN]" if dry else ""))

    # 1. Leer JSON
    productos_raw = leer_json(json_path)
    log.info(f"Productos en JSON:      {len(productos_raw):,}")

    # 2. Traer productos existentes de Supabase (id + codigo)
    log.info("Consultando Supabase...")
    try:
        existentes_lista = sb_get_all("productos", "id,codigo,publicado,carga_manual")
    except requests.HTTPError as e:
        if e.response is not None and "publicado" in e.response.text:
            log.error("⛔  Falta la columna `publicado`. Corré scripts/migracion_publicado.sql en Supabase antes de sincronizar.")
            sys.exit(1)
        raise
    existentes = {str(p["codigo"]): p["id"] for p in existentes_lista if p.get("codigo")}
    log.info(f"Productos en Supabase:  {len(existentes):,}")

    # 3. Clasificar
    nuevos       = []   # insertar con todos los campos
    a_actualizar = []   # solo actualizar precio, stock, activo

    for p in productos_raw:
        m      = mapear(p)
        codigo = m["codigo"]

        if codigo in existentes:
            # SOLO actualizar precio, stock y activo — no tocar fotos, categorías, etc.
            a_actualizar.append({
                "id":     existentes[codigo],
                "precio": m["precio"],
                "stock":  m["stock"],
                "activo": m["activo"],
            })
        else:
            nuevos.append(m)

    # Bajas: lo que está publicado y ya no viene en el JSON se saca de la web.
    # No se toca lo cargado a mano desde el panel — eso no existe en el
    # miniservice, así que nunca va a aparecer en el export.
    codigos_json = {str(p["cod_ab"]) for p in productos_raw}
    a_despublicar = [
        {"id": p["id"], "publicado": False}
        for p in existentes_lista
        if p.get("publicado")
        and not p.get("carga_manual")
        and str(p.get("codigo")) not in codigos_json
    ]

    log.info(f"Productos nuevos:       {len(nuevos):,}")
    log.info(f"Productos a actualizar: {len(a_actualizar):,}")
    log.info(f"Bajas a despublicar:    {len(a_despublicar):,}")

    # 4. Freno: un JSON viejo no trae los productos dados de alta después de
    #    generarlo, y esos aparecen acá como bajas sin serlo.
    if len(a_despublicar) > LIMITE_BAJAS and not forzar_bajas:
        log.error(
            f"⛔  {len(a_despublicar):,} productos publicados no aparecen en el JSON "
            f"(el límite es {LIMITE_BAJAS}). Casi siempre significa que el export "
            f"está desactualizado. Revisá con --dry y, si las bajas son reales, "
            f"volvé a correr con --forzar-bajas."
        )
        sys.exit(1)

    if dry:
        log.info("Simulación: no se escribió nada en Supabase.")
        if a_despublicar:
            ids = [str(p["id"]) for p in a_despublicar]
            log.info("Se despublicarían los id: " + ", ".join(ids[:50])
                     + (" ..." if len(ids) > 50 else ""))
        log.info("")
        return

    # 5. Insertar nuevos
    if nuevos:
        n = sb_insert_batch("productos", nuevos)
        log.info(f"  ✅ Insertados: {n:,}")

    # 6. Actualizar existentes (solo precio/stock/activo)
    if a_actualizar:
        n = sb_upsert_batch("productos", a_actualizar)
        log.info(f"  ✅ Actualizados: {n:,}")

    # 7. Despublicar las bajas
    if a_despublicar:
        n = sb_upsert_batch("productos", a_despublicar)
        log.info(f"  ✅ Despublicados: {n:,}")

    elapsed = time.time() - t0

    if LOTES_FALLIDOS:
        log.error(f"⛔  {len(LOTES_FALLIDOS)} lotes fallaron; los datos quedaron incompletos.")
        for tipo, nro, code in LOTES_FALLIDOS[:10]:
            log.error(f"     {tipo} lote {nro}: HTTP {code}")
        log.info("")
        sys.exit(1)

    log.info(f"Sincronización completada en {elapsed:.1f}s ✓")
    log.info("")


# ─────────────────────────────────────────────────────────────────────────────

def antiguedad_horas(path: str) -> float:
    """
    Horas desde que el miniservice generó el export.

    Se saca del nombre (productos-AAAAMMDDHHMMSS.json) y no de la fecha del
    archivo: copiar o mover un archivo actualiza su mtime, así que un export de
    hace tres meses puede figurar como recién creado. Si el nombre no tiene el
    formato esperado, se cae al mtime como aproximación.
    """
    m = re.search(r"(\d{14})", os.path.basename(path))
    if m:
        try:
            generado = datetime.strptime(m.group(1), "%Y%m%d%H%M%S")
            return (datetime.now() - generado).total_seconds() / 3600
        except ValueError:
            pass
    return (time.time() - os.path.getmtime(path)) / 3600


def encontrar_json_reciente() -> str | None:
    archivos = glob.glob(os.path.join(CARPETA_JSON, PATRON_JSON))
    if not archivos:
        return None
    return max(archivos, key=os.path.getmtime)


if __name__ == "__main__":
    # Verificar configuración
    if not SUPABASE_SERVICE_KEY:
        log.error("⛔  Falta la variable de entorno SUPABASE_SERVICE_KEY (service_role).")
        sys.exit(1)

    # Tiene que ser la service_role, no la anon/publishable: la anon solo ve los
    # productos publicados, así que el script tomaría a los no publicados como
    # nuevos e insertaría duplicados.
    if SUPABASE_SERVICE_KEY.startswith("sb_publishable_"):
        log.error("⛔  Esa es la clave pública (anon). Hace falta la service_role: Supabase → Settings → API.")
        sys.exit(1)

    dry               = "--dry" in sys.argv
    forzar_bajas      = "--forzar-bajas" in sys.argv
    sin_chequeo_fecha = "--sin-chequeo-fecha" in sys.argv

    # Ruta del JSON: el primer argumento que no sea una opción.
    posicionales = [a for a in sys.argv[1:] if not a.startswith("-")]
    ruta = posicionales[0] if posicionales else encontrar_json_reciente()

    if not ruta or not os.path.exists(ruta):
        log.error(f"No se encontró ningún JSON en: {CARPETA_JSON}\\{PATRON_JSON}")
        log.error("Pasá el archivo como argumento: python sync_productos.py ruta\\productos.json")
        sys.exit(1)

    # El export tiene que ser de hoy. Si el miniservice no lo generó, el archivo
    # más reciente de la carpeta es viejo y sincronizarlo revierte los precios.
    horas = antiguedad_horas(ruta)
    if horas > MAX_ANTIGUEDAD_HORAS and not sin_chequeo_fecha:
        log.error(
            f"⛔  El export tiene {horas:.0f} horas de antigüedad (el máximo es "
            f"{MAX_ANTIGUEDAD_HORAS}): {os.path.basename(ruta)}"
        )
        log.error("     Revisá que el miniservice haya generado el archivo de hoy.")
        log.error("     Para sincronizar igual: --sin-chequeo-fecha")
        sys.exit(1)

    sincronizar(ruta, dry=dry, forzar_bajas=forzar_bajas)
