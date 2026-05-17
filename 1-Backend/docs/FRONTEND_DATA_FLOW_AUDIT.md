# APUCMX — Frontend ↔ Supabase Data Flow Audit

**Rol:** CTO Full-Stack Auditor  
**Fecha:** 2026-04-13  
**Proyecto Supabase:** `luymgdurhqjrvfiocxei` — "Centro de datos de Precios"  
**Scope:** `concepts`, `concept_lines`, `concept_materials`, `concept_labor`, `concept_equipment`, `concept_subcontracts`, `concept_overcost`

---

## 1. Estado Real de la Base de Datos

| Tabla | Filas reales | RLS activo |
|---|---|---|
| `concepts` | **15** | ✅ |
| `concept_lines` | **13** (3 conceptos) | ✅ |
| `concept_materials` | **2** (solo HID-001) | ✅ |
| `concept_labor` | **1** (solo HID-001) | ✅ |
| `concept_equipment` | **1** (solo HID-001) | ✅ |
| `concept_subcontracts` | 0 | ✅ |
| `concept_overcost` | **4** (ALB-MURO-BLOCK15-001, CONC-ZAPT-M200-001, EXC-MANUAL-MO-001, HID-001) | ✅ |

**Nota crítica:** El campo `user_id` es `NULL` en **todos** los conceptos existentes. Esto es relevante para la auditoría de RLS (ver Sección 4).

---

## 2. Shape Comparison: Supabase DB vs. React/TypeScript

### 2.1 `concepts` tabla

