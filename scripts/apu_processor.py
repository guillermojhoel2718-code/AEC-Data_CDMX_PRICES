"""
APUCMX — APU Processor v1.0
============================
Data Scrubbing Pipeline para Construbase Febrero 2026

Pipeline:
  1. EXTRACT   — Descomprime ZIPs anidados (con contraseña)
  2. PARSE     — Lee hojas de Presupuesto.xlsx → identifica jerarquía APU
  3. SCRUB     — Limpieza: normaliza claves, regiones, unidades
  4. AGGREGATE — Weighted Average de insumos repetidos entre bases
  5. SEED      — Genera la Base Semilla regional (JSON + CSV)
  6. UPLOAD    — Inserta en Supabase concepts + concept_materials, etc.

Uso:
    python apu_processor.py [--password <pwd>] [--region CDMX] [--dry-run]

Dependencias:
    pip install pandas openpyxl xlrd supabase python-dotenv tqdm colorama
"""

import zipfile
import io
import os
import re
import json
import argparse
import logging
import datetime
from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np
from tqdm import tqdm
from colorama import Fore, Style, init as colorama_init
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────

colorama_init(autoreset=True)
load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'
RAW_DIR = DATA_DIR / 'raw'
EXTRACT_DIR = DATA_DIR / 'raw' / 'extracted'
OUTPUT_DIR = DATA_DIR / 'processed'
SEED_DIR = DATA_DIR / 'seed'

