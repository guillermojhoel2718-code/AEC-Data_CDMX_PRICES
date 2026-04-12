# -*- coding: utf-8 -*-
"""
APUCMX — CMIC Extractor v1.0
==============================
Extrae datos de Costos Horarios de Maquinaria de los 10 PDFs CMIC 2023.

Pipeline:
  1. PARSE    — Detecta tablas de Costo Horario por maquinaria en cada PDF
  2. SCRUB    — Normaliza códigos, descripciones, unidades y valores numéricos
  3. DEDUP    — Prioriza la descripción más completa; promedia consumibles repetidos
  4. VALIDATE — Compara costos de combustible vs. precios regionales actuales
  5. SEED     — Genera JSON para Supabase + CSV de análisis
  6. UPLOAD   — Inserta en tabla machinery_costs de Supabase

Uso:
    python cmic_extractor.py
    python cmic_extractor.py --dry-run
    python cmic_extractor.py --pdf "Costos Horario de Maquinaria 2023.pdf"

Dependencias:
    pip install pdfplumber pandas tqdm colorama supabase python-dotenv
"""

import re
import os
import sys
import json
import logging
import argparse
import datetime
from pathlib import Path
from typing import Optional
from collections import defaultdict

import pdfplumber
import pandas as pd
import numpy as np
from tqdm import tqdm
from dotenv import load_dotenv

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
except ImportError:
    class Fore:
        CYAN = YELLOW = GREEN = MAGENTA = RED = ''
    class Style:
        RESET_ALL = ''

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv()

BASE_DIR   = Path(__file__).parent
PDF_DIR    = BASE_DIR / 'data' / 'raw'
OUTPUT_DIR = BASE_DIR / 'data' / 'processed'
SEED_DIR   = BASE_DIR / 'data' / 'seed'

