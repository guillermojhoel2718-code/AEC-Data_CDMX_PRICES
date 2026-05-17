-- =============================================================================
-- APUCMX — Schema Supabase v1.1
-- Proyecto: Centro de Datos de Precios Unitarios CDMX (APUCMX)
-- Autor: Guillermo Jhoel (IPN ESIA Tecamachalco)
-- Fecha: 2026-04
-- Descripción: Define las 5 tablas principales con RLS básico.
--              Copia este bloque completo en el Editor SQL de Supabase
--              y ejecútalo una sola vez.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONES REQUERIDAS
-- ---------------------------------------------------------------------------
-- uuid-ossp ya viene activo en Supabase por defecto; se incluye por seguridad.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- 1) apuc_insumos
--    Catálogo maestro de insumos AEC. Lectura pública (anon).
--    Escritura solo mediante service_role (script de carga).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.apuc_insumos (
    -- Identificación
    codigo          TEXT        PRIMARY KEY,              -- hash SHA-8 del nombre normalizado (PK)
    descripcion     TEXT        NOT NULL,
    unidad          TEXT        NOT NULL,
    precio_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,

    -- Clasificación
    categoria       TEXT,
    subcategoria    TEXT,
    tipo_registro   TEXT        NOT NULL
                    CHECK (tipo_registro IN ('material','mano_obra','equipo','indirecto')),

    -- Trazabilidad de fuente
    fuente          TEXT        DEFAULT 'Insumos_APUCMX',
    fecha_fuente    DATE,

    -- Control de calidad
    nivel_confianza SMALLINT    DEFAULT 3
                    CHECK (nivel_confianza BETWEEN 1 AND 5),
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Integridad / Blockchain (campos preparatorios, pueden ser NULL)
    hash_sha256     TEXT,
    tx_hash         TEXT,
    firmado_por     TEXT,
    fecha_firma     TIMESTAMPTZ
);

-- Índice de búsqueda de texto completo en español
CREATE INDEX IF NOT EXISTS idx_apuc_fts
    ON public.apuc_insumos
    USING GIN (to_tsvector('spanish', descripcion));

-- Índice por categoría (filtrado frecuente)
CREATE INDEX IF NOT EXISTS idx_apuc_categoria
    ON public.apuc_insumos (categoria);

-- Índice por tipo de registro (filtrado frecuente)
CREATE INDEX IF NOT EXISTS idx_apuc_tipo_registro
    ON public.apuc_insumos (tipo_registro);


-- =============================================================================
-- 2) profiles
--    Datos de usuario extendidos, vinculados a Supabase Auth (auth.users).
--    Cada usuario solo puede ver / modificar su propio perfil.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Clave primaria == UUID de auth.users
    id                  UUID        PRIMARY KEY
                        REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Datos básicos
    email               TEXT        UNIQUE,
    full_name           TEXT,
    occupation          TEXT,                            -- "Arquitecto", "Ing. Civil", etc.
    empresa             TEXT,

    -- Región operativa (para filtros geográficos del catálogo)
    region              TEXT        DEFAULT 'CDMX'
                        CHECK (region IN ('CDMX','Norte','Bajio','Occidente','Sur')),

    -- Plan / membresía
    account_type        TEXT        DEFAULT 'free',
    membership          TEXT        DEFAULT 'gratis'
                        CHECK (membership IN ('gratis','mensual','anual','creador')),

    -- Sistema de reputación / créditos APUCMX
    apuc_credits        INTEGER     NOT NULL DEFAULT 0,
    cedia_reputation    INTEGER     NOT NULL DEFAULT 0,

    -- Blockchain (preparatorio)
    blockchain_address  TEXT,
    node_hash           TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================================
-- 3) concepts
--    Conceptos de obra (Análisis de Precios Unitarios).
--    Compatible con ConceptRow en src/lib/supabase.ts.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.concepts (
    id                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id                 UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Identificación del concepto
    name                    TEXT        NOT NULL,
    description             TEXT,
    region                  TEXT        NOT NULL DEFAULT 'CDMX'
                            CHECK (region IN ('CDMX','Norte','Bajio','Occidente','Sur')),
    unit                    TEXT        NOT NULL DEFAULT 'PZA',

    -- Precio calculado y tipo
    price                   NUMERIC(14,4) NOT NULL DEFAULT 0,
    type                    TEXT        DEFAULT 'obra_civil',

    -- Sobrecostos / overhead (porcentaje como texto para compatibilidad con frontend)
    overhead                TEXT        DEFAULT '0',

    -- Estado en el flujo CEDIA
    status                  TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('verified','pending','rejected')),

    -- Métricas de comunidad
    cedia_score             INTEGER     NOT NULL DEFAULT 0,
    adoption_count          INTEGER     NOT NULL DEFAULT 0,
    apuc_credits_earned     INTEGER     NOT NULL DEFAULT 0,
    cedia_feedback          TEXT,

    -- Blockchain (preparatorio)
    blockchain_hash         TEXT,
    blockchain_tx           TEXT,
    blockchain_timestamp    TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice por propietario (consultas frecuentes "mis conceptos")
CREATE INDEX IF NOT EXISTS idx_concepts_user_id
    ON public.concepts (user_id);

-- Índice por estado (dashboards de moderación)
CREATE INDEX IF NOT EXISTS idx_concepts_status
    ON public.concepts (status);