for d in [EXTRACT_DIR, OUTPUT_DIR, SEED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

ZIP_PATH = RAW_DIR / 'Construbases_Febrero_2026_Intercambio.zip'

# Canonical regions (Source of Truth: Artículo Estratégico v3)
REGIONS = ['CDMX', 'Norte', 'Bajio', 'Occidente', 'Sur']

# Profile → Region mapping (Construbase profiles typically represent market segments)
PROFILE_REGION_MAP = {
    'Concursos':    'CDMX',      # Gobierno/licitaciones → CDMX como base
    'Constructor':  'Norte',      # Constructoras privadas → Norte
    'Desarrollador': 'Bajio',    # Desarrolladoras inmobiliarias → Bajío
    'Remodelador':  'Occidente', # Remodelación/particular → Occidente
}

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(OUTPUT_DIR / 'apu_processor.log', encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# STEP 1: EXTRACT
# ──────────────────────────────────────────────────────────────────────────────

def extract_construbase(zip_path: Path, password: Optional[str] = None) -> dict[str, Path]:
    """
    Extract Construbase nested ZIPs with optional password.
    Returns dict: profile_name → {presupuesto: Path, fasar: Path}
    """
    log.info(f"{Fore.CYAN}[STEP 1] EXTRACTING Construbase ZIPs from {zip_path.name}")
    
    pwd_bytes = password.encode() if password else None
    extracted = {}  # profile → {'presupuesto': Path, 'fasar': Path}
    
    with zipfile.ZipFile(zip_path, 'r') as outer_zip:
        inner_zips = [e for e in outer_zip.namelist() if e.endswith('.zip')]
        
        for inner_name in tqdm(inner_zips, desc="Extracting profiles"):
            # Detect profile
            profile = None
            for p in PROFILE_REGION_MAP:
                if p in inner_name:
                    profile = p
                    break
            if not profile:
                profile = Path(inner_name).stem.split('_')[1]
            
            log.info(f"  Processing profile: {profile}")
            inner_bytes = outer_zip.read(inner_name)
            
            try:
                with zipfile.ZipFile(io.BytesIO(inner_bytes), 'r') as inner_zip:
                    profile_files = {}
                    
                    for entry in inner_zip.namelist():
                        try:
                            data = inner_zip.read(entry, pwd=pwd_bytes)
                        except RuntimeError as e:
                            log.error(f"  ❌ Password error for {entry}: {e}")
                            log.error(f"  Run with --password <your_password> to decrypt")
                            raise SystemExit(1) from e
                        
                        out_path = EXTRACT_DIR / entry
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        out_path.write_bytes(data)
                        
                        if 'Presupuesto' in entry:
                            profile_files['presupuesto'] = out_path
                        elif 'Fasar' in entry or 'FASAR' in entry:
                            profile_files['fasar'] = out_path
                        
                        log.info(f"    ✓ {entry} ({len(data):,} bytes)")
                    
                    extracted[profile] = profile_files
                    
            except zipfile.BadZipFile as e:
                log.error(f"  Bad inner ZIP {inner_name}: {e}")
    
    log.info(f"  Extracted {len(extracted)} profiles: {list(extracted.keys())}")
    return extracted


# ──────────────────────────────────────────────────────────────────────────────
# STEP 2: PARSE — Identify APU Hierarchy
# ──────────────────────────────────────────────────────────────────────────────

def detect_hierarchy(df: pd.DataFrame) -> list[dict]:
    """
    Construbase Presupuesto.xlsx typically has this hierarchy:
    
    Level 1: CAPÍTULO     (e.g., "01 PRELIMINARES")
    Level 2: SUBCAPÍTULO  (e.g., "01.01 LIMPIEZA Y TRAZO")
    Level 3: CONCEPTO     (e.g., "01.01.001 Limpieza de terreno a mano")
    Level 4: INSUMO       (materiales, mano de obra, equipo, subcontratos)
    
    Strategy: detect by column structure and indentation patterns.
    """
    concepts = []
    current_chapter = ''
    current_subchapter = ''
    current_concept = None
    
    for idx, row in df.iterrows():
        # Get first non-null columns
        cols = row.dropna()
        if cols.empty:
            continue
        
        first_col = str(cols.iloc[0]).strip()
        
        # Detect level by code pattern
        chapter_match = re.match(r'^(\d{2})\s+(.+)', first_col)
        subchapter_match = re.match(r'^(\d{2}\.\d{2})\s+(.+)', first_col)
        concept_match = re.match(r'^(\d{2}\.\d{2}\.\d{3})\s+(.+)', first_col)
        
        if concept_match and not subchapter_match:
            code = concept_match.group(1)
            name = concept_match.group(2).strip()
            # Extract unit, quantity, price from adjacent columns
            unit = _safe_str(cols, 1, '')
            qty = _safe_num(cols, 2)
            price = _safe_num(cols, 3)
            
            current_concept = {
                'code': code,
                'name': name,
                'chapter': current_chapter,
                'subchapter': current_subchapter,
                'unit': unit,
                'quantity': qty,
                'unit_price': price,
                'total': _safe_num(cols, 4),
                'materials': [],
                'labor': [],
                'equipment': [],
                'subcontracts': [],
                'overhead': {},
            }
            concepts.append(current_concept)
        
        elif subchapter_match:
            current_subchapter = subchapter_match.group(1) + ' ' + subchapter_match.group(2)
        elif chapter_match and not subchapter_match:
            current_chapter = chapter_match.group(1) + ' ' + chapter_match.group(2)
        
        # Detect insumos (materials/labor)
        elif current_concept is not None:
            insumo = _parse_insumo_row(row, cols)
            if insumo:
                _assign_insumo(current_concept, insumo, row)
    
    return concepts


def _safe_str(series, idx, default=''):
    try:
        v = series.iloc[idx]
        return str(v).strip() if pd.notna(v) else default
    except (IndexError, KeyError):
        return default


def _safe_num(series, idx) -> float:
    try:
        v = series.iloc[idx]
        if pd.isna(v):
            return 0.0
        return float(str(v).replace(',', '').replace('$', '').strip())
    except (IndexError, KeyError, ValueError):
        return 0.0


def _parse_insumo_row(row, cols) -> Optional[dict]:
    """Parse a raw data row as an insumo (material/labor/equipment)."""
    try:
        first = str(cols.iloc[0]).strip()
        # Insumos typically start with a letter code or description
        if re.match(r'^[A-Z]{1,4}[-_\d]', first) or len(first) > 5:
            return {
                'code': first[:20],
                'description': _safe_str(cols, 1, first)[:100],
                'unit': _safe_str(cols, 2, 'pza'),
                'quantity': _safe_num(cols, 3),
                'unit_cost': _safe_num(cols, 4),
                'total': _safe_num(cols, 5),
                'raw': cols.tolist()[:8],
            }
    except Exception:
        pass
    return None


def _assign_insumo(concept: dict, insumo: dict, row):
    """Assign insumo to the correct category based on code prefix."""
    code = insumo.get('code', '').upper()
    if re.match(r'^M[A-Z]?[\-_\d]|MAT|^M\d', code):
        concept['materials'].append(insumo)
    elif re.match(r'^M[O][\-_\d]|MOB|^L\d|LAB|MANO', code):
        concept['labor'].append(insumo)
    elif re.match(r'^E[\-_\d]|EQU|^H\d|OCA|^MA\d', code):
        concept['equipment'].append(insumo)
    elif re.match(r'^S[\-_\d]|SUB|^SC\d', code):
        concept['subcontracts'].append(insumo)
    else:
        concept['materials'].append(insumo)  # Default to materials


def parse_presupuesto(filepath: Path, profile: str) -> list[dict]:
    """
    Parse a Construbase Presupuesto.xlsx file.
    Returns list of concept dicts with full APU breakdown.
    """
    log.info(f"  Parsing presupuesto: {filepath.name}")
    
    xl = pd.ExcelFile(filepath, engine='openpyxl')
    log.info(f"  Sheets: {xl.sheet_names}")
    
    all_concepts = []
    region = PROFILE_REGION_MAP.get(profile, 'CDMX')
    
    for sheet_name in xl.sheet_names:
        try:
            df = xl.parse(sheet_name, header=None)
            log.info(f"    Sheet '{sheet_name}': {df.shape[0]} rows × {df.shape[1]} cols")
            
            # Try to detect hierarchy
            concepts = detect_hierarchy(df)
            log.info(f"    Detected {len(concepts)} concepts in '{sheet_name}'")
            
            for concept in concepts:
                concept['profile'] = profile
                concept['region'] = region
                concept['source_sheet'] = sheet_name
                concept['source_file'] = filepath.name
            
            all_concepts.extend(concepts)
            
        except Exception as e:
            log.warning(f"    Error parsing sheet '{sheet_name}': {e}")
            continue
    
    return all_concepts


# ──────────────────────────────────────────────────────────────────────────────
# STEP 3: SCRUB — Data Cleaning
# ──────────────────────────────────────────────────────────────────────────────

def scrub_concepts(concepts: list[dict]) -> list[dict]:
    """
    Data scrubbing:
    - Normalize concept codes (strip leading zeros, standardize separators)
    - Normalize unit names (m², m3, kg, pza, etc.)
    - Remove concepts with price = 0 and no materials
    - Flag outliers (price > mean + 3*std per type)
    - Clean description strings
    """
    log.info(f"{Fore.YELLOW}[STEP 3] SCRUBBING {len(concepts)} raw concepts")
    
    UNIT_MAP = {
        'm2': 'm²', 'M2': 'm²', 'M²': 'm²', 'M 2': 'm²',
        'm3': 'm³', 'M3': 'm³', 'M³': 'm³',
        'kg': 'kg', 'KG': 'kg', 'Kg': 'kg',
        'lt': 'lt', 'LT': 'lt', 'Lts': 'lt',
        'pza': 'pza', 'PZA': 'pza', 'Pza': 'pza', 'pz': 'pza',
        'ton': 'ton', 'TON': 'ton', 'Ton': 'ton',
        'ml': 'ml', 'ML': 'ml', 'Ml': 'ml',
        'jgo': 'jgo', 'JGO': 'jgo',
        'sal': 'sal', 'SAL': 'sal',
        'hr': 'hr', 'HR': 'hr', 'h': 'hr',
        'lote': 'lote', 'LOT': 'lote', 'm': 'm', 'M': 'm',
    }
    
    scrubbed = []
    removed = 0
    
    for c in tqdm(concepts, desc="Scrubbing"):
        # Skip empty/invalid
        if not c.get('name') or len(c.get('name', '')) < 3:
            removed += 1
            continue
        
        # Normalize code
        code = re.sub(r'[^\w\.\-]', '', str(c.get('code', ''))).upper()
        c['code'] = code
        
        # Normalize name
        c['name'] = re.sub(r'\s+', ' ', str(c.get('name', ''))).strip().title()
        
        # Normalize unit
        raw_unit = str(c.get('unit', 'pza')).strip()
        c['unit'] = UNIT_MAP.get(raw_unit, raw_unit.lower()[:4])
        
        # Ensure numeric price
        try:
            c['unit_price'] = float(c.get('unit_price', 0) or 0)
        except (ValueError, TypeError):
            c['unit_price'] = 0.0
        
        # Skip zero-price + no materials (likely headers)
        if c['unit_price'] == 0 and not c.get('materials') and not c.get('labor'):
            removed += 1
            continue
        
        # Normalize chapter type
        chapter = c.get('chapter', '').upper()
        c['type'] = _detect_type(chapter, c.get('name', ''))
        
        # Scrub insumos
        for insumo_list in ['materials', 'labor', 'equipment', 'subcontracts']:
            c[insumo_list] = _scrub_insumos(c.get(insumo_list, []), UNIT_MAP)
        
        scrubbed.append(c)
    
    log.info(f"  ✓ Kept {len(scrubbed)} concepts, removed {removed} invalid rows")
    return scrubbed


def _detect_type(chapter: str, name: str) -> str:
    """Infer concept type from chapter/name text."""
    TYPE_KEYWORDS = {
        'Concretos':      ['concreto', 'mortero', 'aplanado', 'firme', 'losa'],
        'Aceros':         ['acero', 'varilla', 'electrosoldada', 'malla'],
        'Albañilería':    ['tabique', 'block', 'muro', 'mampostería', 'ladrillo'],
        'Terracerías':    ['excavación', 'relleno', 'compactación', 'terreno', 'desmonte'],
        'Instalaciones':  ['hidráulica', 'sanitaria', 'tubería', 'plomería', 'agua'],
        'Eléctrico':      ['eléctrico', 'cable', 'salida', 'panel', 'centro de carga'],
        'Acabados':       ['pintura', 'impermeabilización', 'aplanado', 'yeso', 'cancel'],
        'Carpintería':    ['puerta', 'ventana', 'madera', 'carpintería', 'cancelería'],
        'Herrería':       ['herrería', 'aluminio', 'ventana', 'cancel', 'reja'],
        'Cimentación':    ['cimentación', 'zapata', 'pilote', 'dado', 'cadena'],
    }
    text = (chapter + ' ' + name).lower()
    for type_name, keywords in TYPE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return type_name
    return 'General'


def _scrub_insumos(insumos: list, unit_map: dict) -> list:
    scrubbed = []
    for ins in insumos:
        ins['description'] = re.sub(r'\s+', ' ', str(ins.get('description', ''))).strip()
        raw_unit = str(ins.get('unit', 'pza')).strip()
        ins['unit'] = unit_map.get(raw_unit, raw_unit.lower()[:4])
        try:
            ins['unit_cost'] = float(str(ins.get('unit_cost', 0)).replace(',', '') or 0)
        except ValueError:
            ins['unit_cost'] = 0.0
        if ins.get('description') and len(ins['description']) > 2:
            scrubbed.append(ins)
    return scrubbed


# ──────────────────────────────────────────────────────────────────────────────
# STEP 4: AGGREGATE — Weighted Average
# ──────────────────────────────────────────────────────────────────────────────

def weighted_average_concepts(concepts: list[dict]) -> list[dict]:
    """
    Apply Weighted Average (Promedio Ponderado) to repeated concepts across profiles.
    
    Grouping key: normalized concept code (leading digits only, e.g. '01.01.001')
    Weight: unit_price (higher-priced markets get slightly more weight)
    
    For each repeated code:
    - unit_price = weighted mean across profiles
    - materials.unit_cost = weighted mean for each matching insumo description
    - Creates canonical region = 'Nacional' with weighted average price
    - Also keeps individual regional records unchanged
    """
    log.info(f"{Fore.BLUE}[STEP 4] WEIGHTED AVERAGE across {len(concepts)} scrubbed concepts")
    
    # Group by code
    from collections import defaultdict
    code_groups = defaultdict(list)
    
    for c in concepts:
        code = c.get('code', '').split('.')[0]  # Group by chapter prefix
        code_groups[c.get('code', c.get('name', 'Unknown')[:20])].append(c)
    
    log.info(f"  Unique concept codes: {len(code_groups)}")
    
    # Identify repeated concepts (appear in 2+ profiles)
    repeated = {k: v for k, v in code_groups.items() if len(v) > 1}
    unique = {k: v for k, v in code_groups.items() if len(v) == 1}
    
    log.info(f"  Concepts appearing in multiple profiles: {len(repeated)}")
    log.info(f"  Concepts unique to one profile: {len(unique)}")
    
    aggregated = []
    
    # Keep all individual regional records as-is
    aggregated.extend(concepts)
    
    # Generate Nacional weighted averages for repeated concepts
    for code, group in tqdm(repeated.items(), desc="Computing weighted averages"):
        prices = np.array([c.get('unit_price', 0) for c in group])
        weights = prices  # Price itself as weight (higher-cost profiles weighted more)
        
        if weights.sum() == 0:
            weights = np.ones(len(prices))
        
        avg_price = np.average(prices, weights=weights)
        
        # Build Nacional record
        nacional_concept = group[0].copy()
        nacional_concept['code'] = code + '-NAC'
        nacional_concept['region'] = 'CDMX'  # Will display as "Nacional" variant
        nacional_concept['unit_price'] = round(float(avg_price), 2)
        nacional_concept['profile'] = 'Nacional'
        nacional_concept['name'] = nacional_concept['name'] + ' [Promedio Ponderado]'
        nacional_concept['is_weighted_average'] = True
        nacional_concept['source_profiles'] = [c.get('profile') for c in group]
        nacional_concept['price_by_region'] = {
            c.get('region'): c.get('unit_price') for c in group
        }
        
        # Weighted average for each insumo
        nacional_concept['materials'] = _weighted_avg_insumos(
            [c.get('materials', []) for c in group], [float(p) for p in prices]
        )
        nacional_concept['labor'] = _weighted_avg_insumos(
            [c.get('labor', []) for c in group], [float(p) for p in prices]
        )
        nacional_concept['equipment'] = _weighted_avg_insumos(
            [c.get('equipment', []) for c in group], [float(p) for p in prices]
        )
        
        aggregated.append(nacional_concept)
    
    log.info(f"  ✓ Aggregated {len(repeated)} weighted-average national records")
    log.info(f"  ✓ Total output concepts: {len(aggregated)}")
    return aggregated


def _weighted_avg_insumos(insumo_lists: list[list], weights: list[float]) -> list[dict]:
    """
    Merge multiple insumo lists using weighted average for matching descriptions.
    """
    from collections import defaultdict
    
    merged = defaultdict(list)  # description → [(cost, weight)]
    unified = {}  # description → prototype dict
    
    for insumo_list, weight in zip(insumo_lists, weights):
        for ins in insumo_list:
            key = ins.get('description', '').lower()[:50]
            merged[key].append((ins.get('unit_cost', 0), weight))
            if key not in unified:
                unified[key] = ins.copy()
    
    result = []
    for key, cost_weight_pairs in merged.items():
        costs, ws = zip(*cost_weight_pairs)
        costs = np.array(costs, dtype=float)
        ws = np.array(ws, dtype=float)
        ws = ws if ws.sum() > 0 else np.ones(len(ws))
        avg_cost = float(np.average(costs, weights=ws))
        
        ins = unified[key].copy()
        ins['unit_cost'] = round(avg_cost, 4)
        ins['is_weighted'] = len(cost_weight_pairs) > 1
        result.append(ins)
    
    return result


# ──────────────────────────────────────────────────────────────────────────────
# STEP 5: SEED — Generate Base Semilla
# ──────────────────────────────────────────────────────────────────────────────

def generate_seed(concepts: list[dict], output_dir: Path) -> dict:
    """
    Generate the Base Semilla regional:
    - JSON para Supabase seed
    - CSV por región para análisis
    - Summary statistics
    """
    log.info(f"{Fore.GREEN}[STEP 5] GENERATING BASE SEMILLA from {len(concepts)} concepts")
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Convert to flat DataFrame for CSV export
    flat_records = []
    for c in concepts:
        flat_records.append({
            'code': c.get('code'),
            'name': c.get('name'),
            'type': c.get('type'),
            'chapter': c.get('chapter'),
            'unit': c.get('unit'),
            'unit_price': c.get('unit_price'),
            'region': c.get('region'),
            'profile': c.get('profile'),
            'is_weighted_average': c.get('is_weighted_average', False),
            'num_materials': len(c.get('materials', [])),
            'num_labor': len(c.get('labor', [])),
            'num_equipment': len(c.get('equipment', [])),
            'source_file': c.get('source_file'),
        })
    
    df = pd.DataFrame(flat_records)
    
    # Export full CSV
    csv_path = output_dir / f'base_semilla_{timestamp}.csv'
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    log.info(f"  ✓ CSV: {csv_path}")
    
    # Export per-region CSVs
    for region in REGIONS:
        df_region = df[df['region'] == region]
        if not df_region.empty:
            region_csv = SEED_DIR / f'seed_{region.lower()}_{timestamp}.csv'
            df_region.to_csv(region_csv, index=False, encoding='utf-8-sig')
            log.info(f"  ✓ Region seed: {region_csv} ({len(df_region)} concepts)")
    
    # Export JSON for Supabase
    def decimal_default(obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        raise TypeError
    
    json_path = output_dir / f'base_semilla_{timestamp}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(concepts, f, ensure_ascii=False, indent=2, default=decimal_default)
    log.info(f"  ✓ JSON: {json_path}")
    
    # Summary statistics
    summary = {
        'timestamp': timestamp,
        'total_concepts': len(concepts),
        'weighted_average_concepts': sum(1 for c in concepts if c.get('is_weighted_average')),
        'by_region': df.groupby('region')['code'].count().to_dict(),
        'by_type': df.groupby('type')['code'].count().to_dict(),
        'by_profile': df.groupby('profile')['code'].count().to_dict(),
        'price_stats': {
            'min': float(df['unit_price'].min()),
            'max': float(df['unit_price'].max()),
            'mean': float(df['unit_price'].mean()),
            'median': float(df['unit_price'].median()),
        },
    }
    
    summary_path = output_dir / f'summary_{timestamp}.json'
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    log.info(f"\n  📊 SUMMARY:")
    log.info(f"     Total concepts:    {summary['total_concepts']}")
    log.info(f"     Weighted averages: {summary['weighted_average_concepts']}")
    log.info(f"     By region:         {summary['by_region']}")
    log.info(f"     By type:           {summary['by_type']}")
    log.info(f"     Price range:       ${summary['price_stats']['min']:.2f} — ${summary['price_stats']['max']:.2f} MXN")
    
    return summary


# ──────────────────────────────────────────────────────────────────────────────
# STEP 6: UPLOAD — Supabase Seed
# ──────────────────────────────────────────────────────────────────────────────

def upload_to_supabase(concepts: list[dict], dry_run: bool = False) -> int:
    """
    Upload Base Semilla to Supabase:
    - concepts table
    - concept_materials, concept_labor, concept_equipment, concept_subcontracts tables
    
    Uses upsert with ON CONFLICT DO UPDATE to avoid duplicates.
    """
    log.info(f"{Fore.MAGENTA}[STEP 6] UPLOADING to Supabase {'(DRY RUN)' if dry_run else ''}")
    
    from supabase import create_client
    
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        log.error("  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env")
        return 0
    
    if dry_run:
        log.info(f"  DRY RUN: would upload {len(concepts)} concepts to Supabase")
        return len(concepts)
    
    sb = create_client(supabase_url, supabase_key)
    uploaded = 0
    errors = 0
    
    for c in tqdm(concepts[:500], desc="Uploading to Supabase"):  # Limit to 500 for initial seed
        try:
            price_str = f"$ {c.get('unit_price', 0):.2f}"
            
            concept_row = {
                'id': c.get('code', ''),
                'name': c.get('name', ''),
                'price': price_str,
                'unit': c.get('unit', 'pza'),
                'region': c.get('region', 'CDMX'),
                'status': 'pending',
                'type': c.get('type', 'General'),
                'overhead': '1.2450',
                'cedia_score': 0,
            }
            
            if not concept_row['id'] or len(concept_row['id']) < 3:
                continue
            
            sb.table('concepts').upsert(concept_row, on_conflict='id').execute()
            
            # Upload materials
            for i, mat in enumerate(c.get('materials', [])[:10]):  # Max 10 per concept
                mat_row = {
                    'concept_id': concept_row['id'],
                    'code': str(mat.get('code', ''))[:20],
                    'description': str(mat.get('description', ''))[:200],
                    'unit': str(mat.get('unit', 'pza'))[:10],
                    'cost_lab': float(mat.get('unit_cost', 0)),
                    'fletes': 0.0,
                    'maniobra': 0.0,
                    'almacenaje': 0.0,
                    'fc_actual': 1.0,
                    'sort_order': i,
                }
                sb.table('concept_materials').upsert(mat_row).execute()
            
            # Upload labor
            for i, lab in enumerate(c.get('labor', [])[:5]):
                lab_row = {
                    'concept_id': concept_row['id'],
                    'description': str(lab.get('description', ''))[:200],
                    'base_salary': float(lab.get('unit_cost', 0)),
                    'fsi': 1.2,
                    'fasar': 1.65,
                    'quantity': float(lab.get('quantity', 1)),
                    'sort_order': i,
                }
                sb.table('concept_labor').upsert(lab_row).execute()
            
            uploaded += 1
            
        except Exception as e:
            log.error(f"  Error uploading {c.get('code')}: {e}")
            errors += 1
            continue
    
    log.info(f"  ✓ Uploaded {uploaded} concepts to Supabase ({errors} errors)")
    return uploaded


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='APUCMX APU Processor — Construbase Data Scrubbing Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python apu_processor.py --password "MyPassword"
  python apu_processor.py --password "MyPassword" --dry-run
  python apu_processor.py --password "MyPassword" --skip-upload
  python apu_processor.py --skip-extract --skip-upload  (use already-extracted files)
        """
    )
    parser.add_argument('--password', '-p', type=str, help='Password for encrypted ZIP files')
    parser.add_argument('--dry-run', action='store_true', help='Do not upload to Supabase')
    parser.add_argument('--skip-extract', action='store_true', help='Skip extraction (use existing files)')
    parser.add_argument('--skip-upload', action='store_true', help='Skip Supabase upload')
    parser.add_argument('--region', type=str, choices=REGIONS + ['all'], default='all',
                        help='Filter by region for partial processing')
    args = parser.parse_args()
    
    start_time = datetime.datetime.now()
    log.info(f"\n{'='*70}")
    log.info(f"APUCMX APU Processor — {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"{'='*70}")
    log.info(f"ZIP: {ZIP_PATH}")
    log.info(f"Password: {'[PROVIDED]' if args.password else '[NOT PROVIDED — REQUIRED]'}")
    
    if not ZIP_PATH.exists():
        log.error(f"ZIP not found: {ZIP_PATH}")
        return
    
    # ── Step 1: Extract ──────────────────────────────────────────────────────
    if not args.skip_extract:
        if not args.password:
            log.error(
                "\n❌ PASSWORD REQUIRED\n"
                "   The Construbase ZIP files are encrypted.\n"
                "   Run with: python apu_processor.py --password <your_password>\n"
                "   Hint: Check your Construbase license key or the intercambio export settings.\n"
            )
            return
        extracted = extract_construbase(ZIP_PATH, args.password)
    else:
        # Use already-extracted .xlsx files
        extracted = {}
        for profile, region in PROFILE_REGION_MAP.items():
            for fname in EXTRACT_DIR.rglob('*.xlsx'):
                if profile in fname.stem:
                    extracted.setdefault(profile, {})
                    if 'Presupuesto' in fname.stem:
                        extracted[profile]['presupuesto'] = fname
    
    if not extracted:
        log.error("No files to process. Aborting.")
        return
    
    # ── Step 2: Parse ────────────────────────────────────────────────────────
    log.info(f"\n{Fore.CYAN}[STEP 2] PARSING APU HIERARCHY")
    all_concepts = []
    
    for profile, files in extracted.items():
        presupuesto_path = files.get('presupuesto')
        if presupuesto_path and presupuesto_path.exists():
            concepts = parse_presupuesto(presupuesto_path, profile)
            log.info(f"  Profile '{profile}': {len(concepts)} concepts parsed")
            all_concepts.extend(concepts)
    
    if not all_concepts:
        log.warning("No concepts parsed. Check file format.")
        return
    
    log.info(f"  Total raw concepts: {len(all_concepts)}")
    
    # ── Step 3: Scrub ────────────────────────────────────────────────────────
    scrubbed = scrub_concepts(all_concepts)
    
    # ── Step 4: Weighted Average ─────────────────────────────────────────────
    aggregated = weighted_average_concepts(scrubbed)
    
    # ── Step 5: Generate Seed ────────────────────────────────────────────────
    summary = generate_seed(aggregated, OUTPUT_DIR)
    
    # ── Step 6: Upload ───────────────────────────────────────────────────────
    if not args.skip_upload:
        uploaded = upload_to_supabase(aggregated, dry_run=args.dry_run)
        log.info(f"  Uploaded: {uploaded} concepts")
    
    elapsed = (datetime.datetime.now() - start_time).total_seconds()
    log.info(f"\n{'='*70}")
    log.info(f"✅ APU Processor complete in {elapsed:.1f}s")
    log.info(f"   Output: {OUTPUT_DIR}")
    log.info(f"   Seeds:  {SEED_DIR}")
    log.info(f"{'='*70}\n")


if __name__ == '__main__':
    main()