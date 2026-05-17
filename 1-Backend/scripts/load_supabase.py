"""
load_supabase.py — APUCMX Pipeline v1.1
========================================
Carga el catálogo maestro de insumos AEC desde el CSV procesado
hacia la tabla `apuc_insumos` en Supabase, usando upsert por `codigo`.

Uso:
    python scripts/load_supabase.py

Variables de entorno requeridas (en .env.local o exportadas en shell):
    SUPABASE_URL              → URL del proyecto (https://xxxx.supabase.co)
    SUPABASE_SERVICE_ROLE_KEY → Clave service_role (NUNCA la anon key)

Dependencias:
    pip install supabase python-dotenv
"""

import os
import sys
import csv
import hashlib
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Carga de variables de entorno desde .env.local (si existe)
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    # Busca .env.local en 5-Variables en la raíz del proyecto (dos niveles arriba de scripts/)
    env_path = Path(__file__).parent.parent.parent / "5-Variables" / ".env.local"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[ENV] Variables cargadas desde: {env_path}")
    else:
        # Intenta fallback a 5-Variables/.env
        env_path_std = Path(__file__).parent.parent.parent / "5-Variables" / ".env"
        if env_path_std.exists():
            load_dotenv(dotenv_path=env_path_std)
            print(f"[ENV] Variables cargadas desde: {env_path_std}")
        else:
            load_dotenv()  # intenta .env estándar en el directorio de trabajo como fallback
except ImportError:
    pass  # Si python-dotenv no está instalado, usa las variables del shell

# ---------------------------------------------------------------------------
# Validación de credenciales (sin exponer los valores)
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print(
        "\n[ERROR] Faltan variables de entorno:\n"
        "  SUPABASE_URL              → URL del proyecto Supabase\n"
        "  SUPABASE_SERVICE_ROLE_KEY → Clave service_role\n\n"
        "Define estas variables en .env.local o expórtalas en tu terminal antes de ejecutar.\n"
    )
    sys.exit(1)

# Inicialización del cliente Supabase con la service_role key
# (service_role bypassa RLS y permite escritura en apuc_insumos)
try:
    from supabase import create_client, Client
except ImportError:
    print(
        "[ERROR] El paquete 'supabase' no está instalado.\n"
        "Instálalo con:  pip install supabase\n"
    )
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ---------------------------------------------------------------------------
# Ruta del CSV de entrada
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CSV_PATH = PROJECT_ROOT / "Datos_Procesados" / "data" / "processed" / "catalogo_apuc_mvp.csv"

