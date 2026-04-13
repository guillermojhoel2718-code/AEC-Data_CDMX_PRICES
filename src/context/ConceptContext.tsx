import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ─── Frontend-facing types (camelCase) ────────────────────────────────────────
// NOTE: These intentionally differ from the DB column names (snake_case).
// The mapping happens in mapDbConcept / mapDbLine below.

export interface MaterialRow {
  id: string;
  code: string;
  description: string;
  unit: string;
  costLab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fcActual: number;
}

export interface LaborRow {
  id: string;
  description: string;
  baseSalary: number;
  fsi: number;
  fasar: number;
  quantity: number;
}

export interface EquipmentRow {
  id: string;
  description: string;
  costLab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fcActual: number;
}

export interface SubcontractRow {
  id: string;
  description: string;
  unit: string;
  costLab: number;
  fletes: number;
  maniobra: number;
}

export interface OvercostFactors {
  indirectoHonorarios: number;
  indirectoDepreciacion: number;
  indirectoServicios: number;
  indirectoGastosOficina: number;
  indirectoFletes: number;
  indirectoCapacitacion: number;
  indirectoSeguridad: number;
  indirectoAuxiliares: number;
  financiamiento: number;
  utilidad: number;
  cargosAdicionales: number;
  imss: number;
  seguros: number;
}

export interface Concept {
  id: string;
  name: string;
  price: string;
  unit: string;
  region: string;
  status: 'verified' | 'pending';
  type: string;
  overhead: string;
  materials?: MaterialRow[];
  labor?: LaborRow[];
  equipment?: EquipmentRow[];
  subcontracts?: SubcontractRow[];
  overcostFactors?: OvercostFactors;
}

interface ConceptContextType {
  concepts: Concept[];
  loading: boolean;
  error: string | null;
  addConcept: (concept: Concept) => Promise<void>;
  refreshConcepts: () => Promise<void>;
}

// ─── Mapper: concept_lines row → typed sub-row ────────────────────────────────
// concept_lines uses a discriminator column `tipo` ('material','mano_obra','equipo','subcontrato').
// Numeric columns arrive as strings from PostgREST; Number() coerces them safely.
const mapLine = (row: any) => {
  const base = {
    id: row.id as string,
    description: (row.descripcion ?? row.description ?? '') as string,
    costLab: Number(row.cost_lab ?? 0),
    fletes: Number(row.fletes ?? 0),
    maniobra: Number(row.maniobra ?? 0),
    almacenaje: Number(row.almacenaje ?? 0),
    fcActual: Number(row.fc_actual ?? 1),
  };

  switch (row.tipo) {
    case 'material':
      return {
        ...base,
        code: (row.insumo_codigo ?? '') as string,
        unit: (row.unidad ?? row.unit ?? 'pza') as string,
      } as MaterialRow;
    case 'mano_obra':
      return {
        id: base.id,
        description: base.description,
        // In concept_lines: cost_lab holds the base_salary equivalent
        baseSalary: base.costLab,
        fsi: Number(row.fsi ?? 1),
        fasar: Number(row.fasar ?? 1),
        quantity: Number(row.cantidad ?? row.quantity ?? 1),
      } as LaborRow;
    case 'equipo':
      return base as EquipmentRow;
    case 'subcontrato':
      return {
        id: base.id,
        description: base.description,
        unit: (row.unidad ?? row.unit ?? 'pza') as string,
        costLab: base.costLab,
        fletes: base.fletes,
        maniobra: base.maniobra,
      } as SubcontractRow;
    default:
      return null;
  }
};

// ─── Mapper: concept_materials row → MaterialRow ──────────────────────────────
const mapMaterial = (m: any): MaterialRow => ({
  id: m.id as string,
  code: (m.code ?? '') as string,
  description: (m.description ?? '') as string,
  unit: (m.unit ?? 'pza') as string,
  costLab: Number(m.cost_lab ?? 0),
  fletes: Number(m.fletes ?? 0),
  maniobra: Number(m.maniobra ?? 0),
  almacenaje: Number(m.almacenaje ?? 0),
  fcActual: Number(m.fc_actual ?? 1),
});

