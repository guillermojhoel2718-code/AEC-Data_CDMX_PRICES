-- =============================================================================
-- APUCMX — RLS Fix: concept_lines lectura pública para demo
-- Proyecto: luymgdurhqjrvfiocxei
-- Fecha: 2026-04-13
-- Autor: CTO Audit (Perplexity Computer)
--
-- PROBLEMA DOCUMENTADO:
--   concept_lines solo tiene políticas _own que requieren auth.uid() = user_id.
--   Como todos los conceptos seed tienen user_id = NULL, ningún cliente
--   (ni autenticado ni anónimo) puede leer las líneas de esos conceptos.
--
-- TABLAS AFECTADAS: concept_lines
-- TABLAS SIN PROBLEMA: concept_materials, concept_labor, concept_equipment,
--                      concept_subcontracts, concept_overcost, concepts
--                      (todas tienen políticas _public_read con qual: true)
--
-- INSTRUCCIONES:
--   Ejecutar este bloque UNA VEZ en el SQL Editor de Supabase.
--   No modifica el schema ni los datos existentes.
--   Es reversible (ver sección ROLLBACK al final).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- FIX: Agregar política de lectura pública para concept_lines
-- Permite que cualquier cliente (anon o autenticado) pueda leer todas las
-- líneas de todos los conceptos. Esto es coherente con el comportamiento
-- de concept_materials, concept_labor, concept_equipment, concept_subcontracts.
-- ---------------------------------------------------------------------------
CREATE POLICY "concept_lines_public_read"
    ON public.concept_lines
    FOR SELECT
    USING (true);


-- ---------------------------------------------------------------------------
-- VERIFICACIÓN (ejecutar por separado para confirmar)
-- ---------------------------------------------------------------------------
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'concept_lines'
-- ORDER BY policyname;
--
-- Resultado esperado tras aplicar:
--   concept_lines_delete_own   | DELETE | EXISTS(...)
--   concept_lines_insert_own   | INSERT | (null)
--   concept_lines_public_read  | SELECT | true          ← NUEVA
--   concept_lines_select_own   | SELECT | EXISTS(...)
--   concept_lines_update_own   | UPDATE | EXISTS(...)


-- ---------------------------------------------------------------------------
-- ROLLBACK (si es necesario revertir)
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "concept_lines_public_read" ON public.concept_lines;


-- =============================================================================
-- NOTA SOBRE CONSISTENCIA DE user_id = NULL EN CONCEPTOS SEED
-- =============================================================================
-- Los 15 conceptos actuales tienen user_id = NULL porque fueron cargados
-- por scripts de seed (no por un usuario autenticado vía la app).
--
-- Esto causa que concept_lines_select_own nunca sea verdadero para esos
-- registros (c.user_id = auth.uid() falla cuando user_id es NULL).
--
-- Para conceptos futuros creados desde la UI (con user autenticado),
-- la política _own sí funcionará correctamente.
--
-- Si en el futuro se quiere restringir concept_lines a solo el dueño del
-- concepto (y se migran los conceptos seed a un user_id real), se puede
-- eliminar esta política public_read sin afectar la lógica de ownership.
-- =============================================================================