if not CSV_PATH.exists():
    print(f"[ERROR] No se encontró el CSV en: {CSV_PATH}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Lógica de derivación de tipo_registro
# Prioridad: columna 'tipo_registro' del CSV; si está vacía o desconocida,
# se infiere por categoría/descripción (misma lógica del pipeline v1.1).
# ---------------------------------------------------------------------------
TIPOS_VALIDOS = {"material", "mano_obra", "equipo", "indirecto"}

# Palabras clave en la descripción → mano_obra
KEYWORDS_MANO_OBRA = {
    "oficial", "ayudante", "peón", "peon", "albanil", "albañil",
    "maestro obra", "soldador", "carpintero", "operador", "maniobra",
    "jornada", "jornal", "hr.", "h.h.", "hh ", "hora hombre",
}

# Palabras clave en la descripción → equipo
KEYWORDS_EQUIPO = {
    "compactador", "vibrador", "revolvedora", "maquinaria", "equipo",
    "excavadora", "retroexcavadora", "grúa", "grua", "andamio", "bomba",
    "compresora", "generador", "motoconformadora", "camión", "camion",
    "tractor", "cargador", "pipas", "trailer",
}

# Categorías explícitas del CSV → mano_obra
CATEGORIAS_MANO_OBRA = {"mano de obra", "mano_obra"}

# Categorías explícitas del CSV → equipo
CATEGORIAS_EQUIPO = {
    "maquinaria", "equipo", "herramientas", "maquinaria y equipo",
}

# Categorías explícitas del CSV → indirecto
CATEGORIAS_INDIRECTO = {
    "indirecto", "indirectos", "gastos indirectos", "overhead",
}


def derivar_tipo_registro(row: dict) -> str:
    """
    Determina el tipo_registro de un insumo.

    Orden de prioridad:
      1. Columna 'tipo_registro' del CSV si es válida.
      2. Inferencia por categoría (normalizada).
      3. Inferencia por palabras clave en descripción.
      4. Fallback: 'material'.
    """
    # 1. Columna existente y válida
    tipo_csv = row.get("tipo_registro", "").strip().lower()
    if tipo_csv in TIPOS_VALIDOS:
        return tipo_csv

    categoria = row.get("categoria", "").strip().lower()
    descripcion = row.get("descripcion", "").strip().lower()

    # 2. Por categoría
    if categoria in CATEGORIAS_MANO_OBRA:
        return "mano_obra"
    if categoria in CATEGORIAS_EQUIPO:
        return "equipo"
    if categoria in CATEGORIAS_INDIRECTO:
        return "indirecto"

    # 3. Por palabras clave en descripción
    for kw in KEYWORDS_MANO_OBRA:
        if kw in descripcion:
            return "mano_obra"
    for kw in KEYWORDS_EQUIPO:
        if kw in descripcion:
            return "equipo"

    # 4. Fallback
    return "material"


# ---------------------------------------------------------------------------
# Lectura del CSV y construcción de registros
# ---------------------------------------------------------------------------
def leer_csv(path: Path) -> list[dict]:
    """Lee el CSV y retorna una lista de dicts listos para upsert."""
    registros = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Precio unitario: convertir a float; si falla, usar 0
            try:
                precio = float(row.get("precio_unitario", 0) or 0)
            except (ValueError, TypeError):
                precio = 0.0

            # Fecha fuente: conservar como string ISO (YYYY-MM-DD) o None
            fecha_fuente = row.get("fecha_fuente", "").strip() or None

            # Derivar tipo_registro con la lógica del pipeline
            tipo = derivar_tipo_registro(row)

            # Hash SHA-256 de la descripción normalizada (integridad básica)
            desc_normalizada = row.get("descripcion", "").strip().upper()
            hash_sha256 = hashlib.sha256(desc_normalizada.encode("utf-8")).hexdigest()

            registro = {
                "codigo":          row.get("codigo", "").strip(),
                "descripcion":     row.get("descripcion", "").strip(),
                "unidad":          row.get("unidad", "PZA").strip() or "PZA",
                "precio_unitario": precio,
                "categoria":       row.get("categoria", "").strip() or None,
                "subcategoria":    row.get("subcategoria", "").strip() or None,
                "tipo_registro":   tipo,
                "fuente":          row.get("fuente", "Insumos_APUCMX").strip(),
                "fecha_fuente":    fecha_fuente,
                "nivel_confianza": 3,   # confianza media por defecto
                "activo":          True,
                "hash_sha256":     hash_sha256,
            }

            # Saltar filas sin código
            if not registro["codigo"]:
                continue

            registros.append(registro)

    return registros


# ---------------------------------------------------------------------------
# Upsert en lotes hacia Supabase
# ---------------------------------------------------------------------------
BATCH_SIZE = 500  # Supabase acepta hasta ~1 000 filas por llamada; usamos 500

def upsert_lote(registros: list[dict]) -> tuple[int, int, list[dict]]:
    """
    Hace upsert de un lote de registros en apuc_insumos.
    Retorna (insertados_aprox, actualizados_aprox, fallidos).

    Nota: Supabase upsert no distingue entre INSERT y UPDATE; el conteo
    exacto requeriría lógica adicional con SELECT previo. Aquí se reporta
    el total de registros procesados exitosamente.
    """
    try:
        response = (
            supabase.table("apuc_insumos")
            .upsert(registros, on_conflict="codigo")
            .execute()
        )
        # response.data contiene los registros afectados
        n_ok = len(response.data) if response.data else len(registros)
        return n_ok, 0, []
    except Exception as e:
        # Si falla el lote, reportar todos como fallidos con el motivo
        fallidos = [{"codigo": r.get("codigo", "?"), "error": str(e)} for r in registros]
        return 0, 0, fallidos


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  APUCMX — Carga a Supabase (apuc_insumos)")
    print(f"  CSV: {CSV_PATH}")
    print(f"  Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. Leer CSV
    print("\n[1/3] Leyendo catálogo CSV...")
    registros = leer_csv(CSV_PATH)
    print(f"      Total registros leídos: {len(registros):,}")

    if not registros:
        print("[AVISO] El CSV está vacío o no tiene filas válidas. Abortando.")
        sys.exit(0)

    # Contadores globales
    total_ok = 0
    total_fallidos: list[dict] = []

    # 2. Upsert en lotes
    print(f"\n[2/3] Cargando en lotes de {BATCH_SIZE} filas...")
    total_lotes = (len(registros) + BATCH_SIZE - 1) // BATCH_SIZE
    for i in range(0, len(registros), BATCH_SIZE):
        lote = registros[i : i + BATCH_SIZE]
        lote_num = i // BATCH_SIZE + 1
        print(f"      Lote {lote_num}/{total_lotes}  ({len(lote)} filas)...", end=" ")
        ok, _, fallidos_lote = upsert_lote(lote)
        total_ok += ok
        total_fallidos.extend(fallidos_lote)
        estado = "✓" if not fallidos_lote else f"✗ ({len(fallidos_lote)} errores)"
        print(estado)

    # 3. Resumen
    print("\n" + "=" * 60)
    print("  RESUMEN DE CARGA")
    print("=" * 60)
    print(f"  Registros procesados OK : {total_ok:,}")
    print(f"  Fallidos                : {len(total_fallidos):,}")

    if total_fallidos:
        print("\n  Detalle de fallidos (primeros 20):")
        for f in total_fallidos[:20]:
            print(f"    • codigo={f['codigo']}  →  {f['error']}")
        if len(total_fallidos) > 20:
            print(f"    ... y {len(total_fallidos) - 20} más.")

        # Guardar log de errores
        log_path = PROJECT_ROOT / "data" / "processed" / "load_errors.log"
        with open(log_path, "w", encoding="utf-8") as lf:
            lf.write(f"Carga ejecutada: {datetime.now().isoformat()}\n\n")
            for f in total_fallidos:
                lf.write(f"codigo={f['codigo']}  error={f['error']}\n")
        print(f"\n  Log de errores guardado en: {log_path}")

    print(f"\n  Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    return 0 if not total_fallidos else 1


if __name__ == "__main__":
    sys.exit(main())
