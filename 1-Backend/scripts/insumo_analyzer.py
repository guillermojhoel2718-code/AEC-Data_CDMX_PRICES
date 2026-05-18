<<<<<<< HEAD
"""
insumo_analyzer.py
==================
APUCMX — Limpieza y normalización masiva del catálogo de insumos con Gemini Flash.

Funciones:
  1. Lee catalogo_apuc_mvp.csv (u otro CSV/Excel con insumos crudos)
  2. Aplica pipeline de limpieza por capas:
     a. Regex + reglas AEC (rápido, sin costo de tokens)
     b. Gemini Flash para casos ambiguos o incompletos
  3. Detecta outliers de precio por categoría
  4. Genera reporte de auditoría en Markdown
  5. Exporta CSV limpio listo para cargar a Supabase (apuc_insumos)

Uso:
  python 1-Backend/scripts/insumo_analyzer.py
  python 1-Backend/scripts/insumo_analyzer.py --input mi_catalogo.csv --limite 500
  python 1-Backend/scripts/insumo_analyzer.py --solo-regex   (sin llamadas a IA)

Requiere:
  pip install pandas python-dotenv langchain-google-genai fuzzywuzzy rich typer
"""

import os
import re
import json
import sys
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

# ─── Setup inicial ────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE  = REPO_ROOT / "1-Backend" / ".env"
if not ENV_FILE.exists():
    ENV_FILE = REPO_ROOT / "5-Variables" / ".env.local"

DATA_DIR    = REPO_ROOT / "1-Backend" / "docs" / "insumos"
OUTPUT_DIR  = REPO_ROOT / "1-Backend" / "docs" / "insumos" / "Procesados"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("insumo_analyzer")

from dotenv import load_dotenv
load_dotenv(ENV_FILE)

import pandas as pd

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# ─── Tablas de normalización AEC ─────────────────────────────────────────────

UNIDADES_CANON = {
    # Área
    "m2": ["m2", "m²", "metro cuadrado", "metros cuadrados", "mts2", "mt2", "m 2"],
    # Volumen
    "m3": ["m3", "m³", "metro cubico", "metros cubicos", "mts3", "mt3", "m 3"],
    # Longitud
    "ml": ["ml", "m.l.", "metro lineal", "metros lineales", "mts", "m.l", "ml."],
    # Pieza
    "pza": ["pza", "pz", "pieza", "piezas", "piece", "pcs", "unidad", "und", "u"],
    # Kilogramo
    "kg": ["kg", "kgr", "kilogramo", "kilogramos", "kilo", "kilos"],
    # Tonelada
    "ton": ["ton", "t", "tonelada", "toneladas", "tn"],
    # Litro
    "lt": ["lt", "l", "litro", "litros", "lts"],
    # Hora
    "hr": ["hr", "h", "hora", "horas", "hrs"],
    # Día
    "dia": ["dia", "día", "dias", "días", "day", "jornada"],
    # Semana
    "sem": ["sem", "semana", "semanas", "wk"],
    # Viaje
    "viaje": ["viaje", "viajes", "vje"],
    # Carga
    "carga": ["carga", "cargas"],
    # Servicio / Global
    "lote": ["lote", "lot", "lts", "global", "gbl", "servicio", "srv"],
    # Metros cuadrados de contacto
    "m2c": ["m2c", "m2 contacto", "m² contacto"],
    # Kilogramo fuerza
    "kgf": ["kgf", "kg/f", "kilogramo fuerza"],
}

# Invertir mapa para lookup rápido
UNIDAD_MAP: dict[str, str] = {}
for canon, variantes in UNIDADES_CANON.items():
    for v in variantes:
        UNIDAD_MAP[v.lower().strip()] = canon

