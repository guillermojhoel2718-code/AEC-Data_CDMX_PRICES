"""
APUCMX — Extractor de Ppto_Gestion_Prueba_02.xlsm → hoja 02_REF_TAB
======================================================================
Fuente: Documentos_Precios/Ppto_Gestion_Prueba_02.xlsm
Hoja:   '02_REF_TAB'

Columnas originales:
  Código       → codigo (original del sistema, más hash de respaldo)
  Concepto     → descripcion
  Unidad       → unidad (explícita en la fuente)
  Precio       → precio_unitario
  Fecha        → fecha_fuente (fecha real del insumo en obra)
  Cantidad / Importe / % Incidencia → descartados (no pertenecen al esquema APU unitario)

Lógica de campos generados:
  - codigo         : se usa el código original del archivo cuando existe; si no,
                     SHA-1(descripcion_norm + unidad)[:8] — mismo mecanismo que extract_insumos.py
  - unidad_inferida: False — la unidad viene EXPLÍCITA desde la fuente
  - categoria      : inferida desde el prefijo del código (MT-EE, MT-ED, MO-, %AND, etc.)
  - subcategoria   : sub-prefijo del código cuando es informativo
  - fuente         : "Dyven_CDMX_2023-2024"

Prefijos de código observados:
  MT-EE-*   → Material Eléctrico / Equipos
  MT-ED-*   → Material Eléctrico / Distribución
  MO-*      → Mano de Obra
  %AND      → Andamios (indirecto)
  %CDO      → Cabos de Oficios (indirecto)
  CABO*     → Mano de Obra auxiliar
  (otros)   → Materiales Generales

Salida: data/processed/ppto_reftab_apuc_norm.csv

Uso:
    python scripts/extract_ppto_reftab.py
"""

import hashlib
import re
import sys
from pathlib import Path

import pandas as pd

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent
FUENTE     = BASE_DIR / "data_raw" / "Documentos_Precios" / "Ppto_Gestion_Prueba_02.xlsm"
SALIDA_DIR = BASE_DIR / "data_processed"
SALIDA     = SALIDA_DIR / "ppto_reftab_apuc_norm.csv"

SALIDA_DIR.mkdir(parents=True, exist_ok=True)

FUENTE_NOMBRE = "Dyven_CDMX_2023-2024"
FECHA_FALLBACK = "2023-01-01"  # fecha de respaldo si no viene en el registro


# ── Normalización de unidades ─────────────────────────────────────────────────
# Las unidades en 02_REF_TAB son EXPLÍCITAS. Solo se normaliza el texto.
UNIT_NORM = {
    "M":    "m",   "ML": "ml",  "ML.": "ml",
    "M2":   "m2",  "M²": "m2",
    "M3":   "m3",  "M³": "m3",
    "KG":   "kg",  "KGS": "kg",
    "TON":  "ton",
    "LT":   "lt",  "LTS": "lt",
    "HR":   "hr",  "HRS": "hr",
    "PZA":  "pza", "PZ":  "pza",
    "JOR":  "jor",
    "JGO":  "jgo", "JGO.": "jgo",
    "LOTE": "lote",
    "%":    "%",
    "%M.O.": "%mo",
}


def normalizar_unidad(unidad: str) -> str:
    """Normaliza unidad explícita de la fuente."""
    clean = str(unidad).strip().upper()
    return UNIT_NORM.get(clean, clean.lower()[:6])


# ── Inferencia de categoría desde prefijo de código ──────────────────────────
def inferir_categoria_subcategoria(codigo: str) -> tuple[str, str]:
    """
    Determina (categoria, subcategoria) a partir del prefijo del código.

    Tabla de prefijos:
      MT-EE-*  → Material Eléctrico / Equipos de Alta Tensión
      MT-ED-*  → Material Eléctrico / Distribución y Canalización
      MT-*     → Material (genérico)
      MO-*     → Mano de Obra
      %AND     → Indirectos / Andamios
      %CDO     → Indirectos / Cabos de Oficios
      %*       → Indirectos
      CABO*    → Mano de Obra / Auxiliar
      (otro)   → Material General
    """
    c = str(codigo).strip().upper()

    if c.startswith("MT-EE"):
        return "Material Eléctrico", "Equipos de Alta Tensión"
    if c.startswith("MT-ED"):
        return "Material Eléctrico", "Distribución y Canalización"
    if c.startswith("MT-"):
        return "Material", "General"
    if c.startswith("MO-") or c.startswith("CABO"):
        return "Mano de Obra", "Electricidad"
    if c.startswith("%AND"):
        return "Indirectos", "Andamios"
    if c.startswith("%CDO") or c.startswith("%CABO"):
        return "Indirectos", "Cabos de Oficios"
    if c.startswith("%"):
        return "Indirectos", "Otros"
    return "Material", "General"


