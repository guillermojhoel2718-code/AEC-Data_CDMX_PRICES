"""
APUCMX — Extractor de Insumos.xls
====================================
Fuente: Documentos_Precios/Insumos.xls
Hoja:   'Insumos Eléctricos'

Columnas originales:
  DESCRIPCION      → descripcion
  PRECIO UNITARIO  → precio_unitario
  CLASIFICACION_NLP → subcategoria (auxiliar)

Lógica de campos generados:
  - codigo         : SHA-1(descripcion_norm + unidad) primeros 8 hex — reproducible
  - unidad         : inferida por regex desde la descripción (ver tabla UNIT_RULES)
  - unidad_inferida: True si la unidad fue deducida por regex, False si no aplica
  - categoria      : determinada por prefijos y palabras clave en la descripción
  - fuente         : "Insumos_APUCMX"
  - fecha_fuente   : "2025-05-16" (fecha visible en metadatos del archivo)

Salida: data/processed/insumos_apuc_norm.csv

Uso:
    python scripts/extract_insumos.py
"""

import hashlib
import re
import sys
from pathlib import Path

import pandas as pd

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent
FUENTE     = BASE_DIR / "Documentos_Precios" / "Insumos.xls"
SALIDA_DIR = BASE_DIR / "data" / "processed"
SALIDA     = SALIDA_DIR / "insumos_apuc_norm.csv"

SALIDA_DIR.mkdir(parents=True, exist_ok=True)

# ── Constantes de trazabilidad ─────────────────────────────────────────────────
FUENTE_NOMBRE  = "Insumos_APUCMX"
FECHA_FUENTE   = "2025-05-16"

# ── Tabla de reglas para inferir unidad ───────────────────────────────────────
# Cada entrada: (regex sobre DESCRIPCION en mayúsculas, unidad canónica)
# Se evalúan en orden; se usa la primera coincidencia.
# Si ninguna coincide → unidad = "pza" (piezas, valor de relleno conservador).
UNIT_RULES = [
    # Mano de obra → jornal
    (r"\b(JORNAL|JORNADA|JOR\b|AYUDANTE|ALBAÑIL|OFICIAL|OPERADOR|PEÓN|PEON|CABO|"
     r"ELECTRICISTA|PLOMERO|SOLDADOR|FIERRERO|CARPINTERO|TOPÓGRAFO|TOPOGRAFO)\b",
     "jor"),
    # Metros lineales (antes que m2/m3 para evitar falsos positivos)
    (r"\bML\b|\bM\.L\b|\bMETRO\s+LINEAL\b|\bML\s+\d|\bX\s*\d+(\.\d+)?\s*M\b", "ml"),
    # Metros cuadrados
    (r"\bM2\b|\bM\.2\b|\bM²\b|\bMETRO\s+CUADRADO\b|"
     r"\d+(\.\d+)?\s*X\s*\d+(\.\d+)?\s*M\b|\bM\s+2\b", "m2"),
    # Metros cúbicos
    (r"\bM3\b|\bM\.3\b|\bM³\b|\bMETRO\s+C[ÚU]BICO\b", "m3"),
    # Kilogramos
    (r"\bKG\b|\bKGS\b|\bKILOGRAMO\b|\b\d+(\.\d+)?\s*KG\b", "kg"),
    # Tonelada
    (r"\bTON\b|\bTONELADA\b", "ton"),
    # Litros
    (r"\bLT\b|\bLTS\b|\bLITRO\b|\bLITROS\b|\b\d+\s*LT\b|\bLITER", "lt"),
    # Kilowatt-hora / kVA (equipos eléctricos)
    (r"\bKW\b|\bKWH\b|\bKVA\b|\bKW-H\b", "kw"),
    # Horas (equipo/maquinaria)
    (r"\bHR\b|\bHRS\b|\bHORA\b|\bHORAS\b|\bH\.E\b|\bHR/TUR\b", "hr"),
    # Pieza / juego / lote (explícitos en texto)
    (r"\bJUEGO\b|\bJGO\b|\bSET\b|\bCONJUNTO\b", "jgo"),
    (r"\bLOTE\b|\bLOT\b|\bBULTO\b", "lote"),
    (r"\bPZA\b|\bPIEZA\b|\bPIEZAS\b|\bUNIDAD\b|\bC/U\b|\bCU\b", "pza"),
    # Metros genérico (sin modificador) — va al final
    (r"\bM\b", "m"),
]