CATEGORIAS_REGEX = [
    (r"concreto|cemento|mortero|mezcla", "CONCRETOS Y MORTEROS"),
    (r"acero|varilla|alambre|malla|fierro", "ACERO Y FIERROS"),
    (r"block|tabique|ladrillo|muro|mamposteria", "MAMPOSTERÍA"),
    (r"arena|grava|tepetate|tezontle|material|terreo|excavaci", "MATERIALES PÉTREOS"),
    (r"madera|tabla|triplay|duela|barrote|vigueta", "MADERA"),
    (r"tubo|codo|tee|valvula|hidraul|sanitario|plomeria", "INSTALACIONES HIDRÁULICAS"),
    (r"cable|conduit|interruptor|contact|elect|panel|cableado", "INSTALACIONES ELÉCTRICAS"),
    (r"pintura|recubrimiento|impermeabil|sellador", "RECUBRIMIENTOS"),
    (r"azulejo|loseta|piso|baldosa|ceramica|porcelanato", "PISOS Y RECUBRIMIENTOS"),
    (r"aluminio|vidrio|ventana|puerta|herreria|cancel", "HERRERÍA Y VIDRIO"),
    (r"mano de obra|oficial|ayudante|pe[oó]n|cuadrilla", "MANO DE OBRA"),
    (r"equipo|maquinaria|retroexcavadora|grua|compactador|vibrad", "EQUIPO Y MAQUINARIA"),
    (r"aditivo|impermeab|sika|basf|euclid", "ADITIVOS"),
    (r"formaleta|cimbra|chaflán|costanera", "CIMBRA Y ENCOFRADO"),
]


# ─── Capa 1: Limpieza por regex (sin IA) ─────────────────────────────────────

def limpiar_descripcion(desc: str) -> str:
    """Normaliza descripción al formato AEC: MAYÚSCULAS, sin dobles espacios."""
    if not isinstance(desc, str) or not desc.strip():
        return "SIN DESCRIPCIÓN"
    d = desc.strip().upper()
    d = re.sub(r'\s+', ' ', d)          # dobles espacios
    d = re.sub(r'["""]', '"', d)         # comillas curvas
    d = re.sub(r"[''']", "'", d)         # apóstrofes curvas
    return d


def normalizar_unidad(unidad: str) -> str | None:
    """Convierte variantes de unidad al código canónico AEC."""
    if not isinstance(unidad, str):
        return None
    return UNIDAD_MAP.get(unidad.lower().strip())


def inferir_categoria(desc: str) -> str:
    """Clasifica por regex; retorna None si no hay match."""
    desc_l = desc.lower()
    for patron, cat in CATEGORIAS_REGEX:
        if re.search(patron, desc_l):
            return cat
    return "SIN CLASIFICAR"


def calcular_nivel_confianza(row: pd.Series) -> float:
    """Score 0-1 basado en qué tan completo está el registro."""
    score = 0.0
    if row.get("descripcion") and row["descripcion"] != "SIN DESCRIPCIÓN":
        score += 0.4
    if row.get("unidad_normalizada"):
        score += 0.2
    if pd.notna(row.get("precio")) and float(row.get("precio", 0) or 0) > 0:
        score += 0.2
    if row.get("categoria") != "SIN CLASIFICAR":
        score += 0.2
    return round(score, 2)


def detectar_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Marca precios que se salen de ±2.5 desviaciones estándar dentro de su categoría.
    Agrega columna 'es_outlier' (bool) y 'z_precio' (float).
    """
    df = df.copy()
    df["es_outlier"] = False
    df["z_precio"]   = 0.0

    for cat in df["categoria"].unique():
        mask  = (df["categoria"] == cat) & df["precio"].notna() & (df["precio"] > 0)
        grupo = df.loc[mask, "precio"]
        if len(grupo) < 5:
            continue
        media = grupo.mean()
        std   = grupo.std()
        if std == 0:
            continue
        z = (df.loc[mask, "precio"] - media) / std
        df.loc[mask, "z_precio"]  = z.round(2)
        df.loc[mask, "es_outlier"] = z.abs() > 2.5

    return df


# ─── Capa 2: Gemini Flash para casos ambiguos ─────────────────────────────────

def gemini_normalizar_lote(filas: list[dict]) -> list[dict]:
    """
    Envía un lote de insumos ambiguos a Gemini Flash para:
    - Completar descripción si está incompleta
    - Inferir unidad si no se pudo por regex
    - Inferir categoría si quedó SIN CLASIFICAR
    - Separar marca comercial del nombre técnico

    Retorna lista de dicts con keys: descripcion, unidad, categoria, nombre_tecnico
    """
    if not GOOGLE_API_KEY or not filas:
        return filas

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.1,      # muy determinista para normalización
            max_output_tokens=2048,
        )

        filas_json = json.dumps(filas, ensure_ascii=False, indent=2)
        prompt = f"""Eres ZETTEL, el homologador AEC de APUCMX. Normaliza estos insumos de construcción mexicana (CDMX, 2026).

