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
    python sync_productos.py                         # busca el JSON más reciente en CARPETA_JSON
    python sync_productos.py productos-xxx.json      # usa ese archivo específico

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

def sincronizar(json_path: str):
    t0 = time.time()
    log.info("=" * 60)
    log.info(f"Inicio sincronización: {json_path}")

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

    # 4. Insertar nuevos
    if nuevos:
        n = sb_insert_batch("productos", nuevos)
        log.info(f"  ✅ Insertados: {n:,}")

    # 5. Actualizar existentes (solo precio/stock/activo)
    if a_actualizar:
        n = sb_upsert_batch("productos", a_actualizar)
        log.info(f"  ✅ Actualizados: {n:,}")

    # 6. Despublicar las bajas
    if a_despublicar:
        n = sb_upsert_batch("productos", a_despublicar)
        log.info(f"  ✅ Despublicados: {n:,}")

    elapsed = time.time() - t0
    log.info(f"Sincronización completada en {elapsed:.1f}s ✓")
    log.info("")


# ─────────────────────────────────────────────────────────────────────────────

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

    # Ruta del JSON
    if len(sys.argv) > 1:
        ruta = sys.argv[1]
    else:
        ruta = encontrar_json_reciente()

    if not ruta or not os.path.exists(ruta):
        log.error(f"No se encontró ningún JSON en: {CARPETA_JSON}\\{PATRON_JSON}")
        log.error("Pasá el archivo como argumento: python sync_productos.py ruta\\productos.json")
        sys.exit(1)

    sincronizar(ruta)
