import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/context/AuthContext';

// ---------------------------------------------------------------------------
// Tipos — basados en tabla unificada concept_lines
// ---------------------------------------------------------------------------
export interface ConceptLine {
  id: string;
  concept_id: string;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'subcontrato' | 'basico';
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
  cost_lab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fc_actual: number;
  fsi: number;
  fasar: number;
  nota: string | null;
  sort_order: number;
  insumo_codigo?: string | null;
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
  description?: string;
  price: number;
  unit: string;
  region: string;
  status: 'verified' | 'pending' | 'rejected';
  type: string;
  overhead: string;
  cedia_score: number;
  cedia_feedback?: string | null;
  created_at?: string;
  // Líneas agrupadas por tipo
  materials: ConceptLine[];
  labor: ConceptLine[];
  equipment: ConceptLine[];
  subcontracts: ConceptLine[];
  basics: ConceptLine[];
  overcostFactors?: OvercostFactors;
}

interface ConceptContextType {
  concepts: Concept[];
  loading: boolean;
  error: string | null;
  addConcept: (concept: Omit<Concept, 'id' | 'created_at'>) => Promise<string | null>;
  refreshConcepts: () => Promise<void>;
  searchConcepts: (query: string) => Concept[];
}

// ---------------------------------------------------------------------------
// Mapper: fila DB → Concept tipado
// ---------------------------------------------------------------------------
function mapDbRowToConcept(row: any): Concept {
  const lines: ConceptLine[] = (row.concept_lines ?? []).map((l: any) => ({
    id:             l.id,
    concept_id:     l.concept_id,
    tipo:           l.tipo,
    descripcion:    l.descripcion,
    unidad:         l.unidad,
    cantidad:       Number(l.cantidad ?? 0),
    precio_unitario:Number(l.precio_unitario ?? 0),
    importe:        Number(l.importe ?? 0),
    cost_lab:       Number(l.cost_lab ?? 0),
    fletes:         Number(l.fletes ?? 0),
    maniobra:       Number(l.maniobra ?? 0),
    almacenaje:     Number(l.almacenaje ?? 0),
    fc_actual:      Number(l.fc_actual ?? 1),
    fsi:            Number(l.fsi ?? 1),
    fasar:          Number(l.fasar ?? 1),
    nota:           l.nota ?? null,
    sort_order:     l.sort_order ?? 0,
    insumo_codigo:  l.insumo_codigo ?? null,
  }));

  const overcostRaw = row.concept_overcost?.[0];
  const overcostFactors: OvercostFactors | undefined = overcostRaw ? {
    indirectoHonorarios:    Number(overcostRaw.indirecto_honorarios ?? 0),
    indirectoDepreciacion:  Number(overcostRaw.indirecto_depreciacion ?? 0),
    indirectoServicios:     Number(overcostRaw.indirecto_servicios ?? 0),
    indirectoGastosOficina: Number(overcostRaw.indirecto_gastos_oficina ?? 0),
    indirectoFletes:        Number(overcostRaw.indirecto_fletes ?? 0),
    indirectoCapacitacion:  Number(overcostRaw.indirecto_capacitacion ?? 0),
    indirectoSeguridad:     Number(overcostRaw.indirecto_seguridad ?? 0),
    indirectoAuxiliares:    Number(overcostRaw.indirecto_auxiliares ?? 0),
    financiamiento:         Number(overcostRaw.financiamiento ?? 0),
    utilidad:               Number(overcostRaw.utilidad ?? 0),
    cargosAdicionales:      Number(overcostRaw.cargos_adicionales ?? 0),
    imss:                   Number(overcostRaw.imss ?? 0),
    seguros:                Number(overcostRaw.seguros ?? 0),
  } : undefined;

  return {
    id:           row.id,
    name:         row.name,
    description:  row.description ?? '',
    price:        Number(row.price ?? 0),
    unit:         row.unit ?? 'pza',
    region:       row.region ?? 'CDMX',
    status:       row.status ?? 'pending',
    type:         row.type ?? 'obra_civil',
    overhead:     row.overhead ?? '0',
    cedia_score:  row.cedia_score ?? 0,
    cedia_feedback: row.cedia_feedback ?? null,
    created_at:   row.created_at,
    materials:    lines.filter(l => l.tipo === 'material').sort((a,b) => a.sort_order - b.sort_order),
    labor:        lines.filter(l => l.tipo === 'mano_obra').sort((a,b) => a.sort_order - b.sort_order),
    equipment:    lines.filter(l => l.tipo === 'equipo').sort((a,b) => a.sort_order - b.sort_order),
    subcontracts: lines.filter(l => l.tipo === 'subcontrato').sort((a,b) => a.sort_order - b.sort_order),
    basics:       lines.filter(l => l.tipo === 'basico').sort((a,b) => a.sort_order - b.sort_order),
    overcostFactors,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ConceptContext = createContext<ConceptContextType | undefined>(undefined);

export const ConceptProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch: trae verified + los propios del usuario autenticado
  // -----------------------------------------------------------------------
  const fetchConcepts = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('concepts')
        .select(`
          *,
          concept_lines (
            id, tipo, descripcion, unidad, cantidad,
            precio_unitario, importe, cost_lab, fletes, maniobra,
            almacenaje, fc_actual, fsi, fasar, nota, sort_order, insumo_codigo
          ),
          concept_overcost (*)
        `)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setConcepts((data ?? []).map(mapDbRowToConcept));
    } catch (err: any) {
      const msg = err?.message ?? 'Error al cargar los conceptos';
      setError(msg);
      console.error('[ConceptContext] fetchConcepts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConcepts(); }, []);

  // -----------------------------------------------------------------------
  // Búsqueda local (Fuse.js ya está en deps)
  // -----------------------------------------------------------------------
  const searchConcepts = (query: string): Concept[] => {
    if (!query.trim()) return concepts;
    const q = query.toLowerCase();
    return concepts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.unit.toLowerCase().includes(q)
    );
  };

  // -----------------------------------------------------------------------
  // Insertar concepto nuevo (usuario autenticado)
  // -----------------------------------------------------------------------
  const addConcept = async (concept: Omit<Concept, 'id' | 'created_at'>): Promise<string | null> => {
    if (!user) return 'Debes iniciar sesión para agregar conceptos';

    const conceptId = crypto.randomUUID();

    try {
      // 1) Insertar concepto
      const { error: cErr } = await supabase.from('concepts').insert({
        id:       conceptId,
        user_id:  user.id,
        name:     concept.name,
        description: concept.description ?? concept.name,
        region:   concept.region,
        unit:     concept.unit,
        price:    concept.price,
        type:     concept.type,
        overhead: concept.overhead,
        status:   'pending',
      });
      if (cErr) throw cErr;

      // 2) Unificar todas las líneas en concept_lines con su tipo
      const allLines = [
        ...(concept.materials   ?? []).map((l, i) => ({ ...l, tipo: 'material'    as const, sort_order: i })),
        ...(concept.labor       ?? []).map((l, i) => ({ ...l, tipo: 'mano_obra'   as const, sort_order: i })),
        ...(concept.equipment   ?? []).map((l, i) => ({ ...l, tipo: 'equipo'      as const, sort_order: i })),
        ...(concept.subcontracts?? []).map((l, i) => ({ ...l, tipo: 'subcontrato' as const, sort_order: i })),
        ...(concept.basics      ?? []).map((l, i) => ({ ...l, tipo: 'basico'      as const, sort_order: i })),
      ];

      if (allLines.length > 0) {
        const lineRows = allLines.map(l => ({
          concept_id:     conceptId,
          tipo:           l.tipo,
          descripcion:    l.descripcion,
          unidad:         l.unidad,
          cantidad:       l.cantidad,
          precio_unitario:l.precio_unitario,
          importe:        l.importe,
          cost_lab:       l.cost_lab,
          fletes:         l.fletes,
          maniobra:       l.maniobra,
          almacenaje:     l.almacenaje,
          fc_actual:      l.fc_actual,
          fsi:            l.fsi,
          fasar:          l.fasar,
          nota:           l.nota ?? null,
          sort_order:     l.sort_order,
        }));

        const { error: lErr } = await supabase.from('concept_lines').insert(lineRows);
        if (lErr) console.error('[ConceptContext] concept_lines insert:', lErr);
      }

      // 3) Insertar sobrecostos si existen
      if (concept.overcostFactors) {
        const oc = concept.overcostFactors;
        await supabase.from('concept_overcost').insert({
          concept_id:                 conceptId,
          indirecto_honorarios:       oc.indirectoHonorarios,
          indirecto_depreciacion:     oc.indirectoDepreciacion,
          indirecto_servicios:        oc.indirectoServicios,
          indirecto_gastos_oficina:   oc.indirectoGastosOficina,
          indirecto_fletes:           oc.indirectoFletes,
          indirecto_capacitacion:     oc.indirectoCapacitacion,
          indirecto_seguridad:        oc.indirectoSeguridad,
          indirecto_auxiliares:       oc.indirectoAuxiliares,
          financiamiento:             oc.financiamiento,
          utilidad:                   oc.utilidad,
          cargos_adicionales:         oc.cargosAdicionales,
          imss:                       oc.imss,
          seguros:                    oc.seguros,
        });
      }

      // 4) Actualizar estado local inmediatamente
      await fetchConcepts();
      return null;
    } catch (err: any) {
      console.error('[ConceptContext] addConcept:', err);
      return err?.message ?? 'Error al guardar el concepto';
    }
  };

  return (
    <ConceptContext.Provider value={{ concepts, loading, error, addConcept, refreshConcepts: fetchConcepts, searchConcepts }}>
      {children}
    </ConceptContext.Provider>
  );
};

export const useConcepts = () => {
  const ctx = useContext(ConceptContext);
  if (!ctx) throw new Error('useConcepts debe usarse dentro de ConceptProvider');
  return ctx;
};
