"""
json_vba_loader.py
==================
APUCMX — Cargador de matrices APU capturadas manualmente (JSON_VBA)

Lee los 149 JSON de la carpeta JSON_VBA, decodifica el texto
en latin-1/cp1252 (acentos), mapea al schema unificado de Supabase
(concept_lines) y los inserta como conceptos 'verified' de CDMX.

Uso:
    python 1-Backend/scripts/json_vba_loader.py

Requiere:
    pip install supabase python-dotenv
"""

import json
import os
import sys
import re
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuración de rutas
# ---------------------------------------------------------------------------
REPO_ROOT   = Path(__file__).resolve().parents[2]
JSON_DIR    = REPO_ROOT / "1-Backend" / "docs" / "insumos" / "Procesados manuales" / "JSON_VBA"
ENV_FILE    = REPO_ROOT / "5-Variables" / ".env.local"
LOG_FILE    = REPO_ROOT / "1-Backend" / "logs" / f"json_vba_load_{datetime.now():%Y%m%d_%H%M%S}.log"

LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger("json_vba_loader")

# ---------------------------------------------------------------------------
# Cargar variables de entorno
# ---------------------------------------------------------------------------
load_dotenv(ENV_FILE)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    log.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env")
    sys.exit(1)

from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------------------------------------------------------
# Constantes de negocio
# ---------------------------------------------------------------------------
REGION         = "CDMX"
STATUS         = "verified"          # JSON_VBA son matrices validadas manualmente
BASICOS_NOTA   = "VERIFICAR: campo 'basicos' vacío — posible error u omisión en captura"
ENCODINGS      = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "windows-1252", "iso-8859-1"]

# Mapa de sección JSON → tipo en concept_lines
TIPO_MAP = {
    "materiales":   "material",
    "mano_de_obra": "mano_obra",
    "equipo":       "equipo",
    "basicos":      "basico",
    "subcontratos": "subcontrato",
}

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
def reparar_json_texto(texto: str) -> str:
    """
    Repara comillas de pulgadas no escapadas dentro de valores JSON.
    Ej: "descripcion": "Barrote de 1 1/2" x 3 1/2" x 8'"
    → busca el valor entre ": " y la coma/llave final, escapa comillas internas.
    """
    def escapar_valor(m: re.Match) -> str:
        clave    = m.group(1)   # "clave": "
        contenido = m.group(2)  # el contenido con comillas sin escapar
        terminador = m.group(3) # "\n o ", ...
        # Escapar comillas internas en el contenido
        contenido_fix = contenido.replace('"', '\\"')
        return f'{clave}"{contenido_fix}"{terminador}'

    # Patrón: "clave": "contenido con "comillas"",
    patron = r'("(?:[^"\\]|\\.)*":\s*)"((?:[^"\\]|\\.)*?(?:"[^",\n\]}]*)*)"(\s*[,\}\]])'
    try:
        reparado = re.sub(patron, escapar_valor, texto)
        return reparado
    except Exception:
        return texto


def cargar_json_con_encoding(path: Path) -> Optional[dict]:
    """
    Intenta decodificar y parsear el JSON con múltiples estrategias:
    1. Encodings estándar (utf-8 primero)
    2. UTF-8 con errors=replace (acepta replacement chars U+FFFD)
    3. Reparación de comillas de pulgadas + re-parse
    4. Latin-1 como último recurso
    """
    raw = path.read_bytes()

    # Estrategia 1: encodings limpios
    for enc in ENCODINGS:
        try:
            texto = raw.decode(enc)
            return json.loads(texto)
        except UnicodeDecodeError:
            continue
        except json.JSONDecodeError:
            # Decodificó pero JSON malformado → intentar reparar con este encoding
            try:
                reparado = reparar_json_texto(texto)
                return json.loads(reparado)
            except json.JSONDecodeError:
                continue

    # Estrategia 2: utf-8 con errors=replace + reparación de comillas
    try:
        texto = raw.decode("utf-8", errors="replace")
        try:
            return json.loads(texto)
        except json.JSONDecodeError:
            reparado = reparar_json_texto(texto)
            return json.loads(reparado)
    except Exception:
        pass

    # Estrategia 3: latin-1 nunca falla en decodificación + reparación
    try:
        texto = raw.decode("latin-1", errors="replace")
        try:
            return json.loads(texto)
        except json.JSONDecodeError:
            reparado = reparar_json_texto(texto)
            return json.loads(reparado)
    except Exception as e:
        log.error(f"  No se pudo decodificar: {path.name} — {e}")
        return None



def normalizar_unidad(raw: str) -> str:
    """Limpia espacios y convierte unidad a minúsculas AEC."""
    return raw.strip().lower() if raw else "pza"


def normalizar_descripcion(raw: str) -> str:
    """Elimina espacios dobles, strip."""
    return re.sub(r"\s+", " ", raw.strip()) if raw else ""


def inferir_tipo_concepto(codigo: str, descripcion: str) -> str:
    """Infiere el tipo de obra del código o descripción."""
    codigo = codigo.upper()
    desc   = descripcion.upper()
    if any(k in codigo for k in ["CIM", "ZAP", "CAD", "FRO"]):
        return "Cimentación"
    if any(k in codigo for k in ["LOS", "CAS", "SIM", "EST"]):
        return "Estructura"
    if any(k in codigo for k in ["ALI", "MOR", "MUR", "APL", "PLI"]):
        return "Albañilería"
    if any(k in codigo for k in ["PIN", "SUM", "ACB", "PIS", "LAV"]):
        return "Acabados"
    if any(k in codigo for k in ["TUB", "HID", "SAL", "AGU", "BON"]):
        return "Hidráulica"
    if any(k in codigo for k in ["ELC", "ELE", "APE", "DUC"]):
        return "Instalaciones Eléctricas"
    if any(k in codigo for k in ["EXC", "REL", "TER"]):
        return "Terracerías"
    if any(k in codigo for k in ["HAB", "ACE", "FAB"]):
        return "Herrería"
    return "Obra Civil"