| Campo DB | Tipo DB | Campo Frontend (ConceptRow) | Tipo TS | ¿Coincide? |
|---|---|---|---|---|
| `id` | `TEXT` | `id` | `string` | ✅ |
| `name` | `TEXT` | `name` | `string` | ✅ |
| `price` | `TEXT` (legacy) | `price` | `string` | ⚠️ inconsistente (ver Bug #1) |
| `unit` | `TEXT` default `'pza'` | `unit` | `string` | ✅ |
| `region` | `TEXT` CHECK constraint | `region` | `Region` | ✅ |
| `status` | `TEXT` CHECK `('verified','pending','rejected')` | `status` | `'verified'\|'pending'` | ⚠️ falta `'rejected'` (ver Bug #2) |
| `type` | `TEXT` | `type` | `string` | ✅ |
| `overhead` | `TEXT` nullable | `overhead` | `string` | ✅ |
| `user_id` | `UUID` nullable | `user_id` | `string\|null` | ✅ |
| `cedia_score` | `NUMERIC` | `cedia_score` | `number` | ✅ |
| `adoption_count` | `INT4` | `adoption_count` | `number` | ✅ |
| `apuc_credits_earned` | `NUMERIC` | `apuc_credits_earned` | `number` | ✅ |

### 2.2 `concept_lines` tabla (tabla unificada)

| Campo DB | Campo esperado en mapLine() | ¿Coincide? |
|---|---|---|
| `id` | `id` | ✅ |
| `concept_id` | `concept_id` | ✅ |
| `tipo` | discriminador para routing | ✅ |
| `descripcion` | `descripcion` | ⚠️ Bug #3: frontend buscaba `description` (nombre inglés) |
| `unidad` | `unidad` | ⚠️ Bug #3: frontend buscaba `unit` |
| `cantidad` | `cantidad` | ⚠️ Bug #3: frontend buscaba `quantity` |
| `cost_lab` | `cost_lab` | ✅ |
| `fletes` | `fletes` | ✅ |
| `maniobra` | `maniobra` | ✅ |
| `almacenaje` | `almacenaje` | ✅ |
| `fc_actual` | `fc_actual` | ✅ |
| `fsi` | `fsi` | ✅ |
| `fasar` | `fasar` | ✅ |
| `insumo_codigo` | `code` (para materiales) | ⚠️ Bug #3: campo nombrado diferente |

### 2.3 `concept_overcost` tabla

| Campo DB | Mapeado en frontend | ¿Coincide? |
|---|---|---|
| `indirecto_honorarios` | `indirectoHonorarios` | ✅ |
| `indirecto_depreciacion` | `indirectoDepreciacion` | ✅ |
| `indirecto_servicios` | `indirectoServicios` | ✅ |
| `indirecto_gastos_oficina` | `indirectoGastosOficina` | ✅ |
| `indirecto_fletes` | `indirectoFletes` | ✅ |
| `indirecto_capacitacion` | `indirectoCapacitacion` | ✅ |
| `indirecto_seguridad` | `indirectoSeguridad` | ✅ |
| `indirecto_auxiliares` | `indirectoAuxiliares` | ✅ |
| `financiamiento` | `financiamiento` | ✅ |
| `utilidad` | `utilidad` | ✅ |
| `cargos_adicionales` | `cargosAdicionales` | ✅ |
| `imss` | `imss` | ✅ |
| `seguros` | `seguros` | ✅ |

**Veredicto overcost mapping:** [PASS] — el mapeo snake_case → camelCase es correcto.

---

## 3. Bugs Detectados

### Bug #1 — `price` inconsistente entre filas [FAIL]

**Evidencia:**
```
concepts.price valores reales:
  CLAVE-001  → "$2,450.00"   ← tiene signo $ y coma (texto legacy)
  ALB-205    → "$185.00"     ← tiene signo $
  ALB-MURO-BLOCK15-001 → "540.00"  ← sin signo $, número puro
  CONC-ZAPT-M200-001   → "2850.00" ← número puro
```

**Problema:** El UI renderiza `{concept.price}` directamente. Las filas legacy muestran `"$2,450.00"` correcto, las nuevas muestran `"540.00"` sin formato de moneda.

**Fix aplicado:** `normalizePrice()` en `ConceptContext.tsx` — parsea cualquier formato y emite `$X,XXX.XX` con `toLocaleString('es-MX')`.

---

### Bug #2 — `status: 'rejected'` rompe el tipo TypeScript [FAIL]

**Evidencia:**
```sql
-- DB permite: 'verified' | 'pending' | 'rejected'
-- Tipo TS Concept: 'verified' | 'pending'  ← falta 'rejected'
```

**Problema:** Si una fila tiene `status='rejected'`, TypeScript type-narrows a `never` en asignaciones, y la UI muestra etiquetas incorrectas.

**Fix aplicado:** `mapDbConcept` mapea `'rejected'` → `'pending'` para display. Si en el futuro se requiere mostrar rejected, agregar el tipo en la interfaz `Concept`.

---

### Bug #3 — `concept_lines`: nombres de campo en español vs inglés [FAIL]

**Evidencia (schema real):**
```sql
concept_lines.descripcion  -- español
concept_lines.unidad       -- español
concept_lines.cantidad     -- español
concept_lines.insumo_codigo -- referencia al catálogo
```

**Problema (código original `mapDbConcept`):**
El mapper original asumía `row.description`, `row.unit`, `row.quantity` (nombres en inglés), devolviendo siempre `undefined` para esos campos al leer `concept_lines`.

**Fix aplicado:** `mapLine()` usa `row.descripcion ?? row.description`, `row.unidad ?? row.unit`, `row.cantidad ?? row.quantity` como fallback bidireccional. Compatible con ambos schemas.

---

### Bug #4 — `fetchConcepts` usaba MOCK en vez de Supabase [FAIL — CRÍTICO]

**Evidencia (código original en `ConceptContext.tsx`):**
```ts
// Temporarily using mock data instead of Supabase as per user request
const { MOCK_CONCEPTS } = await import('../lib/mockData');
setConcepts(MOCK_CONCEPTS);
```

**Problema:** Aunque el usuario reportó haber "descomentado las líneas de Antigravity", el código en repositorio **seguía usando mockData** sin ninguna llamada a Supabase en `fetchConcepts`. La función real de Supabase existía solo en `addConcept`.

**Fix aplicado:** `fetchConcepts` reemplazado completamente con consultas reales a Supabase. El mock ya no se importa en este flujo.

---

### Bug #5 — `selectedId` hardcoded a `'CLAVE-001'` en ExplorerPage [NEEDS REVIEW]

**Evidencia:**
```tsx
const [selectedId, setSelectedId] = useState('CLAVE-001');
```

**Problema:** Si el primer concepto en la DB no es `CLAVE-001`, el panel lateral aparece vacío hasta que el usuario hace clic en un concepto. Actualmente `CLAVE-001` existe en la DB, así que no falla, pero es frágil.

**Recomendación:** Inicializar con `null` o con el primer concepto de la lista tras cargar:
```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);
// ...
const selectedConcept = useMemo(() => {
  if (selectedId) return concepts.find(c => c.id === selectedId) ?? null;
  return filteredConcepts[0] ?? null;
}, [selectedId, concepts, filteredConcepts]);
```
Este cambio es opcional (no crítico mientras CLAVE-001 exista), pero mejora la robustez. No se aplicó para respetar la restricción de mínimo cambio.

---

### Bug #6 — `concept_lines` RLS bloquea a usuarios anónimos [FAIL — BLOCKER para demo]

**Evidencia (políticas reales en Supabase):**
```sql
-- concept_lines solo tiene políticas _own (requieren auth.uid())
concept_lines_select_own: USING (EXISTS (SELECT 1 FROM concepts c WHERE c.id = concept_lines.concept_id AND c.user_id = auth.uid()))
```

**Problema:** No existe política `concept_lines_public_read` equivalente a la que tienen `concept_materials`, `concept_labor`, `concept_equipment` (`qual: "true"`). Como todos los `concepts.user_id = NULL`, la condición `c.user_id = auth.uid()` **nunca es verdadera** incluso con un usuario autenticado. Un usuario anónimo recibe **0 filas** de `concept_lines`.

**Impacto actual:** Los 3 conceptos con líneas (`ALB-MURO-BLOCK15-001`, `CONC-ZAPT-M200-001`, `EXC-MANUAL-MO-001`) **no muestran sus materiales/mano de obra/equipo** en el panel lateral.

**Fix:** Ver `docs/RLS_DEMO_READ_POLICIES.sql`.

---

### Bug #7 — `concept_overcost` RLS idéntico problema [FAIL — BLOCKER para demo]

**Evidencia:**
```sql
concept_overcost_select_own: USING (EXISTS (SELECT 1 FROM concepts c WHERE c.id = concept_overcost.concept_id AND c.user_id = auth.uid()))
-- Adicionalmente existe overcost_public_read: qual: "true" ← esta SÍ existe
```

**Análisis:** `concept_overcost` tiene **dos políticas SELECT conflictivas**:
1. `overcost_public_read` con `qual: true` → permite lectura pública ✅
2. `concept_overcost_select_own` con `qual: user_id match` → restrictiva

Debido a que las políticas son **PERMISSIVE** (OR lógico), la política pública prevalece. **El overcost SÍ es legible sin autenticación.** [PASS condicional]

---

### Bug #8 — `concept_lines` vs tablas dedicadas: dualidad sin documentar [NEEDS REVIEW]

**Evidencia:** El sistema tiene DOS mecanismos paralelos para almacenar líneas de APU:
- Tablas dedicadas: `concept_materials`, `concept_labor`, `concept_equipment`, `concept_subcontracts`
- Tabla unificada: `concept_lines` (schema del documento estratégico v3)

Algunos conceptos usan las tablas dedicadas (HID-001), otros usan `concept_lines` (ALB-MURO-BLOCK15-001, CONC-ZAPT-M200-001, EXC-MANUAL-MO-001).

**Fix aplicado:** `mapDbConcept` usa tablas dedicadas como prioridad; si están vacías para ese `concept_id`, usa `concept_lines` como fallback. Esto cubre ambos casos sin romper nada.

---

## 4. RLS Summary

| Tabla | Lectura pública (anon) | Lectura autenticado | Escritura |
|---|---|---|---|
| `concepts` | ✅ `concepts_public_read` (qual: true) | ✅ también `concepts_select_own` | Solo autenticado |
| `concept_materials` | ✅ `materials_public_read` (qual: true) | ✅ | Solo autenticado |
| `concept_labor` | ✅ `labor_public_read` (qual: true) | ✅ | Solo autenticado |
| `concept_equipment` | ✅ `equipment_public_read` (qual: true) | ✅ | Solo autenticado |
| `concept_subcontracts` | ✅ `subcontracts_public_read` (qual: true) | ✅ | Solo autenticado |
| `concept_lines` | ❌ **BLOCKER** — sin política public_read | ❌ (user_id=NULL bloquea _own) | Solo autenticado |
| `concept_overcost` | ✅ `overcost_public_read` (qual: true) | ✅ | Solo autenticado |

**Conclusión RLS:** El único blocker real es `concept_lines`. Ver `RLS_DEMO_READ_POLICIES.sql`.

---

## 5. Flujo de Datos Corregido

```
[Browser / React]
     │
     ▼
ConceptProvider.fetchConcepts()
     │
     ├── supabase.from('concepts').select('*').order('id')
     │        └── RLS: concepts_public_read → OK para anon
     │
     ├── supabase.from('concept_materials').select('*').in('concept_id', ids)
     │        └── RLS: materials_public_read → OK para anon
     │
     ├── supabase.from('concept_labor').select('*').in('concept_id', ids)
     │        └── RLS: labor_public_read → OK para anon
     │
     ├── supabase.from('concept_equipment').select('*').in('concept_id', ids)
     │        └── RLS: equipment_public_read → OK para anon
     │
     ├── supabase.from('concept_subcontracts').select('*').in('concept_id', ids)
     │        └── RLS: subcontracts_public_read → OK para anon
     │
     ├── supabase.from('concept_lines').select('*').in('concept_id', ids)
     │        └── RLS: ❌ BLOCKER — requiere RLS_DEMO_READ_POLICIES.sql
     │
     └── supabase.from('concept_overcost').select('*').in('concept_id', ids)
              └── RLS: overcost_public_read → OK para anon
     │
     ▼
mapDbConcept() x 15 conceptos
     ├── normalizePrice(row.price)  ← fix Bug #1
     ├── status coercion             ← fix Bug #2
     ├── mapMaterial / mapLabor / mapEquipment / mapSubcontract
     ├── mapLine() con fallback bilingüe ← fix Bug #3
     └── mapOvercost()
     │
     ▼
setConcepts([...15 Concept objects])
     │
     ▼
ExplorerPage: filteredConcepts.map() → listado
     └── selectedConcept → panel lateral (materials, labor, equipment, overcost)
     
DetailPage: concepts.find(c => c.id === id) → matriz completa
```

---

## 6. Resumen de Veredictos

| # | Claim | Evidencia | Veredicto |
|---|---|---|---|
| 1 | `price` tiene formato inconsistente entre filas | Rows: `"$2,450.00"` vs `"540.00"` | [FAIL → FIXED] |
| 2 | `status:'rejected'` no existe en tipo TS | Interface `Concept` vs DB CHECK constraint | [FAIL → FIXED] |
| 3 | `concept_lines` usa nombres de campo en español | Schema real `descripcion`, `unidad`, `cantidad` | [FAIL → FIXED] |
| 4 | `fetchConcepts` cargaba MOCK en lugar de Supabase | Código original con `import('../lib/mockData')` | [FAIL → FIXED] |
| 5 | `selectedId` hardcoded `'CLAVE-001'` | `useState('CLAVE-001')` en ExplorerPage | [NEEDS REVIEW] |
| 6 | `concept_lines` sin política public_read | pg_policies muestra solo `_own` policies | [FAIL — BLOCKER] |
| 7 | `concept_overcost` tiene dos políticas conflictivas | `overcost_public_read` + `concept_overcost_select_own` | [PASS condicional] |
| 8 | Dualidad `concept_lines` vs tablas dedicadas | Rows distribuidas entre ambos sistemas | [NEEDS REVIEW → FIXED con fallback] |
| 9 | `mapDbConcept` mapping de overcost | snake_case → camelCase correcto | [PASS] |
| 10 | `concept_materials / labor / equipment` RLS public | `_public_read` con `qual: true` | [PASS] |
| 11 | `concepts` RLS public read | `concepts_public_read` con `qual: true` | [PASS] |
| 12 | Sorting de líneas | `order('sort_order')` aplicado en fetch | [PASS] |

---

## 7. Archivos Modificados

| Archivo | Tipo de cambio |
|---|---|
| `src/context/ConceptContext.tsx` | Reescritura de `fetchConcepts` + mappers corregidos |
| `docs/FRONTEND_DATA_FLOW_AUDIT.md` | Nuevo — este documento |
| `docs/RLS_DEMO_READ_POLICIES.sql` | Nuevo — fix para concept_lines |

**Archivos NO modificados:** `ExplorerPage.tsx`, `DetailPage.tsx`, `App.tsx`, `supabase.ts`, schema, datos.