-- =============================================================================
-- 4) concept_lines
--    Líneas de detalle de cada APU: materiales, mano de obra, equipo,
--    subcontratos. Compatible con MaterialRow / LaborRow / EquipmentRow
--    / SubcontractRow de supabase.ts, unificado en una sola tabla.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.concept_lines (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id      TEXT        NOT NULL
                    REFERENCES public.concepts(id) ON DELETE CASCADE,

    -- Referencia opcional al catálogo maestro
    insumo_codigo   TEXT
                    REFERENCES public.apuc_insumos(codigo) ON DELETE SET NULL,

    -- Clasificación de la línea
    tipo            TEXT        NOT NULL
                    CHECK (tipo IN ('material','mano_obra','equipo','subcontrato')),

    -- Descripción libre (para líneas sin insumo_codigo)
    descripcion     TEXT        NOT NULL,
    unidad          TEXT        NOT NULL DEFAULT 'PZA',
    cantidad        NUMERIC(14,6) NOT NULL DEFAULT 1,

    -- Componentes de costo (pueden ser NULL según el tipo de línea)
    cost_lab        NUMERIC(14,4) DEFAULT 0,   -- Costo puesto en obra / salario base
    fletes          NUMERIC(14,4) DEFAULT 0,
    maniobra        NUMERIC(14,4) DEFAULT 0,
    almacenaje      NUMERIC(14,4) DEFAULT 0,

    -- Factores de actualización / ajuste
    fc_actual       NUMERIC(8,6)  DEFAULT 1.0, -- Factor de actualización de costos
    fsi             NUMERIC(8,6)  DEFAULT 1.0, -- Factor de salario indirecto (mano de obra)
    fasar           NUMERIC(8,6)  DEFAULT 1.0, -- FASAR (factor de actualización)

    -- Ordenamiento visual
    sort_order      SMALLINT    NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice compuesto principal (todas las líneas de un concepto por tipo)
CREATE INDEX IF NOT EXISTS idx_concept_lines_concept_tipo
    ON public.concept_lines (concept_id, tipo);

-- Índice para búsqueda inversa: ¿en qué conceptos se usa un insumo?
CREATE INDEX IF NOT EXISTS idx_concept_lines_insumo
    ON public.concept_lines (insumo_codigo)
    WHERE insumo_codigo IS NOT NULL;


-- =============================================================================
-- 5) concept_overcost
--    Sobrecostos (indirectos, utilidad, financiamiento, etc.) de un APU.
--    Relación uno-a-uno con concepts.
--    Compatible con OvercostRow de supabase.ts.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.concept_overcost (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id                  TEXT        UNIQUE NOT NULL
                                REFERENCES public.concepts(id) ON DELETE CASCADE,

    -- Indirectos (desglosados)
    indirecto_honorarios        NUMERIC(14,4) DEFAULT 0,
    indirecto_depreciacion      NUMERIC(14,4) DEFAULT 0,
    indirecto_servicios         NUMERIC(14,4) DEFAULT 0,
    indirecto_gastos_oficina    NUMERIC(14,4) DEFAULT 0,
    indirecto_fletes            NUMERIC(14,4) DEFAULT 0,
    indirecto_capacitacion      NUMERIC(14,4) DEFAULT 0,
    indirecto_seguridad         NUMERIC(14,4) DEFAULT 0,
    indirecto_auxiliares        NUMERIC(14,4) DEFAULT 0,

    -- Otros cargos sobre costo directo
    financiamiento              NUMERIC(14,4) DEFAULT 0,
    utilidad                    NUMERIC(14,4) DEFAULT 0,
    cargos_adicionales          NUMERIC(14,4) DEFAULT 0,

    -- Cargas laborales
    imss                        NUMERIC(14,4) DEFAULT 0,
    seguros                     NUMERIC(14,4) DEFAULT 0,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- --- apuc_insumos: lectura pública, sin escritura desde el cliente ---
ALTER TABLE public.apuc_insumos ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario (incluido anon) puede leer
CREATE POLICY "apuc_insumos_select_public"
    ON public.apuc_insumos
    FOR SELECT
    USING (true);

-- Solo service_role puede insertar / actualizar / eliminar
-- (no se crean políticas INSERT/UPDATE/DELETE → solo service_role accede)


-- --- profiles: solo el propio usuario ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);


-- --- concepts: solo el propietario ---
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concepts_select_own"
    ON public.concepts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "concepts_insert_own"
    ON public.concepts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "concepts_update_own"
    ON public.concepts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "concepts_delete_own"
    ON public.concepts
    FOR DELETE
    USING (auth.uid() = user_id);


-- --- concept_lines: hereda permisos a través de concepts ---
ALTER TABLE public.concept_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concept_lines_select_own"
    ON public.concept_lines
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_lines_insert_own"
    ON public.concept_lines
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_lines_update_own"
    ON public.concept_lines
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_lines_delete_own"
    ON public.concept_lines
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );


-- --- concept_overcost: hereda permisos a través de concepts ---
ALTER TABLE public.concept_overcost ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concept_overcost_select_own"
    ON public.concept_overcost
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_overcost_insert_own"
    ON public.concept_overcost
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_overcost_update_own"
    ON public.concept_overcost
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "concept_overcost_delete_own"
    ON public.concept_overcost
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.concepts c
            WHERE c.id = concept_id
              AND c.user_id = auth.uid()
        )
    );


-- =============================================================================
-- FIN DEL SCHEMA
-- =============================================================================
