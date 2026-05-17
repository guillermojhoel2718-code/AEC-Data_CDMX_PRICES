# PIPELINE_MVP_APUC — Documentación del Pipeline de Datos NO PDF

> Versión: 1.0 | Fecha: 2026-04-12 | Autor: Data Engineer AEC – APUCMX

---

## 1. Fuentes que alimentan el MVP

| # | Archivo fuente | Ruta en repo | Registros | Tipo de dato | Trazabilidad |
|---|---|---|---|---|---|
| 1 | `Insumos.xls` | `Documentos_Precios/Insumos.xls` | 12,052 | Catálogo de insumos con precio unitario (materiales, MO, acabados, hidráulica) | Fecha de archivo: 2025-05-16 |
| 2 | `Ppto_Gestion_Prueba_02.xlsm` → hoja `02_REF_TAB` | `Documentos_Precios/Ppto_Gestion_Prueba_02.xlsm` | 148 | Insumos de obra real eléctrica (Dyven S.A., CDMX), con código único y fecha por insumo | Fechas 2022–2024 por registro |

### Fuentes descartadas en esta iteración

| Archivo | Razón |
|---|---|
| `Construbase_*.xls / *.xlsx` (8 archivos en `data/raw/extracted/`) | **Vacíos (0 bytes)**. El ZIP de Neodata requiere contraseña para extraerlos. Pendiente para v1.1. |
| `data/seed/machinery_costs_*.json` | Solo 3 registros de maquinaria CMIC (extraídos desde PDFs). Masa insuficiente para MVP. |
| PDFs CMIC / Tabulador CDMX / BIMSA | Fuera del alcance de esta tarea (sin OCR). Pendiente para v1.1. |

---

## 2. Esquema de datos APUC

Todas las salidas normalizadas siguen este esquema canónico:

```
codigo          TEXT        Identificador único reproducible (ver §2.1)
descripcion     TEXT        Nombre del insumo o concepto
unidad          TEXT        Unidad de medida normalizada (pza, m2, m3, ml, kg, ton, lt, jor, hr, jgo, lote, %, %mo)
precio_unitario NUMERIC     Precio en MXN sin IVA
categoria       TEXT        Categoría principal (ver tabla §2.2)
subcategoria    TEXT        Subcategoría o clasificación adicional
fuente          TEXT        Identificador de la fuente de origen
fecha_fuente    DATE        Fecha del precio en la fuente original (YYYY-MM-DD)
unidad_inferida BOOLEAN     True si la unidad fue deducida por regex; False si venía explícita en la fuente
```

### 2.1 Lógica del campo `codigo`

El código es un **hash SHA-1 reproducible** calculado así:

```python
import hashlib, re

def generar_codigo(descripcion: str, unidad: str) -> str:
    clave = re.sub(r"\s+", " ", descripcion.strip().upper()) + "|" + unidad.lower()
    return hashlib.sha1(clave.encode("utf-8")).hexdigest()[:8]
```

- **Entrada:** `descripcion` normalizada (mayúsculas, sin espacios dobles) + `|` + `unidad`
- **Salida:** 8 caracteres hexadecimales — ej. `"ACIDO MURIATICO|pza"` → `"7a3c1f2b"`
- **Propiedad:** el mismo insumo siempre produce el mismo código en cualquier ejecución
- **Excepción:** `ppto_reftab_apuc_norm.csv` usa el **código original del sistema** cuando existe (ej. `MT-ED-SCL-0403`), reservando el hash SHA-1 solo como respaldo si el código original está vacío

### 2.2 Categorías y subcategorías

| Categoría | Subcategoría principal | Fuente |
|---|---|---|
| Materiales Generales | (clasificación NLP de origen) | Insumos.xls |
| Tuberías e Hidráulica | — | Insumos.xls |
| Acabados | — | Insumos.xls |
| Materiales Eléctricos | — | Insumos.xls |
| Material Eléctrico | Equipos de Alta Tensión / Distribución y Canalización | ppto_reftab |
| Aceros | — | Insumos.xls |
| Concretos | — | Insumos.xls |
| Mano de Obra | Electricidad (ppto_reftab) / sin categoría (insumos) | Ambas |
| Madera y Carpintería | — | Insumos.xls |
| Albañilería | — | Insumos.xls |
| Herramienta y Equipo | — | Insumos.xls |
| Indirectos | Andamios / Cabos de Oficios / Otros | ppto_reftab |

### 2.3 Reglas de inferencia de unidad (`unidad_inferida = True`)

Aplicadas en orden sobre `DESCRIPCION` en mayúsculas en `extract_insumos.py`:

| Patrón regex (resumen) | Unidad asignada |
|---|---|
| `AYUDANTE`, `ALBAÑIL`, `OFICIAL`, `JOR`, `JORNADA`, … | `jor` |
| `ML`, `METRO LINEAL`, `X N.N M` | `ml` |
| `M2`, `M²`, `METRO CUADRADO` | `m2` |
| `M3`, `M³`, `METRO CÚBICO` | `m3` |
| `KG`, `KGS`, `KILOGRAMO` | `kg` |
| `TON`, `TONELADA` | `ton` |
| `LT`, `LTS`, `LITRO` | `lt` |
| `KW`, `KWH`, `KVA` | `kw` |
| `HR`, `HRS`, `HORA` | `hr` |
| `JUEGO`, `JGO`, `SET`, `CONJUNTO` | `jgo` |
| `LOTE`, `LOT`, `BULTO` | `lote` |
| `PZA`, `PIEZA`, `UNIDAD`, `C/U` | `pza` |
| `\bM\b` (genérico, al final) | `m` |
| (sin coincidencia) | `pza` ← relleno conservador |