for d in [OUTPUT_DIR, SEED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(OUTPUT_DIR / 'cmic_extractor.log', encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)

# CMIC 2023 reference fuel prices (from PDF page 23, used for CEDIA validation)
CMIC_REFERENCE_PRICES = {
    'diesel':    20.46,   # MXN/litro, CMIC 2023
    'gasolina':  18.31,   # MXN/litro Magna, CMIC 2023
    'aceite':   129.14,   # MXN/litro SAE 25W50
    'electricidad': 1.65, # MXN/kWh tarifa GDMTH
}

# Machinery categories by keyword
CATEGORY_KEYWORDS = {
    'Excavación':     ['excavadora', 'retroexcavadora', 'draga', 'cuchara', 'excavac'],
    'Compactación':   ['compactador', 'vibro', 'plancha', 'rodillo', 'pison'],
    'Elevación':      ['grúa', 'grue', 'pluma', 'telehandler', 'elevad', 'montacargas'],
    'Carga y Acarreo':['camión', 'camion', 'volteo', 'articulado', 'tractor', 'motoescr'],
    'Perforación':    ['perforador', 'piloteador', 'sonda', 'penetr'],
    'Concreto':       ['revolvedora', 'mezcladora', 'olla', 'bomba de concreto', 'vibrador'],
    'Corte':          ['corte', 'cortadora', 'sierra', 'disco'],
    'Hidráulica':     ['bomba', 'equipo de bombeo', 'motobomba'],
    'Nivelación':     ['motoconformadora', 'niveladora', 'buldózer', 'buldozer', 'bulldozer'],
    'Equipo ligero':  ['martillo', 'generador', 'compresor', 'ramper', 'mini'],
    'Carreteras':     ['pavimento', 'fresadora', 'extendedora', 'asfaltadora', 'asfalto'],
}


# ──────────────────────────────────────────────────────────────────────────────
# STEP 1: PARSE — Extract from PDF
# ──────────────────────────────────────────────────────────────────────────────

def extract_from_pdf(pdf_path: Path) -> list[dict]:
    """
    Parse a CMIC PDF and extract machinery cost records.

    CMIC table layout (typical for Costos Horario de Maquinaria):
    ┌──────────────────────────────────────────────────────────────────────┐
    │ COSTO HORARIO DE: [Nombre de la máquina]                            │
    │ Clave: [MQ-XXX]          CMIC-[YY]                                  │
    ├────────────────────────┬───────────┬─────────┬────────────┬─────────┤
    │ Descripción            │  Costo    │ % Mant  │ Consumo    │ Importe │
    ├────────────────────────┼───────────┼─────────┼────────────┼─────────┤
    │ Valor de adquisición   │ $X,XXX    │         │            │         │
    │ Vida económica         │ XXX hrs   │         │            │         │
    │ CARGOS FIJOS                                                         │
    │   Depreciación         │           │         │            │ $XX.XX  │
    │   Inversión            │           │         │            │ $XX.XX  │
    │   Seguros              │           │         │            │ $XX.XX  │
    │   Mantenimiento        │           │         │            │ $XX.XX  │
    │ CONSUMOS                                                             │
    │   Combustible/Diesel   │ $XX/l     │         │ X.X l/hr   │ $XX.XX  │
    │   Lubricantes          │           │         │            │ $XX.XX  │
    │   Llantas              │           │         │            │ $XX.XX  │
    │ OPERACIÓN              │           │         │            │ $XX.XX  │
    │ COSTO HORARIO TOTAL    │           │         │            │ $XXX.XX │
    └────────────────────────┴───────────┴─────────┴────────────┴─────────┘
    """
    log.info(f"  Parsing: {pdf_path.name}")
    records = []
    current_machine = None

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=3, y_tolerance=3) or ''
            
            # Remove decorative watermark characters (YVKCIVASSENAV pattern)
            text = re.sub(r'\n[YVKCIVASSENAV]\n', '\n', text)
            text = re.sub(r'(?m)^[YVKCIVASSENAV]$', '', text)
            
            lines = [l.strip() for l in text.split('\n') if l.strip()]

            for line in lines:
                # ── MACHINE HEADER ──────────────────────────────────────────
                # "COSTO HORARIO DE: EXCAVADORA HIDRÁULICA DE...  Clave: MQ-026"
                header_match = re.search(
                    r'COSTO\s+HORARIO\s+(?:DE|DEL?)?[:\s]+(.+?)(?:\s+Clave[:\s]+(\S+))?$',
                    line, re.IGNORECASE
                )
                if header_match:
                    # Save previous machine if any
                    if current_machine and current_machine.get('nombre'):
                        records.append(current_machine)
                    
                    nombre = header_match.group(1).strip()
                    clave  = header_match.group(2) or ''
                    current_machine = _new_machine(nombre, clave, pdf_path.stem, page_num + 1)
                    continue

                # ── CLAVE on separate line ───────────────────────────────────
                clave_match = re.match(r'(?:Clave|CLAVE)[:\s]+([A-Z0-9\-]+)', line, re.IGNORECASE)
                if clave_match and current_machine:
                    current_machine['codigo'] = clave_match.group(1)
                    continue

                # ── CATALOG CODE ─────────────────────────────────────────────
                catalog_match = re.match(r'(CMIC-\w+)', line)
                if catalog_match and current_machine:
                    current_machine['catalogo_cmic'] = catalog_match.group(1)
                    continue

                # ── If no current machine, skip ───────────────────────────────
                if not current_machine:
                    continue

                # ── VALOR DE ADQUISICIÓN ─────────────────────────────────────
                adq_match = re.search(
                    r'(?:Valor\s+de\s+adquisici[oó]n|V\.?\s*Adq\.?)[^\d]*(\$?[\d,\.]+)',
                    line, re.IGNORECASE
                )
                if adq_match:
                    current_machine['valor_adquisicion'] = _parse_num(adq_match.group(1))
                    continue

                # ── VIDA ECONÓMICA ───────────────────────────────────────────
                vida_match = re.search(
                    r'(?:Vida\s+[Ee]con[oó]mica|Vida\s+Econ\.?)[^\d]*([\d,]+)',
                    line, re.IGNORECASE
                )
                if vida_match:
                    current_machine['vida_economica_hrs'] = _parse_num(vida_match.group(1))
                    continue

                # ── CARGOS FIJOS ─────────────────────────────────────────────
                depre_match = re.search(r'(?:Depreciaci[oó]n)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if depre_match:
                    current_machine['cargos_fijos']['depreciacion'] = _parse_num(depre_match.group(1))

                inver_match = re.search(r'(?:Inversi[oó]n|Inversión)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if inver_match:
                    current_machine['cargos_fijos']['inversion'] = _parse_num(inver_match.group(1))

                segur_match = re.search(r'(?:Seguros?)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if segur_match:
                    current_machine['cargos_fijos']['seguros'] = _parse_num(segur_match.group(1))

                mante_match = re.search(r'(?:Mantenimiento)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if mante_match:
                    current_machine['cargos_fijos']['mantenimiento'] = _parse_num(mante_match.group(1))

                # ── CONSUMOS ─────────────────────────────────────────────────
                comb_match = re.search(
                    r'(?:Combustible|Diesel|Di[eé]sel|Gasolina)[^\d]*(\$?[\d,\.]+)[^\d]+(\$?[\d,\.]+)\s*$',
                    line, re.IGNORECASE
                )
                if comb_match:
                    current_machine['consumos']['precio_combustible'] = _parse_num(comb_match.group(1))
                    current_machine['consumos']['combustible_importe'] = _parse_num(comb_match.group(2))
                    # Detect fuel type
                    if re.search(r'gasolina', line, re.IGNORECASE):
                        current_machine['tipo_combustible'] = 'gasolina'
                    elif re.search(r'electri', line, re.IGNORECASE):
                        current_machine['tipo_combustible'] = 'electricidad'
                    else:
                        current_machine['tipo_combustible'] = 'diesel'

                lubr_match = re.search(r'(?:Lubricantes?)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if lubr_match:
                    current_machine['consumos']['lubricantes'] = _parse_num(lubr_match.group(1))

                llan_match = re.search(r'(?:Llantas?)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if llan_match:
                    current_machine['consumos']['llantas'] = _parse_num(llan_match.group(1))

                # ── OPERACIÓN ─────────────────────────────────────────────────
                oper_match = re.search(r'(?:Operaci[oó]n)[^\d]*(\$?[\d,\.]+)\s*$', line, re.IGNORECASE)
                if oper_match:
                    current_machine['operacion'] = _parse_num(oper_match.group(1))

                # ── COSTO HORARIO TOTAL ───────────────────────────────────────
                total_match = re.search(
                    r'(?:COSTO\s+HORARIO\s+(?:DIRECTO\s+)?TOTAL|TOTAL\s+COSTO\s+HORARIO)[^\d]*(\$?[\d,\.]+)',
                    line, re.IGNORECASE
                )
                if total_match:
                    total = _parse_num(total_match.group(1))
                    current_machine['costo_horario_total'] = total
                    # Auto-calculate if total seems reasonable
                    if total > 0:
                        _recalculate_totals(current_machine)

            # Also parse tables on this page for structured data
            tables = page.extract_tables()
            for table in tables:
                _parse_table_rows(table, current_machine)

        # Don't forget the last machine
        if current_machine and current_machine.get('nombre'):
            records.append(current_machine)

    log.info(f"    -> Extracted {len(records)} machines from {pdf_path.name}")
    return records


def _new_machine(nombre: str, clave: str, source: str, page: int) -> dict:
    """Create a fresh machine record template."""
    return {
        'codigo': clave or '',
        'nombre': nombre,
        'catalogo_cmic': '',
        'categoria': _detect_category(nombre),
        'valor_adquisicion': 0.0,
        'vida_economica_hrs': 0.0,
        'tipo_combustible': 'diesel',
        'cargos_fijos': {
            'depreciacion': 0.0,
            'inversion': 0.0,
            'seguros': 0.0,
            'mantenimiento': 0.0,
        },
        'consumos': {
            'precio_combustible': 0.0,
            'combustible_importe': 0.0,
            'lubricantes': 0.0,
            'llantas': 0.0,
        },
        'operacion': 0.0,
        'costo_horario_total': 0.0,
        'total_cargos_fijos': 0.0,
        'total_consumos': 0.0,
        'source_file': source,
        'source_page': page,
        'cedia_alerta_combustible': False,
        'cedia_mensaje': '',
    }


def _parse_table_rows(table: list, machine: Optional[dict]) -> None:
    """Extract data from a pdfplumber table structure."""
    if not table or not machine:
        return
    
    for row in table:
        if not any(c for c in row if c):
            continue
        # Join non-null cells
        text_row = ' | '.join(str(c or '').strip() for c in row if c)
        
        # Look for numeric values in last column
        last_val = next((str(c or '').strip() for c in reversed(row) if c and re.search(r'[\d,\.]+', str(c))), '')
        num = _parse_num(last_val)
        
        first = str(row[0] or '').lower()
        
        if 'depreci' in first and num > 0:
            machine['cargos_fijos']['depreciacion'] = num
        elif 'invers' in first and num > 0:
            machine['cargos_fijos']['inversion'] = num
        elif 'seguro' in first and num > 0:
            machine['cargos_fijos']['seguros'] = num
        elif 'manteni' in first and num > 0:
            machine['cargos_fijos']['mantenimiento'] = num
        elif 'lubric' in first and num > 0:
            machine['consumos']['lubricantes'] = num
        elif 'llanta' in first and num > 0:
            machine['consumos']['llantas'] = num
        elif 'operaci' in first and num > 0:
            machine['operacion'] = num
        elif re.search(r'costo\s+horario\s+total', first) and num > 0:
            machine['costo_horario_total'] = num


def _parse_num(text: str) -> float:
    """Parse a numeric string like '$1,234.56' → 1234.56"""
    if not text:
        return 0.0
    cleaned = re.sub(r'[\$\s]', '', str(text)).replace(',', '')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _detect_category(name: str) -> str:
    """Detect machine category from its name."""
    name_lower = name.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            return cat
    return 'Equipo General'


def _recalculate_totals(machine: dict) -> None:
    """Calculate subtotals from individual components."""
    cf = machine['cargos_fijos']
    machine['total_cargos_fijos'] = sum(cf.values())
    
    co = machine['consumos']
    machine['total_consumos'] = (
        co.get('combustible_importe', 0) +
        co.get('lubricantes', 0) +
        co.get('llantas', 0)
    )
    
    # If total not set yet, sum everything
    if machine['costo_horario_total'] == 0:
        machine['costo_horario_total'] = (
            machine['total_cargos_fijos'] +
            machine['total_consumos'] +
            machine['operacion']
        )


# ──────────────────────────────────────────────────────────────────────────────
# STEP 2: SCRUB — Clean and normalize
# ──────────────────────────────────────────────────────────────────────────────

def scrub_machines(records: list[dict]) -> list[dict]:
    """Normalize field values across all extracted records."""
    log.info(f"{Fore.YELLOW}[SCRUB] Normalizing {len(records)} raw records")
    
    scrubbed = []
    for m in records:
        # Skip records with no name or trivially small totals
        if not m.get('nombre') or len(m['nombre']) < 5:
            continue
        
        # Normalize code: uppercase, remove spaces
        m['codigo'] = re.sub(r'\s+', '', m.get('codigo', '')).upper()
        if not m['codigo']:
            # Generate from name
            words = m['nombre'].split()[:3]
            m['codigo'] = 'MQ-' + ''.join(w[0].upper() for w in words if w)
        
        # Clean name
        m['nombre'] = re.sub(r'\s+', ' ', m['nombre']).strip().title()
        
        # Ensure numeric fields
        for field in ['valor_adquisicion', 'vida_economica_hrs', 'operacion',
                       'costo_horario_total', 'total_cargos_fijos', 'total_consumos']:
            try:
                m[field] = float(m.get(field, 0) or 0)
            except (ValueError, TypeError):
                m[field] = 0.0
        
        # Recalculate totals
        _recalculate_totals(m)
        
        scrubbed.append(m)
    
    log.info(f"  -> {len(scrubbed)} clean records ({len(records) - len(scrubbed)} removed)")
    return scrubbed


# ──────────────────────────────────────────────────────────────────────────────
# STEP 3: DEDUP — Deduplicate across catalogs
# ──────────────────────────────────────────────────────────────────────────────

def deduplicate(records: list[dict]) -> list[dict]:
    """
    Deduplication strategy:
    1. Group by normalized machine name (fuzzy match on first 40 chars)
    2. Keep the record with the most complete description/data
    3. Average consumable prices (combustible, lubricantes) across duplicates
    """
    log.info(f"{Fore.BLUE}[DEDUP] Deduplicating {len(records)} records")
    
    groups: dict[str, list[dict]] = defaultdict(list)
    
    for m in records:
        # Normalize key: first 40 chars of name, uppercase, no spaces
        key = re.sub(r'\s+', '', m['nombre'][:40].upper())
        groups[key].append(m)
    
    deduped = []
    for key, group in groups.items():
        if len(group) == 1:
            deduped.append(group[0])
            continue
        
        # Pick the record with the most data points (non-zero fields)
        def completeness(m):
            return sum(1 for v in [
                m.get('valor_adquisicion', 0),
                m.get('vida_economica_hrs', 0),
                m['cargos_fijos'].get('depreciacion', 0),
                m['cargos_fijos'].get('inversion', 0),
                m['consumos'].get('combustible_importe', 0),
                m.get('costo_horario_total', 0),
            ] if v and float(v) > 0)
        
        best = max(group, key=completeness)
        
        # Average consumable prices across all duplicates
        prices_comb = [g['consumos'].get('precio_combustible', 0) for g in group if g['consumos'].get('precio_combustible', 0) > 0]
        prices_lubr = [g['consumos'].get('lubricantes', 0) for g in group if g['consumos'].get('lubricantes', 0) > 0]
        prices_llan = [g['consumos'].get('llantas', 0) for g in group if g['consumos'].get('llantas', 0) > 0]
        
        if prices_comb:
            best['consumos']['precio_combustible'] = float(np.mean(prices_comb))
        if prices_lubr:
            best['consumos']['lubricantes'] = float(np.mean(prices_lubr))
        if prices_llan:
            best['consumos']['llantas'] = float(np.mean(prices_llan))
        
        best['source_count'] = len(group)
        best['source_files'] = list({g['source_file'] for g in group})
        _recalculate_totals(best)
        
        deduped.append(best)
    
    log.info(f"  -> {len(deduped)} unique machines (removed {len(records) - len(deduped)} duplicates)")
    return deduped


# ──────────────────────────────────────────────────────────────────────────────
# STEP 4: CEDIA VALIDATE — Fuel price alert
# ──────────────────────────────────────────────────────────────────────────────

def fuel_price_check(records: list[dict], regional_diesel_price: float = None) -> list[dict]:
    """
    CEDIA Protocol validation:
    Compare CMIC 2023 combustible price vs. current regional price.
    If difference > 15%, flag with cedia_alerta_combustible = True.
    
    Args:
        regional_diesel_price: current diesel price from APUCMX DB ($/litro)
    """
    log.info(f"{Fore.MAGENTA}[CEDIA] Running fuel price validation")
    
    # Default: try to fetch from Supabase, fallback to CMIC 2023 reference
    if regional_diesel_price is None:
        regional_diesel_price = _fetch_regional_fuel_price()
    
    CMIC_DIESEL = CMIC_REFERENCE_PRICES['diesel']  # $20.46/lt (2023)
    THRESHOLD_PCT = 15.0
    
    price_diff_pct = abs(regional_diesel_price - CMIC_DIESEL) / CMIC_DIESEL * 100
    log.info(f"  CMIC diesel: ${CMIC_DIESEL:.2f}/lt | Regional: ${regional_diesel_price:.2f}/lt | Diff {price_diff_pct:.1f}%")
    
    alerta = price_diff_pct > THRESHOLD_PCT
    mensaje = (
        f"Precio de diesel CMIC 2023 (${CMIC_DIESEL:.2f}/lt) difiere un "
        f"{price_diff_pct:.1f}% respecto al precio regional actual (${regional_diesel_price:.2f}/lt). "
        f"Se recomienda actualizar los costos de consumo."
    ) if alerta else ''
    
    for m in records:
        if m['consumos'].get('combustible_importe', 0) > 0:
            m['cedia_alerta_combustible'] = alerta
            m['cedia_mensaje'] = mensaje
            m['cedia_precio_referencia_diesel'] = CMIC_DIESEL
            m['cedia_precio_regional_diesel'] = regional_diesel_price
            m['cedia_diff_pct'] = round(price_diff_pct, 2)
    
    flagged = sum(1 for m in records if m.get('cedia_alerta_combustible'))
    log.info(f"  -> {flagged} machines flagged with CEDIA fuel price alert")
    return records


def _fetch_regional_fuel_price() -> float:
    """Try to fetch current diesel price from Supabase concepts table."""
    try:
        from supabase import create_client
        url = os.getenv('VITE_SUPABASE_URL')
        key = os.getenv('VITE_SUPABASE_ANON_KEY')
        if url and key:
            sb = create_client(url, key)
            # Look for diesel price in concept_materials or a dedicated prices table
            res = sb.table('concept_materials') \
                .select('cost_lab') \
                .ilike('description', '%diesel%') \
                .limit(10) \
                .execute()
            if res.data:
                prices = [float(r['cost_lab']) for r in res.data if r.get('cost_lab', 0) > 10]
                if prices:
                    avg = float(np.mean(prices))
                    log.info(f"  Fetched regional diesel price from Supabase: ${avg:.2f}/lt")
                    return avg
    except Exception as e:
        log.warning(f"  Could not fetch regional price from Supabase: {e}")
    
    # Fallback: use current estimated market price (Pemex 2024 average)
    return 23.50  # MXN/lt Pemex diesel estimado 2024


# ──────────────────────────────────────────────────────────────────────────────
# STEP 5: SEED — Export for Supabase
# ──────────────────────────────────────────────────────────────────────────────

def generate_seed(records: list[dict]) -> Path:
    """Export cleaned records to JSON and CSV for Supabase seeding."""
    log.info(f"{Fore.GREEN}[SEED] Generating seed data for {len(records)} machines")
    
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    def _default(o):
        if isinstance(o, (np.integer, np.int64)):  return int(o)
        if isinstance(o, (np.floating, np.float64)): return float(o)
        raise TypeError
    
    json_path = SEED_DIR / f'machinery_costs_{ts}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2, default=_default)
    log.info(f"  [OK] JSON: {json_path}")
    
    # Flat CSV
    flat = []
    for m in records:
        flat.append({
            'codigo': m['codigo'],
            'nombre': m['nombre'],
            'categoria': m['categoria'],
            'valor_adquisicion': m['valor_adquisicion'],
            'vida_economica_hrs': m['vida_economica_hrs'],
            'tipo_combustible': m['tipo_combustible'],
            'depreciacion': m['cargos_fijos']['depreciacion'],
            'inversion': m['cargos_fijos']['inversion'],
            'seguros': m['cargos_fijos']['seguros'],
            'mantenimiento': m['cargos_fijos']['mantenimiento'],
            'total_cargos_fijos': m['total_cargos_fijos'],
            'precio_combustible': m['consumos']['precio_combustible'],
            'combustible_importe': m['consumos']['combustible_importe'],
            'lubricantes': m['consumos']['lubricantes'],
            'llantas': m['consumos']['llantas'],
            'total_consumos': m['total_consumos'],
            'operacion': m['operacion'],
            'costo_horario_total': m['costo_horario_total'],
            'cedia_alerta': m.get('cedia_alerta_combustible', False),
            'source_file': m['source_file'],
        })
    
    df = pd.DataFrame(flat)
    csv_path = OUTPUT_DIR / f'machinery_costs_{ts}.csv'
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    log.info(f"  [OK] CSV: {csv_path}")
    
    # Summary
    log.info(f"\n  [SUMARIO]")
    log.info(f"     Total máquinas:   {len(records)}")
    log.info(f"     Por categoría:")
    for cat, cnt in df.groupby('categoria')['codigo'].count().sort_values(ascending=False).items():
        log.info(f"       {cat:<25} {cnt:>4} máquinas")
    prices = df['costo_horario_total'].replace(0, np.nan).dropna()
    if not prices.empty:
        log.info(f"     Costo horario:    ${prices.min():.2f} – ${prices.max():.2f} MXN/hr")
        log.info(f"     Costo promedio:   ${prices.mean():.2f} MXN/hr")
    
    return json_path


# ──────────────────────────────────────────────────────────────────────────────
# STEP 6: UPLOAD — Supabase
# ──────────────────────────────────────────────────────────────────────────────

def upload_to_supabase(records: list[dict], dry_run: bool = False) -> int:
    """Upload machinery costs to Supabase machinery_costs table."""
    log.info(f"{Fore.MAGENTA}[UPLOAD] Uploading to Supabase {'(DRY RUN)' if dry_run else ''}")
    
    if dry_run:
        log.info(f"  DRY RUN: would upload {len(records)} machines")
        return len(records)
    
    try:
        from supabase import create_client
        url = os.getenv('VITE_SUPABASE_URL')
        key = os.getenv('VITE_SUPABASE_ANON_KEY')
        if not url or not key:
            log.error("  Missing Supabase credentials in .env")
            return 0
        
        sb = create_client(url, key)
        uploaded = 0
        
        for m in tqdm(records, desc="Uploading machinery"):
            try:
                row = {
                    'codigo': m['codigo'][:20],
                    'nombre': m['nombre'][:200],
                    'categoria': m['categoria'][:50],
                    'valor_adquisicion': float(m.get('valor_adquisicion', 0)),
                    'vida_economica_hrs': float(m.get('vida_economica_hrs', 0)),
                    'tipo_combustible': m.get('tipo_combustible', 'diesel'),
                    'depreciacion': float(m['cargos_fijos'].get('depreciacion', 0)),
                    'inversion': float(m['cargos_fijos'].get('inversion', 0)),
                    'seguros': float(m['cargos_fijos'].get('seguros', 0)),
                    'mantenimiento': float(m['cargos_fijos'].get('mantenimiento', 0)),
                    'total_cargos_fijos': float(m.get('total_cargos_fijos', 0)),
                    'precio_combustible': float(m['consumos'].get('precio_combustible', 0)),
                    'combustible_importe': float(m['consumos'].get('combustible_importe', 0)),
                    'lubricantes': float(m['consumos'].get('lubricantes', 0)),
                    'llantas': float(m['consumos'].get('llantas', 0)),
                    'total_consumos': float(m.get('total_consumos', 0)),
                    'operacion': float(m.get('operacion', 0)),
                    'costo_horario_total': float(m.get('costo_horario_total', 0)),
                    'cedia_alerta_combustible': bool(m.get('cedia_alerta_combustible', False)),
                    'cedia_mensaje': str(m.get('cedia_mensaje', '')),
                    'source_catalog': str(m.get('source_file', ''))[:100],
                }
                
                sb.table('machinery_costs').upsert(row, on_conflict='codigo').execute()
                uploaded += 1
                
            except Exception as e:
                log.error(f"  Error uploading {m.get('codigo')}: {e}")
        
        log.info(f"  [OK] Uploaded {uploaded}/{len(records)} machines to Supabase")
        return uploaded
        
    except ImportError:
        log.error("  supabase package not installed. Run: pip install supabase")
        return 0


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

PDF_FILES = [
    'Catálogo de Costos CMIC - Costos Horario de Maquinaria 2023.pdf',
    'Catálogo de Costos CMIC - Carreteras 2023.pdf',
    'Catálogo de Costos CMIC - Cimentaciones Profundas 2023.pdf',
    'Catálogo de Costos CMIC - Eco Tecnologias y Materiales Sustentables 2023.pdf',
    'Catálogo de Costos CMIC - Infraestructura Educativa 2023.pdf',
    'Catálogo de Costos CMIC - Materiales Reciclados 2023.pdf',
    'Catálogo de Costos CMIC - Perforacion de Pozos para Agua 2023.pdf',
    'Catálogo de Costos CMIC - Rehabilitacion de Pozos para Agua 2023.pdf',
    'Catálogo de Costos CMIC - Sector Salud 2023.pdf',
    'Catálogo de Costos CMIC - Vivienda 2023.pdf',
]


def main():
    parser = argparse.ArgumentParser(description='APUCMX CMIC Machinery Cost Extractor')
    parser.add_argument('--pdf', type=str, help='Process only this specific PDF filename')
    parser.add_argument('--dry-run', action='store_true', help='Do not upload to Supabase')
    parser.add_argument('--skip-upload', action='store_true', help='Skip Supabase upload step')
    parser.add_argument('--diesel-price', type=float, default=None,
                        help='Override regional diesel price (MXN/lt) for CEDIA validation')
    args = parser.parse_args()

    start = datetime.datetime.now()
    log.info(f"\n{'='*70}")
    log.info(f"CMIC Extractor — {start.strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"{'='*70}")

    # Determine which PDFs to process
    if args.pdf:
        pdf_list = [args.pdf]
    else:
        pdf_list = PDF_FILES

    # Step 1: Extract from all PDFs
    all_raw = []
    for pdf_name in tqdm(pdf_list, desc="Processing PDFs"):
        pdf_path = PDF_DIR / pdf_name
        if not pdf_path.exists():
            log.warning(f"  PDF not found: {pdf_path}")
            continue
        try:
            records = extract_from_pdf(pdf_path)
            all_raw.extend(records)
        except Exception as e:
            log.error(f"  Failed to process {pdf_name}: {e}")

    log.info(f"\nRaw records extracted: {len(all_raw)}")

    if not all_raw:
        log.warning("No records extracted. Check PDF format.")
        log.info("Hint: Some CMIC PDFs may be scanned images. In that case, OCR (pytesseract) would be needed.")
        return

    # Step 2: Scrub
    scrubbed = scrub_machines(all_raw)

    # Step 3: Deduplicate
    deduped = deduplicate(scrubbed)

    # Step 4: CEDIA Validation
    validated = fuel_price_check(deduped, regional_diesel_price=args.diesel_price)

    # Step 5: Generate seed
    seed_path = generate_seed(validated)

    # Step 6: Upload
    if not args.skip_upload:
        upload_to_supabase(validated, dry_run=args.dry_run)

    elapsed = (datetime.datetime.now() - start).total_seconds()
    log.info(f"\n{'='*70}")
    log.info(f"[OK] CMIC Extractor complete in {elapsed:.1f}s")
    log.info(f"   Seed: {seed_path}")
    log.info(f"{'='*70}\n")


if __name__ == '__main__':
    main()