# ---------------------------------------------------------------------------
# Lógica principal de carga
# ---------------------------------------------------------------------------
def mapear_lineas(analisis: dict, concept_id: str) -> list[dict]:
    """Mapea secciones del JSON a registros para concept_lines."""
    lineas = []
    sort_idx = 0

    for seccion, tipo in TIPO_MAP.items():
        items = analisis.get(seccion, [])

        # Basicos vacíos → nota única
        if seccion == "basicos" and not items:
            lineas.append({
                "id":             str(uuid.uuid4()),
                "concept_id":     concept_id,
                "tipo":           "basico",
                "descripcion":    BASICOS_NOTA,
                "unidad":         "n/a",
                "cantidad":       0,
                "precio_unitario":0,
                "importe":        0,
                "cost_lab":       0,
                "fletes":         0,
                "maniobra":       0,
                "almacenaje":     0,
                "fc_actual":      1.0,
                "fsi":            1.0,
                "fasar":          1.0,
                "nota":           BASICOS_NOTA,
                "sort_order":     sort_idx,
            })
            sort_idx += 1
            continue

        for item in items:
            lineas.append({
                "id":             str(uuid.uuid4()),
                "concept_id":     concept_id,
                # insumo_codigo se deja NULL: la tabla apuc_insumos estará vacía
                # hasta que se ejecute load_supabase.py (última tarea del plan)
                "insumo_codigo":  None,
                "tipo":           tipo,
                "descripcion":    normalizar_descripcion(item.get("descripcion", "")),
                "unidad":         normalizar_unidad(item.get("unidad", "pza")),
                "cantidad":       float(item.get("cantidad", 0)),
                "precio_unitario":float(item.get("precio_unitario", 0)),
                "importe":        float(item.get("importe", 0)),
                # cost_lab = importe (unificado como piden las matrices manuales)
                "cost_lab":       float(item.get("importe", 0)),
                "fletes":         0.0,
                "maniobra":       0.0,
                "almacenaje":     0.0,
                "fc_actual":      1.0,
                "fsi":            1.0,
                "fasar":          1.0,
                "nota":           None,
                "sort_order":     sort_idx,
            })
            sort_idx += 1

    return lineas


def insertar_concepto(data: dict, nombre_archivo: str) -> bool:
    """Inserta un concepto y sus líneas en Supabase."""
    concept_id = str(uuid.uuid4())

    codigo_raw   = data.get("codigo_matriz", nombre_archivo.replace(".json", ""))
    descripcion  = normalizar_descripcion(data.get("descripcion", codigo_raw))
    precio_total = float(data.get("precio_total_validado", 0))
    unidad       = normalizar_unidad(data.get("unidad", "pza"))
    analisis     = data.get("analisis", {})

    tipo_obra = inferir_tipo_concepto(codigo_raw, descripcion)

    # 1) Insertar concepto
    concepto_row = {
        "id":          concept_id,
        "user_id":     None,            # matrices seed sin propietario
        "name":        descripcion,
        "description": descripcion,
        "region":      REGION,
        "unit":        unidad,
        "price":       precio_total,
        "type":        tipo_obra,
        "overhead":    "0",
        "status":      STATUS,
        "cedia_score": 100,
        "cedia_feedback": f"Matriz capturada manualmente. Código original: {codigo_raw}",
    }

    res_c = supabase.table("concepts").insert(concepto_row).execute()
    if hasattr(res_c, "error") and res_c.error:
        log.error(f"  ERROR concepto {nombre_archivo}: {res_c.error}")
        return False

    # 2) Mapear líneas y insertar en lotes
    lineas = mapear_lineas(analisis, concept_id)
    if lineas:
        LOTE = 50
        for i in range(0, len(lineas), LOTE):
            res_l = supabase.table("concept_lines").insert(lineas[i:i+LOTE]).execute()
            if hasattr(res_l, "error") and res_l.error:
                log.warning(f"  ERROR líneas lote {i//LOTE+1} de {nombre_archivo}: {res_l.error}")

    return True


def main():
    archivos = sorted(JSON_DIR.glob("*.json"))
    total    = len(archivos)

    log.info("=" * 60)
    log.info("  APUCMX — Cargador de matrices JSON_VBA")
    log.info(f"  Directorio : {JSON_DIR}")
    log.info(f"  Archivos   : {total}")
    log.info(f"  Inicio     : {datetime.now():%Y-%m-%d %H:%M:%S}")
    log.info("=" * 60)

    ok = 0
    errores = []

    for idx, archivo in enumerate(archivos, 1):
        log.info(f"[{idx:>3}/{total}] {archivo.name}")
        data = cargar_json_con_encoding(archivo)

        if data is None:
            errores.append(archivo.name)
            continue

        exito = insertar_concepto(data, archivo.name)
        if exito:
            ok += 1
        else:
            errores.append(archivo.name)

    log.info("=" * 60)
    log.info("  RESUMEN")
    log.info(f"  OK      : {ok}")
    log.info(f"  Errores : {len(errores)}")
    if errores:
        log.warning("  Archivos con error:")
        for e in errores:
            log.warning(f"    - {e}")
    log.info(f"  Log     : {LOG_FILE}")
    log.info(f"  Fin     : {datetime.now():%Y-%m-%d %H:%M:%S}")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