Cuando `unidad_inferida = False` (fuente `ppto_reftab`), la unidad proviene directamente de la columna `Unidad` del archivo original.

---

## 3. Archivos generados

| Archivo | Ruta | Registros | Descripción |
|---|---|---|---|
| `insumos_apuc_norm.csv` | `data/processed/` | 12,052 | Catálogo normalizado de Insumos.xls |
| `ppto_reftab_apuc_norm.csv` | `data/processed/` | 148 | Insumos de obra real CDMX (Dyven) |
| `catalogo_apuc_mvp.csv` | `data/processed/` | 12,200 | Catálogo consolidado (merge de ambas fuentes) |
| `catalogo_apuc_mvp.json` | `data/processed/` | 12,200 | Mismo catálogo en JSON (array de objetos) |

---

## 4. Cómo un frontend React puede consumir estos datos

### Opción A — JSON estático (sin backend, modo demo)

```typescript
// src/lib/apucData.ts
import catalog from '../../data/processed/catalogo_apuc_mvp.json'

export interface ApucRecord {
  codigo: string
  descripcion: string
  unidad: string
  precio_unitario: number
  categoria: string
  subcategoria: string
  fuente: string
  fecha_fuente: string
  unidad_inferida: boolean
}

export const catalog: ApucRecord[] = catalog

// Búsqueda por texto
export function buscarInsumos(query: string): ApucRecord[] {
  const q = query.toLowerCase()
  return catalog.filter(r =>
    r.descripcion.toLowerCase().includes(q) ||
    r.codigo.toLowerCase().includes(q)
  )
}

// Filtrar por categoría
export function porCategoria(cat: string): ApucRecord[] {
  return catalog.filter(r => r.categoria === cat)
}
```

> ⚠️ El JSON tiene 12,200 registros (~3–4 MB). Para producción, migrar a Supabase (ver §5).

### Opción B — Supabase (producción)

1. Crear tabla `apuc_insumos` con el esquema de §2
2. Importar `catalogo_apuc_mvp.csv` directamente desde la UI de Supabase → Table Editor → Import CSV
3. Consumir desde React con `supabase-js`:

```typescript
import { supabase } from './lib/supabase'

async function buscarInsumos(query: string, categoria?: string) {
  let q = supabase
    .from('apuc_insumos')
    .select('*')
    .ilike('descripcion', `%${query}%`)
    .order('descripcion')
    .limit(50)

  if (categoria) {
    q = q.eq('categoria', categoria)
  }

  const { data, error } = await q
  return data
}
```

### Opción C — API REST desde CSV (desarrollo rápido)

Con `csv-parse` o `papaparse` en un Edge Function de Supabase o en Next.js:

```typescript
// pages/api/apuc/search.ts
import Papa from 'papaparse'
import fs from 'fs'

export default function handler(req, res) {
  const file = fs.readFileSync('data/processed/catalogo_apuc_mvp.csv', 'utf-8')
  const { data } = Papa.parse(file, { header: true, dynamicTyping: true })
  const q = req.query.q?.toLowerCase() || ''
  const results = data.filter(r => r.descripcion.toLowerCase().includes(q))
  res.json(results.slice(0, 100))
}
```

---

## 5. Pendientes — Próximas iteraciones

### v1.1 — Fuentes NO PDF pendientes

| Tarea | Archivo | Requisito |
|---|---|---|
| Extraer Construbase Neodata | `data/raw/Construbases_Febrero_2026_Intercambio.zip` | Contraseña del ZIP de Neodata + licencia |
| Procesar FASAR y costos horarios | `Construbase_*_FasarXn_*.xls` | Igual que arriba |
| Completar catálogo de maquinaria | `data/seed/machinery_costs_*.json` | Requerirá OCR de PDFs CMIC |

### v1.2 — Fuentes PDF (requieren OCR)

| Fuente | Valor para el catálogo |
|---|---|
| `tabulador-general-de-precios-unitarios-del-gobierno-de-la-ciudad-de-mexico-enero-2025.pdf` | **Crítico** — precios oficiales CDMX 2025 |
| Catálogos CMIC 2023 (10 PDFs en `data/raw/`) | Costos horarios de maquinaria, rendimientos |
| `BIMSA_Obra Blanca 2024.pdf` | Precios de acabados de alta calidad |
| `CATALOGO_DE_COSTOS_HORARIOS_DE_MAQUINARIA.pdf` | Equipos y maquinaria pesada |

### v1.3 — Infraestructura

| Tarea | Descripción |
|---|---|
| Migrar a Supabase | Importar `catalogo_apuc_mvp.csv` a tabla `apuc_insumos` con Row Level Security |
| Índices de búsqueda | `CREATE INDEX ON apuc_insumos USING gin(to_tsvector('spanish', descripcion))` |
| Blockchain (CEDIA) | Hash SHA-256 del CSV completo → registro inmutable en Polygon para certificar la versión |
| Regionalización | Añadir campo `region` y conectar con filtros del frontend (Inbox regional) |

---

## 6. Cómo re-ejecutar el pipeline

```bash
# Desde la raíz del repositorio
pip install pandas openpyxl xlrd

python scripts/extract_insumos.py       # → data/processed/insumos_apuc_norm.csv
python scripts/extract_ppto_reftab.py   # → data/processed/ppto_reftab_apuc_norm.csv
python scripts/merge_apuc_catalog.py    # → data/processed/catalogo_apuc_mvp.csv + .json
```

El pipeline es **completamente reproducible**: los mismos archivos fuente producen siempre los mismos códigos hash y los mismos CSVs de salida.