// ─── Mapper: concept_labor row → LaborRow ─────────────────────────────────────
const mapLabor = (l: any): LaborRow => ({
  id: l.id as string,
  description: (l.description ?? '') as string,
  baseSalary: Number(l.base_salary ?? 0),
  fsi: Number(l.fsi ?? 1),
  fasar: Number(l.fasar ?? 1),
  quantity: Number(l.quantity ?? 1),
});

// ─── Mapper: concept_equipment row → EquipmentRow ────────────────────────────
const mapEquipment = (e: any): EquipmentRow => ({
  id: e.id as string,
  description: (e.description ?? '') as string,
  costLab: Number(e.cost_lab ?? 0),
  fletes: Number(e.fletes ?? 0),
  maniobra: Number(e.maniobra ?? 0),
  almacenaje: Number(e.almacenaje ?? 0),
  fcActual: Number(e.fc_actual ?? 1),
});

// ─── Mapper: concept_subcontracts row → SubcontractRow ───────────────────────
const mapSubcontract = (s: any): SubcontractRow => ({
  id: s.id as string,
  description: (s.description ?? '') as string,
  unit: (s.unit ?? 'pza') as string,
  costLab: Number(s.cost_lab ?? 0),
  fletes: Number(s.fletes ?? 0),
  maniobra: Number(s.maniobra ?? 0),
});

// ─── Mapper: concept_overcost row → OvercostFactors ──────────────────────────
const mapOvercost = (oc: any): OvercostFactors => ({
  indirectoHonorarios: Number(oc.indirecto_honorarios ?? 0),
  indirectoDepreciacion: Number(oc.indirecto_depreciacion ?? 0),
  indirectoServicios: Number(oc.indirecto_servicios ?? 0),
  indirectoGastosOficina: Number(oc.indirecto_gastos_oficina ?? 0),
  indirectoFletes: Number(oc.indirecto_fletes ?? 0),
  indirectoCapacitacion: Number(oc.indirecto_capacitacion ?? 0),
  indirectoSeguridad: Number(oc.indirecto_seguridad ?? 0),
  indirectoAuxiliares: Number(oc.indirecto_auxiliares ?? 0),
  financiamiento: Number(oc.financiamiento ?? 0),
  utilidad: Number(oc.utilidad ?? 0),
  cargosAdicionales: Number(oc.cargos_adicionales ?? 0),
  imss: Number(oc.imss ?? 0),
  seguros: Number(oc.seguros ?? 0),
});