# ── Tabla de reglas para inferir categoría ────────────────────────────────────
CATEGORIA_RULES = [
    ("Mano de Obra",      r"\b(AYUDANTE|ALBAÑIL|OFICIAL|OPERADOR|PEÓN|PEON|CABO|"
                          r"ELECTRICISTA|PLOMERO|SOLDADOR|FIERRERO|CARPINTERO|"
                          r"TOPÓGRAFO|TOPOGRAFO|JORNAL|JORNADA)\b"),
    ("Concretos",         r"\b(CONCRETO|MORTERO|APLANADO|FIRME|MEZCLA)\b"),
    ("Aceros",            r"\b(ACERO|VARILLA|MALLA|ALAMBRÓN|ALAMBRON|ELECTROSOLDAD|"
                          r"PERFIL\s+ESTRUCTURAL)\b"),
    ("Albañilería",       r"\b(TABIQUE|BLOCK|LADRILLO|MAMPOSTERÍA|MAMPOSTERIA|"
                          r"TABICON|TEPETATE)\b"),
    ("Materiales Eléctricos",
                          r"\b(CABLE|CONDUCTOR|CONDUIT|CANALIZACIÓN|CANALIZACION|"
                          r"TRANSFORMADOR|TABLERO|INTERRUPTOR|CONTACTO|FUSIBLE|"
                          r"CAJA\s+REGISTRO|CAJA\s+CUADRADA|CAJA\s+RECTANGULAR)\b"),
    ("Tuberías e Hidráulica",
                          r"\b(TUBO|TUBERÍA|TUBERIA|PVC|COBRE|HIDRÁULICO|HIDRAULICO|"
                          r"SANITARIO|VÁLVULA|VALVULA|FITTING)\b"),
    ("Acabados",          r"\b(PINTURA|IMPERMEABILIZANTE|YESO|CANCEL|VIDRIO|CRISTAL|"
                          r"LAMINA|LÁMINA|MOSAICO|AZULEJO|CERÁMICA|CERAMICA)\b"),
    ("Madera y Carpintería",
                          r"\b(MADERA|TRIPLAY|DUELA|DUELA|TABLA|PINO|CEDRO|PUERTA|"
                          r"VENTANA\s+MADERA)\b"),
    ("Herramienta y Equipo",
                          r"\b(HERRAMIENTA|EQUIPO|MAQUINARIA|ANDAMIO|COMPRESORA|"
                          r"VIBRADOR|REVOLVEDORA)\b"),
    ("Materiales Generales",
                          r".*"),  # fallback
]


# ── Funciones auxiliares ───────────────────────────────────────────────────────

def normalizar_texto(texto: str) -> str:
    """Elimina espacios múltiples y lleva a mayúsculas para comparación."""
    return re.sub(r"\s+", " ", str(texto).strip().upper())


def inferir_unidad(descripcion: str) -> tuple[str, bool]:
    """
    Aplica UNIT_RULES sobre la descripción en mayúsculas.
    Devuelve (unidad_canónica, fue_inferida).
    fue_inferida es siempre True aquí (la columna fuente nunca incluye unidad explícita).
    """
    texto = normalizar_texto(descripcion)
    for patron, unidad in UNIT_RULES:
        if re.search(patron, texto):
            return unidad, True
    return "pza", True   # relleno conservador


def inferir_categoria(descripcion: str) -> str:
    """Aplica CATEGORIA_RULES sobre la descripción normalizada."""
    texto = normalizar_texto(descripcion)
    for categoria, patron in CATEGORIA_RULES:
        if re.search(patron, texto):
            return categoria
    return "Materiales Generales"


