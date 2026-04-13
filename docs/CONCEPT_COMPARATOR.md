# CONCEPT_COMPARATOR — Documentación de Feature

## Descripción
Vista nueva accesible desde `/comparator`. Permite seleccionar 2 conceptos del catálogo APUCMX y comparar sus costos desglosados lado a lado.

## Ruta
`/comparator` — accesible desde el botón "Comparar" en ExplorerPage.

## Componente
`src/components/ConceptComparator.tsx`

## Fuente de datos
Reutiliza `useConcepts()` de `ConceptContext`. No realiza queries adicionales a Supabase. No modifica el backend ni el schema.

## Campos comparados
- Código, Nombre, Unidad, Región, Tipo
- Subtotal Materiales (formula: Σ (costLab + fletes + maniobra + almacenaje) × fcActual)
- Subtotal Mano de Obra (formula: Σ baseSalary × fsi × fasar × quantity)
- Subtotal Equipo (formula: igual a materiales)
- Costo Directo Total (suma de los tres subtotales)
- Sobrecostos: indirectos, financiamiento, utilidad (% aplicados sobre costo directo)
- Precio Unitario Total
- Δ$ y Δ% entre los dos conceptos

## Lógica de valores vacíos
- Si un bloque (materials, labor, equipment) es undefined o length===0, muestra "—" en lugar de "$0.00".
- Si overcostFactors es undefined, muestra "—" en filas de sobrecostos.
- El costo directo hace fallback al precio raw del concepto si todos los subtotales son 0.

## Decisiones de diseño
1. No se creó contexto nuevo — se reutiliza ConceptContext para consistencia.
2. Los cálculos son puramente client-side para no introducir queries ni edge functions.
3. La columna de menor precio se resalta con borde verde y badge para UX inmediata.
4. Se usó `motion.div` para mantener coherencia de animaciones con el resto de APUCMX.

## Pruebas manuales (con seed data)
| Prueba | Pasos | Resultado esperado |
|--------|-------|-------------------|
| Selección básica | Dropdown A: CLAVE-001, Dropdown B: CLAVE-003 | Tabla renderizada con precios $2,450 vs $850 |
| Concepto con overcost | A: ALB-MURO-BLOCK15-001, B: CONC-ZAPT-M200-001 | Filas de sobrecostos con valores % |
| Concepto sin sub-tablas | A: CLAVE-001 (sin materials), B: CLAVE-002 | Subtotales muestran "—" |
| Mismo concepto | Seleccionar mismo ID en A y B | Alerta inline "Selecciona conceptos diferentes" |
| Resaltado menor precio | Cualquier par con precios distintos | Columna con menor precio tiene borde verde + badge |
| Diferencias | Cualquier par | Δ$ y Δ% calculados correctamente con signo |