REGLAS:
- descripcion: MAYÚSCULAS, técnica, sin marcas comerciales en el nombre principal
- unidad: usa SOLO: pza, m2, m3, ml, kg, ton, lt, hr, dia, viaje, lote, carga, m2c, kgf, sem
- categoria: clasifica en una de: CONCRETOS Y MORTEROS, ACERO Y FIERROS, MAMPOSTERÍA,
  MATERIALES PÉTREOS, MADERA, INSTALACIONES HIDRÁULICAS, INSTALACIONES ELÉCTRICAS,
  RECUBRIMIENTOS, PISOS Y RECUBRIMIENTOS, HERRERÍA Y VIDRIO, MANO DE OBRA,
  EQUIPO Y MAQUINARIA, ADITIVOS, CIMBRA Y ENCOFRADO, OTROS
- nombre_tecnico: nombre genérico sin marca (ej: "CONCRETO PREMEZCLADO" no "CONCRETO CEMEX")
- Si la descripcion ya está bien, devuélvela igual en MAYÚSCULAS

Insumos a normalizar (JSON):
{filas_json}

Responde ÚNICAMENTE con un array JSON del mismo largo, manteniendo el campo "id" original:
[{{"id": ..., "descripcion": "...", "unidad": "...", "categoria": "...", "nombre_tecnico": "..."}}]"""

        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content.strip()

        # Extraer array JSON
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        log.warning(f"  Gemini Flash error en lote: {e}")

    return filas


# ─── Carga de datos ───────────────────────────────────────────────────────────

def cargar_csv(input_path: Path) -> pd.DataFrame:
    """Carga CSV con manejo de múltiples encodings."""
    for enc in ["utf-8", "latin-1", "cp1252", "utf-8-sig"]:
        try:
            df = pd.read_csv(input_path, encoding=enc, low_memory=False)
            log.info(f"  Cargado {len(df)} registros desde {input_path.name} [{enc}]")
            return df
        except Exception:
            continue
    raise ValueError(f"No se pudo leer {input_path} con ningún encoding")


def normalizar_columnas(df: pd.DataFrame) -> pd.DataFrame:
    """
    Homologa los nombres de columna a las esperadas:
    descripcion, unidad, precio, codigo, subcategoria, proveedor
    """
    alias = {
        "description": "descripcion", "desc": "descripcion", "nombre": "descripcion",
        "concepto": "descripcion", "material": "descripcion",
        "unit": "unidad", "uni": "unidad", "ud": "unidad",
        "price": "precio", "costo": "precio", "importe": "precio",
        "code": "codigo", "clave": "codigo", "id": "codigo",
        "subcategory": "subcategoria", "subcat": "subcategoria",
        "supplier": "proveedor", "prov": "proveedor",
    }
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df.rename(columns={k: v for k, v in alias.items() if k in df.columns}, inplace=True)

    # Columnas obligatorias si no existen
    for col in ["descripcion", "unidad", "precio", "codigo"]:
        if col not in df.columns:
            df[col] = None
    return df


# ─── Pipeline principal ───────────────────────────────────────────────────────

def pipeline_limpiar(
    input_path: Path,
    solo_regex: bool = False,
    limite: int = 0,
    tamano_lote_ia: int = 20,
) -> pd.DataFrame:
    """
    Pipeline completo de limpieza:
    1. Carga y normaliza columnas
    2. Limpieza regex capa 1
    3. Gemini Flash para ambiguos (capa 2)
    4. Detección de outliers
    5. Score de confianza
    """
    df = cargar_csv(input_path)
    df = normalizar_columnas(df)

    if limite > 0:
        df = df.head(limite)
        log.info(f"  Modo límite: procesando {limite} registros")

    total = len(df)
    log.info(f"  Iniciando pipeline en {total} registros...")

    # ── Capa 1: Regex ─────────────────────────────────────────────────────────
    log.info("  [1/4] Limpieza regex...")
    df["descripcion"]       = df["descripcion"].apply(limpiar_descripcion)
    df["unidad_original"]   = df["unidad"].copy()
    df["unidad_normalizada"] = df["unidad"].apply(normalizar_unidad)
    df["precio"]             = pd.to_numeric(df["precio"], errors="coerce")
    df["categoria"]          = df["descripcion"].apply(inferir_categoria)

    # ── Capa 2: Gemini Flash para ambiguos ────────────────────────────────────
    ambiguos_mask = (
        (df["unidad_normalizada"].isna()) |
        (df["categoria"] == "SIN CLASIFICAR") |
        (df["descripcion"] == "SIN DESCRIPCIÓN")
    )
    n_ambiguos = ambiguos_mask.sum()
    log.info(f"  [2/4] Gemini Flash para {n_ambiguos} registros ambiguos...")

    if not solo_regex and GOOGLE_API_KEY and n_ambiguos > 0:
        indices_ambiguos = df[ambiguos_mask].index.tolist()

        for i in range(0, len(indices_ambiguos), tamano_lote_ia):
            lote_idx = indices_ambiguos[i:i + tamano_lote_ia]
            lote_filas = []
            for idx in lote_idx:
                lote_filas.append({
                    "id": int(idx),
                    "descripcion": df.at[idx, "descripcion"],
                    "unidad": str(df.at[idx, "unidad_original"] or ""),
                    "precio": float(df.at[idx, "precio"]) if pd.notna(df.at[idx, "precio"]) else None,
                    "categoria": df.at[idx, "categoria"],
                })

            log.info(f"    Lote {i // tamano_lote_ia + 1}: {len(lote_filas)} items → Gemini Flash")
            resultados = gemini_normalizar_lote(lote_filas)

            for r in resultados:
                idx = r.get("id")
                if idx is None or idx not in df.index:
                    continue
                if r.get("descripcion"):
                    df.at[idx, "descripcion"] = r["descripcion"].upper()
                if r.get("unidad") and not df.at[idx, "unidad_normalizada"]:
                    df.at[idx, "unidad_normalizada"] = r["unidad"].lower()
                if r.get("categoria") and df.at[idx, "categoria"] == "SIN CLASIFICAR":
                    df.at[idx, "categoria"] = r["categoria"].upper()
                if r.get("nombre_tecnico"):
                    df.at[idx, "nombre_tecnico"] = r["nombre_tecnico"].upper()

    elif not GOOGLE_API_KEY:
        log.warning("  GOOGLE_API_KEY no configurada — saltando capa Gemini")

    # ── Outliers ──────────────────────────────────────────────────────────────
    log.info("  [3/4] Detección de outliers de precio...")
    df = detectar_outliers(df)

    # ── Score de confianza ────────────────────────────────────────────────────
    log.info("  [4/4] Calculando nivel de confianza...")
    df["nivel_confianza"] = df.apply(calcular_nivel_confianza, axis=1)

    # ── Status para Supabase ──────────────────────────────────────────────────
    df["status"] = df.apply(lambda r: (
        "observado" if r["es_outlier"] else
        "pendiente" if r["nivel_confianza"] < 0.4 else
        "verificar" if r["nivel_confianza"] < 0.7 else
        "listo"
    ), axis=1)

    log.info(f"  Pipeline completado: {total} registros procesados")
    return df


# ─── Reporte de auditoría ─────────────────────────────────────────────────────

def generar_reporte(df: pd.DataFrame, output_dir: Path) -> Path:
    """Genera reporte Markdown de calidad del catálogo."""
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = output_dir / f"reporte_auditoria_{ts}.md"

    total      = len(df)
    listos     = (df["status"] == "listo").sum()
    outliers   = df["es_outlier"].sum()
    sin_unidad = df["unidad_normalizada"].isna().sum()
    sin_cat    = (df["categoria"] == "SIN CLASIFICAR").sum()

    por_cat = df.groupby("categoria").agg(
        total=("descripcion", "count"),
        precio_min=("precio", "min"),
        precio_max=("precio", "max"),
        precio_med=("precio", "median"),
        outliers=("es_outlier", "sum"),
    ).reset_index().sort_values("total", ascending=False)

    lineas = [
        f"# Reporte de Auditoría — Catálogo APUCMX",
        f"**Fecha:** {datetime.now().strftime('%d %b %Y %H:%M')}  ",
        f"**Total registros:** {total}  ",
        f"**Listos para Supabase:** {listos} ({100*listos//total}%)  ",
        f"**Outliers de precio:** {outliers}  ",
        f"**Sin unidad normalizada:** {sin_unidad}  ",
        f"**Sin categoría:** {sin_cat}  ",
        "",
        "## Resumen por Categoría",
        "",
        "| Categoría | Total | Precio Min | Precio Med | Precio Max | Outliers |",
        "|-----------|------:|-----------:|-----------:|-----------:|---------:|",
    ]

    for _, row in por_cat.iterrows():
        lineas.append(
            f"| {row['categoria']} | {int(row['total'])} | "
            f"{row['precio_min']:.2f} | {row['precio_med']:.2f} | {row['precio_max']:.2f} | "
            f"{int(row['outliers'])} |"
        )

    lineas += [
        "",
        "## Outliers Detectados (primeros 20)",
        "",
        "| Descripción | Unidad | Precio | Z-score | Categoría |",
        "|-------------|--------|-------:|--------:|-----------|",
    ]

    top_outliers = df[df["es_outlier"]].nlargest(20, "z_precio")
    for _, row in top_outliers.iterrows():
        lineas.append(
            f"| {row['descripcion'][:60]} | {row.get('unidad_normalizada','?')} | "
            f"{row['precio']:.2f} | {row['z_precio']:.2f} | {row['categoria']} |"
        )

    lineas += [
        "",
        "## Distribución por Status",
        "",
    ]
    for st, cnt in df["status"].value_counts().items():
        lineas.append(f"- **{st}**: {cnt} registros")

    lineas += [
        "",
        "---",
        "_Generado por AGENTE HIGURAMA + Gemini Flash — APUCMX 2026_",
    ]

    path.write_text("\n".join(lineas), encoding="utf-8")
    log.info(f"  Reporte guardado: {path}")
    return path


# ─── Exportar CSV limpio ──────────────────────────────────────────────────────

def exportar_csv(df: pd.DataFrame, output_dir: Path) -> Path:
    """Exporta CSV limpio con columnas en formato Supabase."""
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = output_dir / f"insumos_limpios_{ts}.csv"

    # Columnas de salida para Supabase (tabla apuc_insumos)
    export_cols = {
        "codigo":            "codigo",
        "descripcion":       "descripcion",
        "unidad_normalizada": "unidad",
        "precio":            "precio",
        "categoria":         "categoria",
        "nivel_confianza":   "nivel_confianza",
        "status":            "status",
        "es_outlier":        "es_outlier",
        "z_precio":          "z_precio",
    }
    out_df = pd.DataFrame()
    for src, dst in export_cols.items():
        if src in df.columns:
            out_df[dst] = df[src]

    out_df.to_csv(path, index=False, encoding="utf-8-sig")
    log.info(f"  CSV limpio: {path} ({len(out_df)} registros)")
    return path


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(description="APUCMX — Analizador de Insumos con Gemini Flash")
    parser.add_argument("--input",      default="", help="Ruta al CSV/Excel de entrada")
    parser.add_argument("--limite",     type=int, default=0, help="Procesar solo N registros (0=todos)")
    parser.add_argument("--solo-regex", action="store_true", help="Sin llamadas a Gemini (más rápido)")
    parser.add_argument("--lote-ia",    type=int, default=20, help="Tamaño de lote para Gemini")
    args = parser.parse_args()

    # Buscar archivo de entrada
    if args.input:
        input_path = Path(args.input)
    else:
        # Buscar automáticamente en DATA_DIR
        candidatos = list(DATA_DIR.glob("*.csv")) + list(DATA_DIR.glob("*.xlsx"))
        if not candidatos:
            log.error(f"No se encontró ningún CSV/Excel en {DATA_DIR}")
            log.error("Usa --input <ruta_archivo>")
            sys.exit(1)
        input_path = candidatos[0]
        log.info(f"  Usando archivo detectado: {input_path.name}")

    if not input_path.exists():
        log.error(f"Archivo no encontrado: {input_path}")
        sys.exit(1)

    log.info("=" * 60)
    log.info("  APUCMX — Analizador de Insumos (AGENTE ZETTEL + HIGURAMA)")
    log.info(f"  Archivo:   {input_path.name}")
    log.info(f"  Gemini:    {'activo' if GOOGLE_API_KEY and not args.solo_regex else 'desactivado'}")
    log.info(f"  Límite:    {args.limite or 'todos'}")
    log.info("=" * 60)

    df = pipeline_limpiar(
        input_path,
        solo_regex=args.solo_regex,
        limite=args.limite,
        tamano_lote_ia=args.lote_ia,
    )

    reporte_path = generar_reporte(df, OUTPUT_DIR)
    csv_path     = exportar_csv(df, OUTPUT_DIR)

    # Resumen final
    log.info("")
    log.info("=" * 60)
    log.info(f"  ✓ {len(df)} insumos procesados")
    log.info(f"  ✓ {(df['status']=='listo').sum()} listos para Supabase")
    log.info(f"  ⚠ {df['es_outlier'].sum()} outliers detectados")
    log.info(f"  Reporte: {reporte_path.name}")
    log.info(f"  CSV:     {csv_path.name}")
    log.info("=" * 60)
    log.info("  Siguiente paso: revisar reporte y cargar CSV a Supabase con load_supabase.py")


if __name__ == "__main__":
    main()