def generar_codigo(descripcion: str, unidad: str) -> str:
    """
    Genera un código único reproducible:
      SHA-1( normalizar(descripcion) + '|' + unidad ) → primeros 8 caracteres hex.
    Garantiza estabilidad entre ejecuciones.
    Ejemplo: "cable thw calibre 10|ml" → "a3f2c1b9"
    """
    clave = normalizar_texto(descripcion) + "|" + unidad.lower()
    return hashlib.sha1(clave.encode("utf-8")).hexdigest()[:8]


# ── Pipeline principal ────────────────────────────────────────────────────────

def main():
    print(f"[extract_insumos] Leyendo: {FUENTE}")
    if not FUENTE.exists():
        print(f"  ERROR: No se encontró el archivo {FUENTE}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_excel(FUENTE, engine="openpyxl", sheet_name="Insumos Eléctricos")
    print(f"  Filas originales: {len(df)}")

    # -- Limpieza básica --
    df = df.rename(columns={
        "DESCRIPCION":      "descripcion_orig",
        "PRECIO UNITARIO":  "precio_unitario",
        "CLASIFICACION_NLP": "subcategoria_orig",
    })
    df = df.dropna(subset=["descripcion_orig", "precio_unitario"])
    df["precio_unitario"] = pd.to_numeric(df["precio_unitario"], errors="coerce")
    df = df[df["precio_unitario"] > 0].copy()
    print(f"  Filas con precio > 0: {len(df)}")

    # -- Normalizar descripción --
    df["descripcion"] = df["descripcion_orig"].apply(
        lambda x: re.sub(r"\s+", " ", str(x).strip())
    )

    # -- Inferir unidad + flag --
    resultados_unidad = df["descripcion"].apply(inferir_unidad)
    df["unidad"]          = resultados_unidad.apply(lambda t: t[0])
    df["unidad_inferida"] = resultados_unidad.apply(lambda t: t[1])

    # -- Inferir categoría y subcategoría --
    df["categoria"]    = df["descripcion"].apply(inferir_categoria)
    # subcategoria: conservar CLASIFICACION_NLP original si existe, sino usar categoría
    df["subcategoria"] = df["subcategoria_orig"].fillna(df["categoria"])

    # -- Generar código reproducible --
    df["codigo"] = df.apply(
        lambda r: generar_codigo(r["descripcion"], r["unidad"]), axis=1
    )

    # -- Campos de trazabilidad --
    df["fuente"]       = FUENTE_NOMBRE
    df["fecha_fuente"] = FECHA_FUENTE

    # -- Seleccionar columnas del esquema APUC + campo opcional --
    columnas_salida = [
        "codigo",
        "descripcion",
        "unidad",
        "precio_unitario",
        "categoria",
        "subcategoria",
        "fuente",
        "fecha_fuente",
        "unidad_inferida",   # campo opcional: indica si la unidad fue deducida por regex
    ]
    df_out = df[columnas_salida].copy()

    # -- Deduplicar por (descripcion normalizada, unidad) --
    antes = len(df_out)
    df_out = df_out.drop_duplicates(subset=["codigo"])
    print(f"  Duplicados eliminados: {antes - len(df_out)}")
    print(f"  Registros finales: {len(df_out)}")

    # -- Guardar --
    df_out.to_csv(SALIDA, index=False, encoding="utf-8-sig")
    print(f"  Guardado en: {SALIDA}")

    # -- Resumen por categoría --
    print("\n  Distribución por categoría:")
    for cat, cnt in df_out["categoria"].value_counts().items():
        print(f"    {cat:<35} {cnt:>6} registros")

    print("\n  Distribución por unidad inferida:")
    for unidad, cnt in df_out["unidad"].value_counts().items():
        print(f"    {unidad:<10} {cnt:>6} registros")


if __name__ == "__main__":
    main()