// ─── Main mapper: concept row + sub-tables → Concept ─────────────────────────
// AUDIT FIX: price in DB is stored as TEXT (legacy) and as NUMERIC (new rows).
// Some rows have $ prefix ("$2,450.00"), others are raw numbers ("540.00").
// We normalize to a display string with $ prefix here so the UI is consistent.
const normalizePrice = (raw: string | number | null | undefined): string => {
  if (raw == null) return '$0.00';
  const str = String(raw).replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return String(raw); // passthrough if unparseable
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const mapDbConcept = (
  row: any,
  materials: any[],
  labor: any[],
  equipment: any[],
  subcontracts: any[],
  lines: any[],
  overcost: any | null,
): Concept => {
  // Merge concept_lines into typed arrays (preferred if present, fallback to dedicated tables)
  const linesMaterials = lines.filter(l => l.tipo === 'material').map(mapLine) as MaterialRow[];
  const linesLabor = lines.filter(l => l.tipo === 'mano_obra').map(mapLine) as LaborRow[];
  const linesEquipment = lines.filter(l => l.tipo === 'equipo').map(mapLine) as EquipmentRow[];
  const linesSubcontracts = lines.filter(l => l.tipo === 'subcontrato').map(mapLine) as SubcontractRow[];

  return {
    id: row.id,
    name: row.name,
    price: normalizePrice(row.price),
    unit: (row.unit ?? 'pza') as string,
    region: row.region,
    // AUDIT FIX: DB has 'rejected' as valid status but Concept type only allows 'verified'|'pending'.
    // Map 'rejected' → 'pending' for display safety.
    status: row.status === 'verified' ? 'verified' : 'pending',
    type: row.type ?? '',
    overhead: row.overhead ?? '1.2450',
    // Prefer dedicated tables (more data); fallback to concept_lines if dedicated tables are empty
    materials: materials.length > 0 ? materials.map(mapMaterial) : linesMaterials,
    labor: labor.length > 0 ? labor.map(mapLabor) : linesLabor,
    equipment: equipment.length > 0 ? equipment.map(mapEquipment) : linesEquipment,
    subcontracts: subcontracts.length > 0 ? subcontracts.map(mapSubcontract) : linesSubcontracts,
    overcostFactors: overcost ? mapOvercost(overcost) : undefined,
  };
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ConceptContext = createContext<ConceptContextType | undefined>(undefined);

export const ConceptProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcepts = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Load all concepts (public read policy — no auth required)
      const { data: rawConcepts, error: conceptsErr } = await supabase
        .from('concepts')
        .select('*')
        .order('id', { ascending: true });

      if (conceptsErr) throw conceptsErr;
      if (!rawConcepts || rawConcepts.length === 0) {
        setConcepts([]);
        return;
      }

      const ids = rawConcepts.map((c: any) => c.id);

      // 2) Load all related rows in parallel
      const [matRes, labRes, eqRes, subRes, linesRes, overcostRes] = await Promise.all([
        supabase.from('concept_materials').select('*').in('concept_id', ids).order('sort_order'),
        supabase.from('concept_labor').select('*').in('concept_id', ids).order('sort_order'),
        supabase.from('concept_equipment').select('*').in('concept_id', ids).order('sort_order'),
        supabase.from('concept_subcontracts').select('*').in('concept_id', ids).order('sort_order'),
        supabase.from('concept_lines').select('*').in('concept_id', ids).order('sort_order'),
        supabase.from('concept_overcost').select('*').in('concept_id', ids),
      ]);

      // Log any sub-table errors but don't abort — render with partial data
      if (matRes.error) console.warn('[APUCMX] concept_materials error:', matRes.error.message);
      if (labRes.error) console.warn('[APUCMX] concept_labor error:', labRes.error.message);
      if (eqRes.error) console.warn('[APUCMX] concept_equipment error:', eqRes.error.message);
      if (subRes.error) console.warn('[APUCMX] concept_subcontracts error:', subRes.error.message);
      if (linesRes.error) console.warn('[APUCMX] concept_lines error:', linesRes.error.message);
      if (overcostRes.error) console.warn('[APUCMX] concept_overcost error:', overcostRes.error.message);

      const materials = matRes.data ?? [];
      const labor = labRes.data ?? [];
      const equipment = eqRes.data ?? [];
      const subcontracts = subRes.data ?? [];
      const lines = linesRes.data ?? [];
      const overcosts = overcostRes.data ?? [];

      // 3) Join in-memory (avoids N+1 and works with RLS public-read policies)
      const mapped: Concept[] = rawConcepts.map((row: any) => {
        const cid = row.id;
        return mapDbConcept(
          row,
          materials.filter((m: any) => m.concept_id === cid),
          labor.filter((l: any) => l.concept_id === cid),
          equipment.filter((e: any) => e.concept_id === cid),
          subcontracts.filter((s: any) => s.concept_id === cid),
          lines.filter((l: any) => l.concept_id === cid),
          overcosts.find((oc: any) => oc.concept_id === cid) ?? null,
        );
      });

      setConcepts(mapped);
    } catch (err: any) {
      console.error('[APUCMX] Error fetching concepts:', err);
      setError(err.message || 'Error loading concepts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcepts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addConcept = async (concept: Concept) => {
    try {
      const { error: conceptError } = await supabase.from('concepts').insert({
        id: concept.id,
        name: concept.name,
        price: concept.price,
        unit: concept.unit,
        region: concept.region,
        status: concept.status,
        type: concept.type,
        overhead: concept.overhead,
        user_id: user?.id || null,
      });
      if (conceptError) throw conceptError;

      if (concept.materials && concept.materials.length > 0) {
        const { error: matErr } = await supabase.from('concept_materials').insert(
          concept.materials.map((m, idx) => ({
            concept_id: concept.id,
            code: m.code,
            description: m.description,
            unit: m.unit,
            cost_lab: m.costLab,
            fletes: m.fletes,
            maniobra: m.maniobra,
            almacenaje: m.almacenaje,
            fc_actual: m.fcActual,
            sort_order: idx,
          }))
        );
        if (matErr) console.error('[APUCMX] Materials insert error:', matErr);
      }

      if (concept.labor && concept.labor.length > 0) {
        const { error: labErr } = await supabase.from('concept_labor').insert(
          concept.labor.map((l, idx) => ({
            concept_id: concept.id,
            description: l.description,
            base_salary: l.baseSalary,
            fsi: l.fsi,
            fasar: l.fasar,
            quantity: l.quantity,
            sort_order: idx,
          }))
        );
        if (labErr) console.error('[APUCMX] Labor insert error:', labErr);
      }

      if (concept.equipment && concept.equipment.length > 0) {
        const { error: eqErr } = await supabase.from('concept_equipment').insert(
          concept.equipment.map((e, idx) => ({
            concept_id: concept.id,
            description: e.description,
            cost_lab: e.costLab,
            fletes: e.fletes,
            maniobra: e.maniobra,
            almacenaje: e.almacenaje,
            fc_actual: e.fcActual,
            sort_order: idx,
          }))
        );
        if (eqErr) console.error('[APUCMX] Equipment insert error:', eqErr);
      }

      if (concept.subcontracts && concept.subcontracts.length > 0) {
        const { error: subErr } = await supabase.from('concept_subcontracts').insert(
          concept.subcontracts.map((s, idx) => ({
            concept_id: concept.id,
            description: s.description,
            unit: s.unit,
            cost_lab: s.costLab,
            fletes: s.fletes,
            maniobra: s.maniobra,
            sort_order: idx,
          }))
        );
        if (subErr) console.error('[APUCMX] Subcontracts insert error:', subErr);
      }

      if (concept.overcostFactors) {
        const oc = concept.overcostFactors;
        const { error: ocErr } = await supabase.from('concept_overcost').insert({
          concept_id: concept.id,
          indirecto_honorarios: oc.indirectoHonorarios,
          indirecto_depreciacion: oc.indirectoDepreciacion,
          indirecto_servicios: oc.indirectoServicios,
          indirecto_gastos_oficina: oc.indirectoGastosOficina,
          indirecto_fletes: oc.indirectoFletes,
          indirecto_capacitacion: oc.indirectoCapacitacion,
          indirecto_seguridad: oc.indirectoSeguridad,
          indirecto_auxiliares: oc.indirectoAuxiliares,
          financiamiento: oc.financiamiento,
          utilidad: oc.utilidad,
          cargos_adicionales: oc.cargosAdicionales,
          imss: oc.imss,
          seguros: oc.seguros,
        });
        if (ocErr) console.error('[APUCMX] Overcost insert error:', ocErr);
      }

      setConcepts(prev => [concept, ...prev]);
    } catch (err: any) {
      console.error('[APUCMX] Error adding concept:', err);
      throw err;
    }
  };

  return (
    <ConceptContext.Provider value={{ concepts, loading, error, addConcept, refreshConcepts: fetchConcepts }}>
      {children}
    </ConceptContext.Provider>
  );
};

export const useConcepts = () => {
  const context = useContext(ConceptContext);
  if (!context) {
    throw new Error('useConcepts must be used within a ConceptProvider');
  }
  return context;
};
