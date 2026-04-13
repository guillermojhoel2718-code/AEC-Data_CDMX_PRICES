import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

// Helper to map DB rows to frontend format
const mapDbConcept = (row: any, materials: any[], labor: any[], equipment: any[], subcontracts: any[], overcost: any | null): Concept => ({
  id: row.id,
  name: row.name,
  price: row.price,
  unit: row.unit,
  region: row.region,
  status: row.status,
  type: row.type,
  overhead: row.overhead,
  materials: materials.map(m => ({
    id: m.id,
    code: m.code,
    description: m.description,
    unit: m.unit,
    costLab: Number(m.cost_lab),
    fletes: Number(m.fletes),
    maniobra: Number(m.maniobra),
    almacenaje: Number(m.almacenaje),
    fcActual: Number(m.fc_actual),
  })),
  labor: labor.map(l => ({
    id: l.id,
    description: l.description,
    baseSalary: Number(l.base_salary),
    fsi: Number(l.fsi),
    fasar: Number(l.fasar),
    quantity: Number(l.quantity),
  })),
  equipment: equipment.map(e => ({
    id: e.id,
    description: e.description,
    costLab: Number(e.cost_lab),
    fletes: Number(e.fletes),
    maniobra: Number(e.maniobra),
    almacenaje: Number(e.almacenaje),
    fcActual: Number(e.fc_actual),
  })),
  subcontracts: subcontracts.map(s => ({
    id: s.id,
    description: s.description,
    unit: s.unit,
    costLab: Number(s.cost_lab),
    fletes: Number(s.fletes),
    maniobra: Number(s.maniobra),
  })),
  overcostFactors: overcost ? {
    indirectoHonorarios: Number(overcost.indirecto_honorarios),
    indirectoDepreciacion: Number(overcost.indirecto_depreciacion),
    indirectoServicios: Number(overcost.indirecto_servicios),
    indirectoGastosOficina: Number(overcost.indirecto_gastos_oficina),
    indirectoFletes: Number(overcost.indirecto_fletes),
    indirectoCapacitacion: Number(overcost.indirecto_capacitacion),
    indirectoSeguridad: Number(overcost.indirecto_seguridad),
    indirectoAuxiliares: Number(overcost.indirecto_auxiliares),
    financiamiento: Number(overcost.financiamiento),
    utilidad: Number(overcost.utilidad),
    cargosAdicionales: Number(overcost.cargos_adicionales),
    imss: Number(overcost.imss),
    seguros: Number(overcost.seguros),
  } : undefined,
});

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
      // Temporarily using mock data instead of Supabase as per user request
      const { MOCK_CONCEPTS } = await import('../lib/mockData');
      setConcepts(MOCK_CONCEPTS);
    } catch (err: any) {
      console.error('Error fetching concepts:', err);
      setError(err.message || 'Error loading concepts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcepts();
  }, []);

  const addConcept = async (concept: Concept) => {
    try {
      // Insert the concept
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

      // Insert materials
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
        if (matErr) console.error('Materials insert error:', matErr);
      }

      // Insert labor
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
        if (labErr) console.error('Labor insert error:', labErr);
      }

      // Insert equipment
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
        if (eqErr) console.error('Equipment insert error:', eqErr);
      }

      // Insert subcontracts
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
        if (subErr) console.error('Subcontracts insert error:', subErr);
      }

      // Insert overcost
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
        if (ocErr) console.error('Overcost insert error:', ocErr);
      }

      // Add to local state for immediate feedback
      setConcepts(prev => [concept, ...prev]);
    } catch (err: any) {
      console.error('Error adding concept:', err);
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
