"""
seed_concepts.py
================
Siembra 3 conceptos semilla en Supabase para demo APUCMX.
Tablas afectadas: concepts | concept_lines | concept_overcost
Sin modificar schema. Sin tocar frontend.

Fuente de insumos: data/processed/catalogo_apuc_mvp.json (Insumos_APUCMX 2025-05-16)
Autor: APUCMX Data Engineering
Fecha: 2026-04-13
"""

import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client

from pathlib import Path
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / "5-Variables" / ".env.local"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[ENV] Variables cargadas desde: {env_path}")
    else:
        env_path_std = Path(__file__).parent.parent.parent / "5-Variables" / ".env"
        if env_path_std.exists():
            load_dotenv(dotenv_path=env_path_std)
            print(f"[ENV] Variables cargadas desde: {env_path_std}")
        else:
            load_dotenv()
except ImportError:
    pass

# ─────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "\n[ERROR] Faltan variables de entorno:\n"
        "  SUPABASE_URL              → URL del proyecto Supabase\n"
        "  SUPABASE_SERVICE_ROLE_KEY → Clave service_role (o SUPABASE_KEY)\n\n"
        "Define estas variables en .env.local o expórtalas en tu terminal antes de ejecutar.\n"
    )
    sys.exit(1)

# ─────────────────────────────────────────
# DATOS DE CONCEPTOS
# ─────────────────────────────────────────
# Estructura concept_overcost: usa defaults del schema.
# indirecto_honorarios=5, financiamiento=2, utilidad=10 (estándar CMIC)

