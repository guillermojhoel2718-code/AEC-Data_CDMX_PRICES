"""
APUCMX — Merge y Catálogo Consolidado MVP
==========================================
Combina las dos fuentes normalizadas:
  1. data/processed/insumos_apuc_norm.csv        (~12,058 registros)
  2. data/processed/ppto_reftab_apuc_norm.csv    (~148 registros)

Estrategia de deduplicación:
  - Clave: campo 'codigo' (SHA-1 de descripcion+unidad, reproducible)
  - En caso de conflicto, se prefiere la fuente con fecha_fuente más reciente.
  - Los registros de ppto_reftab tienen mayor trazabilidad de obra real
    (código explícito, fecha real), por lo que se cargan DESPUÉS y prevalecen
    al deduplicar (keep='last').

Salidas:
  data/processed/catalogo_apuc_mvp.csv   — catálogo plano completo
  data/processed/catalogo_apuc_mvp.json  — versión JSON (array de objetos)

Uso:
    python scripts/merge_apuc_catalog.py
"""

import json
import sys
from pathlib import Path

import pandas as pd

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent
PROC_DIR   = BASE_DIR / "data_processed"
FUENTE_1   = PROC_DIR / "insumos_apuc_norm.csv"
FUENTE_2   = PROC_DIR / "ppto_reftab_apuc_norm.csv"
SALIDA_CSV = PROC_DIR / "catalogo_apuc_mvp.csv"
SALIDA_JSON = PROC_DIR / "catalogo_apuc_mvp.json"

# Esquema canónico del catálogo APUC
COLUMNAS_APUC = [
    "codigo",
    "descripcion",
    "unidad",
    "precio_unitario",
    "categoria",
    "subcategoria",
    "fuente",
    "fecha_fuente",
    "unidad_inferida",
    "tipo_registro",
]


def main():
    # -- Verificar que los CSVs fuente existen --
    for f in [FUENTE_1, FUENTE_2]:
        if not f.exists():
            print(f"  ERROR: Falta el archivo {f}", file=sys.stderr)
            print("  Ejecuta primero extract_insumos.py y extract_ppto_reftab.py", file=sys.stderr)
            sys.exit(1)

    # -- Cargar --
    print(f"[merge_apuc_catalog] Cargando fuentes...")
    df1 = pd.read_csv(FUENTE_1, encoding="utf-8-sig", dtype={"codigo": str})
    df2 = pd.read_csv(FUENTE_2, encoding="utf-8-sig", dtype={"codigo": str})
    print(f"  insumos_apuc_norm.csv:     {len(df1):>6} registros")
    print(f"  ppto_reftab_apuc_norm.csv: {len(df2):>6} registros")

    # -- Asegurar columnas idénticas --
    for col in COLUMNAS_APUC:
        if col not in df1.columns:
            df1[col] = None
        if col not in df2.columns:
            df2[col] = None

    df1 = df1[COLUMNAS_APUC]
    df2 = df2[COLUMNAS_APUC]

    # -- Concatenar: df2 al final para que "last" en dedup prevalezca --
    df_total = pd.concat([df1, df2], ignore_index=True)
    print(f"  Total antes de deduplicar: {len(df_total)}")

    # -- Deduplicar por codigo: keep='last' → prevalece ppto_reftab --
    df_dedup = df_total.drop_duplicates(subset=["codigo"], keep="last").copy()
    duplicados = len(df_total) - len(df_dedup)
    print(f"  Duplicados eliminados:     {duplicados}")
    print(f"  Catálogo final:            {len(df_dedup)} registros")

    # -- Unificar categorías mínimas --
    CATEGORIA_CANONICAL = {
        "Material Eléctrico": "Materiales Eléctricos",
        "Material": "Materiales Generales",
        "Materiales": "Materiales Generales",
        "Materiales y Básicos": "Materiales Generales",
        "Herramientas y Equipo": "Herramienta y Equipo",
        "Equipos": "Herramienta y Equipo",
        "Equipo": "Herramienta y Equipo",
    }
    df_dedup["categoria"] = df_dedup["categoria"].replace(CATEGORIA_CANONICAL)

    # -- Añadir tipo_registro --
    def inferir_tipo_registro(row):
        desc = str(row["descripcion"]).upper()
        cat = str(row["categoria"]).upper()
        
        if any(x in desc for x in ["%AND", "%CDO", "%EPP", "%", "PORCENTAJE", "HERRAMIENTA MENOR", "EQUIPO DE SEGURIDAD", "MANDO INTERMEDIO", "MANDO MEDIO"]):
            return "indirecto"
        if "MANO DE OBRA" in cat or any(x in desc for x in ["AYUDANTE", "OFICIAL", "PEÓN", "PEON", "CABO", "JORNAL", "CUADRILLA"]):
            return "mano_obra"
        if "EQUIPO" in cat or "MAQUINARIA" in cat:
            return "equipo"
        return "material"

    df_dedup["tipo_registro"] = df_dedup.apply(inferir_tipo_registro, axis=1)

    # -- Ordenar: por categoria y descripcion --
    df_dedup = df_dedup.sort_values(["categoria", "descripcion"]).reset_index(drop=True)

    # -- Guardar CSV --
    df_dedup.to_csv(SALIDA_CSV, index=False, encoding="utf-8-sig")
    print(f"\n  Guardado CSV: {SALIDA_CSV}")

    # -- Guardar JSON --
    # precio_unitario como float, resto como string
    registros = []
    for _, row in df_dedup.iterrows():
        registros.append({
            "codigo":          row["codigo"],
            "descripcion":     row["descripcion"],
            "unidad":          row["unidad"],
            "precio_unitario": float(row["precio_unitario"]) if row["precio_unitario"] else 0.0,
            "categoria":       row["categoria"],
            "subcategoria":    row["subcategoria"] if pd.notna(row["subcategoria"]) else "",
            "fuente":          row["fuente"],
            "fecha_fuente":    str(row["fecha_fuente"]),
            "unidad_inferida": bool(row["unidad_inferida"]),
            "tipo_registro":   row["tipo_registro"],
        })

    with open(SALIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)
    print(f"  Guardado JSON: {SALIDA_JSON}")

    # -- Resumen final --
    print("\n-- Resumen del Catálogo MVP APUCMX -----------------------------")
    print(f"  Total registros:  {len(df_dedup)}")
    print(f"  Fuentes incluidas: {df_dedup['fuente'].unique().tolist()}")
    print(f"\n  Por categoría:")
    for cat, cnt in df_dedup["categoria"].value_counts().items():
        pct = cnt / len(df_dedup) * 100
        print(f"    {cat:<40} {cnt:>6}  ({pct:.1f}%)")
    print(f"\n  Rango de precios:")
    print(f"    Mín: ${df_dedup['precio_unitario'].min():,.2f} MXN")
    print(f"    Máx: ${df_dedup['precio_unitario'].max():,.2f} MXN")
    print(f"    Med: ${df_dedup['precio_unitario'].median():,.2f} MXN")
    print(f"\n  Unidades inferidas por regex: "
          f"{df_dedup['unidad_inferida'].sum()} de {len(df_dedup)}")
    print("-----------------------------------------------------------------")


if __name__ == "__main__":
    main()