# ── Generación de código reproducible ────────────────────────────────────────
def generar_codigo_hash(descripcion: str, unidad: str) -> str:
    """
    SHA-1(descripcion_normalizada + '|' + unidad)[:8].
    Mismo mecanismo que extract_insumos.py → garantiza consistencia entre fuentes.
    """
    clave = re.sub(r"\s+", " ", str(descripcion).strip().upper()) + "|" + unidad.lower()
    return hashlib.sha1(clave.encode("utf-8")).hexdigest()[:8]


# ── Pipeline principal ────────────────────────────────────────────────────────

def main():
    print(f"[extract_ppto_reftab] Leyendo: {FUENTE}")
    if not FUENTE.exists():
        print(f"  ERROR: No se encontró el archivo {FUENTE}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_excel(FUENTE, engine="openpyxl", sheet_name="02_REF_TAB", header=0)
    print(f"  Filas originales: {len(df)}")
    print(f"  Columnas: {list(df.columns)}")

    # -- Renombrar --
    df = df.rename(columns={
        "Código":   "codigo_orig",
        "Concepto": "descripcion",
        "Unidad":   "unidad_orig",
        "Precio":   "precio_unitario",
        "Fecha":    "fecha_orig",
    })

    # -- Filtrar: requiere descripción y precio --
    df = df.dropna(subset=["descripcion", "precio_unitario"])
    df["precio_unitario"] = pd.to_numeric(df["precio_unitario"], errors="coerce")
    df = df[df["precio_unitario"] > 0].copy()
    df = df.dropna(subset=["codigo_orig"])   # requiere código original
    print(f"  Filas con código, descripción y precio > 0: {len(df)}")

    # -- Normalizar descripción --
    df["descripcion"] = df["descripcion"].apply(
        lambda x: re.sub(r"\s+", " ", str(x).strip())
    )

    # -- Normalizar unidad (EXPLÍCITA — unidad_inferida = False) --
    df["unidad"]          = df["unidad_orig"].apply(normalizar_unidad)
    df["unidad_inferida"] = False

    # -- Fecha fuente: extraer solo la fecha (sin hora) --
    df["fecha_fuente"] = df["fecha_orig"].apply(
        lambda x: str(x)[:10] if pd.notna(x) else FECHA_FALLBACK
    )

    # -- Código: usar el original cuando existe; hash como respaldo --
    def resolver_codigo(row):
        cod_orig = str(row["codigo_orig"]).strip()
        if cod_orig and cod_orig.upper() != "NAN" and len(cod_orig) >= 3:
            return cod_orig
        # respaldo: hash por descripcion+unidad
        return generar_codigo_hash(row["descripcion"], row["unidad"])

    df["codigo"] = df.apply(resolver_codigo, axis=1)

    # -- Categoría y subcategoría desde prefijo de código --
    cat_sub = df["codigo_orig"].apply(inferir_categoria_subcategoria)
    df["categoria"]   = cat_sub.apply(lambda t: t[0])
    df["subcategoria"] = cat_sub.apply(lambda t: t[1])

    # -- Fuente --
    df["fuente"] = FUENTE_NOMBRE

    # -- Seleccionar esquema APUC + campo opcional --
    columnas_salida = [
        "codigo",
        "descripcion",
        "unidad",
        "precio_unitario",
        "categoria",
        "subcategoria",
        "fuente",
        "fecha_fuente",
        "unidad_inferida",   # False en esta fuente: unidad venía explícita
    ]
    df_out = df[columnas_salida].copy()

    # -- Deduplicar --
    antes = len(df_out)
    df_out = df_out.drop_duplicates(subset=["codigo"])
    print(f"  Duplicados eliminados: {antes - len(df_out)}")
    print(f"  Registros finales: {len(df_out)}")

    # -- Guardar --
    df_out.to_csv(SALIDA, index=False, encoding="utf-8-sig")
    print(f"  Guardado en: {SALIDA}")

    # -- Resumen --
    print("\n  Distribución por categoría:")
    for cat, cnt in df_out["categoria"].value_counts().items():
        print(f"    {cat:<40} {cnt:>4} registros")

    print("\n  Distribución por unidad:")
    for unidad, cnt in df_out["unidad"].value_counts().items():
        print(f"    {unidad:<10} {cnt:>4} registros")


if __name__ == "__main__":
    main()