CONCEPTS = [
    # ─── CONCEPTO 1: Concreto/Cimentación ───────────────────────────────
    {
        "concept": {
            "id": "CONC-ZAPT-M200-001",
            "name": "Concreto f'c=200 kg/cm² en zapatas aisladas",
            "price": "2850.00",
            "unit": "m3",
            "region": "CDMX",
            "status": "pending",
            "type": "Albañilería",
            "overhead": "1.2450",
            "cedia_score": 0,
            "adoption_count": 0,
            "apuc_credits_earned": 0,
            "cedia_feedback": (
                "Concepto semilla. Fuente: Insumos_APUCMX 2025-05-16. "
                "Rendimientos referencia CMIC Vivienda 2023."
            ),
        },
        "lines": [
            {
                "insumo_codigo": "de58e8a4",
                "tipo": "material",
                "descripcion": "CEMENTO (GRIS) PORTLAND TIPO II PUZÓLANICO",
                "unidad": "TON",
                "cantidad": 0.35,
                "cost_lab": 3982.75,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 1,
            },
            {
                "insumo_codigo": "7725a8cd",
                "tipo": "material",
                "descripcion": "ARENA DE MINA",
                "unidad": "M3",
                "cantidad": 0.65,
                "cost_lab": 550.00,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 2,
            },
            {
                "insumo_codigo": "dd848680",
                "tipo": "material",
                "descripcion": "GRAVA DE MINA T.M.A. 19 MM Ø (3/4), M3",
                "unidad": "M3",
                "cantidad": 0.85,
                "cost_lab": 340.00,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 3,
            },
            {
                "insumo_codigo": "64b23f46",
                "tipo": "mano_obra",
                "descripcion": "PEÓN",
                "unidad": "JOR",
                "cantidad": 0.50,
                "cost_lab": 1152.75,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 4,
            },
            {
                "insumo_codigo": "ff452b56",
                "tipo": "mano_obra",
                "descripcion": "AYUDANTE ALBAÑIL",
                "unidad": "JOR",
                "cantidad": 0.25,
                "cost_lab": 781.08,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 5,
            },
        ],
        "overcost": {
            "indirecto_honorarios": 5.0,
            "indirecto_depreciacion": 2.0,
            "indirecto_servicios": 1.0,
            "indirecto_gastos_oficina": 1.5,
            "indirecto_fletes": 0.5,
            "indirecto_capacitacion": 0.2,
            "indirecto_seguridad": 0.8,
            "indirecto_auxiliares": 1.0,
            "financiamiento": 2.0,
            "utilidad": 10.0,
            "cargos_adicionales": 0.5,
            "imss": 2.0,
            "seguros": 1.0,
        },
    },

    # ─── CONCEPTO 2: Albañilería/Muro ───────────────────────────────────
    {
        "concept": {
            "id": "ALB-MURO-BLOCK15-001",
            "name": "Muro de block hueco de concreto 15×20×40 cm",
            "price": "540.00",
            "unit": "m2",
            "region": "CDMX",
            "status": "pending",
            "type": "Albañilería",
            "overhead": "1.2450",
            "cedia_score": 0,
            "adoption_count": 0,
            "apuc_credits_earned": 0,
            "cedia_feedback": (
                "Concepto semilla. Fuente: Insumos_APUCMX 2025-05-16. "
                "Rendimiento 12.5 pza/m² referencia CMIC Vivienda 2023."
            ),
        },
        "lines": [
            {
                "insumo_codigo": "66da28eb",
                "tipo": "material",
                "descripcion": "BLOCK DE CONCRETO HUECO DE 15x20x40",
                "unidad": "PZA",
                "cantidad": 12.5,
                "cost_lab": 12.60,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 1,
            },
            {
                "insumo_codigo": "de58e8a4",
                "tipo": "material",
                "descripcion": "CEMENTO (GRIS) PORTLAND TIPO II PUZÓLANICO",
                "unidad": "TON",
                "cantidad": 0.010,
                "cost_lab": 3982.75,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 2,
            },
            {
                "insumo_codigo": "7725a8cd",
                "tipo": "material",
                "descripcion": "ARENA DE MINA",
                "unidad": "M3",
                "cantidad": 0.025,
                "cost_lab": 550.00,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 3,
            },
            {
                "insumo_codigo": "895d9286",
                "tipo": "mano_obra",
                "descripcion": "OFICIAL ALBAÑIL",
                "unidad": "JOR",
                "cantidad": 0.12,
                "cost_lab": 1018.08,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 4,
            },
            {
                "insumo_codigo": "ff452b56",
                "tipo": "mano_obra",
                "descripcion": "AYUDANTE ALBAÑIL",
                "unidad": "JOR",
                "cantidad": 0.12,
                "cost_lab": 781.08,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 5,
            },
        ],
        "overcost": {
            "indirecto_honorarios": 5.0,
            "indirecto_depreciacion": 2.0,
            "indirecto_servicios": 1.0,
            "indirecto_gastos_oficina": 1.5,
            "indirecto_fletes": 0.5,
            "indirecto_capacitacion": 0.2,
            "indirecto_seguridad": 0.8,
            "indirecto_auxiliares": 1.0,
            "financiamiento": 2.0,
            "utilidad": 10.0,
            "cargos_adicionales": 0.5,
            "imss": 2.0,
            "seguros": 1.0,
        },
    },

    # ─── CONCEPTO 3: Excavación manual (intensiva MO) ───────────────────
    {
        "concept": {
            "id": "EXC-MANUAL-MO-001",
            "name": "Excavación manual en material tipo II hasta 2.0 m",
            "price": "2670.00",
            "unit": "m3",
            "region": "CDMX",
            "status": "pending",
            "type": "Albañilería",
            "overhead": "1.2450",
            "cedia_score": 0,
            "adoption_count": 0,
            "apuc_credits_earned": 0,
            "cedia_feedback": (
                "Concepto semilla intensivo en MO. Fuente: Insumos_APUCMX 2025-05-16. "
                "Rendimiento 1.2 jor/m³ peón referencia CMIC Vivienda 2023."
            ),
        },
        "lines": [
            {
                "insumo_codigo": "64b23f46",
                "tipo": "mano_obra",
                "descripcion": "PEÓN",
                "unidad": "JOR",
                "cantidad": 1.20,
                "cost_lab": 1152.75,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 1,
            },
            {
                "insumo_codigo": "24bdaa5d",
                "tipo": "mano_obra",
                "descripcion": "AYUDANTE GENERAL",
                "unidad": "JOR",
                "cantidad": 0.30,
                "cost_lab": 682.94,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.05,
                "fasar": 1.75,
                "sort_order": 2,
            },
            {
                "insumo_codigo": "77b4af63",
                "tipo": "material",
                "descripcion": "CARGA Y ACARREO MATERIAL SOBRANTE DE EXCAVACIONES",
                "unidad": "M3",
                "cantidad": 1.00,
                "cost_lab": 1084.30,
                "fletes": 0.0,
                "maniobra": 0.0,
                "almacenaje": 0.0,
                "fc_actual": 1.0,
                "fsi": 1.0,
                "fasar": 1.0,
                "sort_order": 3,
            },
        ],
        "overcost": {
            "indirecto_honorarios": 5.0,
            "indirecto_depreciacion": 2.0,
            "indirecto_servicios": 1.0,
            "indirecto_gastos_oficina": 1.5,
            "indirecto_fletes": 0.5,
            "indirecto_capacitacion": 0.2,
            "indirecto_seguridad": 0.8,
            "indirecto_auxiliares": 1.0,
            "financiamiento": 2.0,
            "utilidad": 10.0,
            "cargos_adicionales": 0.5,
            "imss": 2.0,
            "seguros": 1.0,
        },
    },
]


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def upsert_concept(sb: Client, concept: dict) -> bool:
    """Upsert en tabla concepts. Retorna True si exitoso."""
    res = sb.table("concepts").upsert(concept, on_conflict="id").execute()
    if hasattr(res, "data") and res.data:
        print(f"  [OK] concept id={concept['id']}")
        return True
    print(f"  [ERR] concept id={concept['id']} → {res}")
    return False


def upsert_lines(sb: Client, concept_id: str, lines: list) -> int:
    """Inserta concept_lines. Borra las previas para idempotencia."""
    # Eliminar líneas existentes del concepto (idempotencia limpia)
    sb.table("concept_lines").delete().eq("concept_id", concept_id).execute()
    inserted = 0
    for line in lines:
        row = {"concept_id": concept_id, **line}
        res = sb.table("concept_lines").insert(row).execute()
        if hasattr(res, "data") and res.data:
            inserted += 1
        else:
            print(f"  [WARN] line sort={line['sort_order']} → {res}")
    print(f"  [OK] {inserted}/{len(lines)} líneas insertadas para {concept_id}")
    return inserted


def upsert_overcost(sb: Client, concept_id: str, overcost: dict) -> bool:
    """Upsert en concept_overcost (unique constraint en concept_id)."""
    row = {"concept_id": concept_id, **overcost}
    res = sb.table("concept_overcost").upsert(row, on_conflict="concept_id").execute()
    if hasattr(res, "data") and res.data:
        print(f"  [OK] overcost para {concept_id}")
        return True
    print(f"  [ERR] overcost {concept_id} → {res}")
    return False


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

def main():
    print("=" * 60)
    print("APUCMX — Seeding 3 Conceptos Demo")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print(f"Proyecto: {SUPABASE_URL}")
    print("=" * 60)

    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    results = []
    for entry in CONCEPTS:
        cid = entry["concept"]["id"]
        print(f"\n─── {cid} ───")
        ok_c = upsert_concept(sb, entry["concept"])
        if not ok_c:
            print(f"  [ABORT] Falló insert de concept {cid}, saltando líneas.")
            results.append({"id": cid, "status": "FAIL"})
            continue
        n_lines = upsert_lines(sb, cid, entry["lines"])
        ok_oc = upsert_overcost(sb, cid, entry["overcost"])
        results.append({
            "id": cid,
            "status": "PASS" if (ok_c and ok_oc and n_lines > 0) else "NEEDS_REVIEW",
            "lines": n_lines,
        })

    print("\n" + "=" * 60)
    print("RESUMEN FINAL")
    print("=" * 60)
    for r in results:
        tag = "[PASS]" if r["status"] == "PASS" else f"[{r['status']}]"
        lines_str = f" | líneas={r.get('lines', 0)}" if "lines" in r else ""
        print(f"  {tag} {r['id']}{lines_str}")

    failed = [r for r in results if r["status"] == "FAIL"]
    if failed:
        print(f"\n[!] {len(failed)} concepto(s) fallaron. Revisa logs arriba.")
        sys.exit(1)
    else:
        print("\n[PASS] Todos los conceptos sembrados correctamente.")
        sys.exit(0)


if __name__ == "__main__":
    main()
