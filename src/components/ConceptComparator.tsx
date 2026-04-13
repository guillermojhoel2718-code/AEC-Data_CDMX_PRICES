import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Award } from 'lucide-react';
import { AppHeader } from './Common';
import { motion } from 'motion/react';
import { useConcepts, Concept, MaterialRow, LaborRow, EquipmentRow, OvercostFactors } from '../context/ConceptContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePriceToNumber(price: string): number {
  return parseFloat(price.replace(/[$,]/g, '')) || 0;
}

function calcMaterialsSubtotal(materials?: MaterialRow[]): number {
  if (!materials || materials.length === 0) return 0;
  return materials.reduce((acc, m) => acc + (m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual, 0);
}

function calcLaborSubtotal(labor?: LaborRow[]): number {
  if (!labor || labor.length === 0) return 0;
  return labor.reduce((acc, l) => acc + l.baseSalary * l.fsi * l.fasar * l.quantity, 0);
}

function calcEquipmentSubtotal(equipment?: EquipmentRow[]): number {
  if (!equipment || equipment.length === 0) return 0;
  return equipment.reduce((acc, e) => acc + (e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual, 0);
}

function calcDirectCost(concept: Concept): number {
  const mat = calcMaterialsSubtotal(concept.materials);
  const lab = calcLaborSubtotal(concept.labor);
  const equ = calcEquipmentSubtotal(concept.equipment);
  const total = mat + lab + equ;
  if (total === 0) return parsePriceToNumber(concept.price);
  return total;
}

function calcOvercostTotal(overcostFactors: OvercostFactors | undefined, directCost: number): number {
  if (!overcostFactors) return 0;
  const totalPct =
    overcostFactors.indirectoHonorarios +
    overcostFactors.indirectoDepreciacion +
    overcostFactors.indirectoServicios +
    overcostFactors.indirectoGastosOficina +
    overcostFactors.indirectoFletes +
    overcostFactors.indirectoCapacitacion +
    overcostFactors.indirectoSeguridad +
    overcostFactors.indirectoAuxiliares +
    overcostFactors.financiamiento +
    overcostFactors.utilidad +
    overcostFactors.cargosAdicionales +
    overcostFactors.imss +
    overcostFactors.seguros;
  return directCost * (totalPct / 100);
}

function calcUnitPrice(concept: Concept): number {
  const directCost = calcDirectCost(concept);
  if (directCost === 0) return parsePriceToNumber(concept.price);
  if (concept.overcostFactors) {
    return directCost + calcOvercostTotal(concept.overcostFactors, directCost);
  }
  const overhead = parseFloat(concept.overhead);
  if (overhead && overhead > 0) {
    return directCost * overhead;
  }
  return directCost;
}

function formatMXN(n: number, isEmpty?: boolean): string {
  if (isEmpty) return '—';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
}

function sumIndirectos(o: OvercostFactors): number {
  return (
    o.indirectoHonorarios +
    o.indirectoDepreciacion +
    o.indirectoServicios +
    o.indirectoGastosOficina +
    o.indirectoFletes +
    o.indirectoCapacitacion +
    o.indirectoSeguridad +
    o.indirectoAuxiliares
  );
}

function hasBlock(arr?: unknown[]): boolean {
  return !!arr && arr.length > 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ConceptComparator = () => {
  const { concepts, loading } = useConcepts();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [showTable, setShowTable] = useState(false);

  const conceptA = useMemo(() => concepts.find(c => c.id === idA) ?? null, [concepts, idA]);
  const conceptB = useMemo(() => concepts.find(c => c.id === idB) ?? null, [concepts, idB]);

  const isSame = idA !== '' && idB !== '' && idA === idB;

  const handleCompare = () => {
    if (idA && idB && !isSame) setShowTable(true);
  };

  // Pre-compute values
  const vals = useMemo(() => {
    if (!conceptA || !conceptB) return null;
    const matA = calcMaterialsSubtotal(conceptA.materials);
    const matB = calcMaterialsSubtotal(conceptB.materials);
    const labA = calcLaborSubtotal(conceptA.labor);
    const labB = calcLaborSubtotal(conceptB.labor);
    const equA = calcEquipmentSubtotal(conceptA.equipment);
    const equB = calcEquipmentSubtotal(conceptB.equipment);
    const dcA = calcDirectCost(conceptA);
    const dcB = calcDirectCost(conceptB);
    const ocA = calcOvercostTotal(conceptA.overcostFactors, dcA);
    const ocB = calcOvercostTotal(conceptB.overcostFactors, dcB);
    const upA = calcUnitPrice(conceptA);
    const upB = calcUnitPrice(conceptB);
    const deltaAbs = upA - upB;
    const deltaPct = upB !== 0 ? ((upA - upB) / upB) * 100 : 0;
    return { matA, matB, labA, labB, equA, equB, dcA, dcB, ocA, ocB, upA, upB, deltaAbs, deltaPct };
  }, [conceptA, conceptB]);

  const lowerCol = vals ? (vals.upA < vals.upB ? 'A' : vals.upB < vals.upA ? 'B' : null) : null;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-900 items-center justify-center">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Inteligencia APU...</p>
      </div>
    );
  }

  // ─── Table Rows ────────────────────────────────────────────────────────────

  const SectionHeader = ({ label }: { label: string }) => (
    <tr>
      <td colSpan={3} className="bg-primary/10 text-primary uppercase text-[10px] tracking-widest font-bold px-4 py-2">
        {label}
      </td>
    </tr>
  );

  const DataRow = ({ label, valA, valB, mono }: { label: string; valA: string; valB: string; mono?: boolean }) => (
    <tr className="border-b border-white/5">
      <td className="px-4 py-2.5 text-[11px] text-slate-400 font-medium">{label}</td>
      <td className={`px-4 py-2.5 text-[11px] text-white ${mono ? 'font-mono' : ''}`}>{valA}</td>
      <td className={`px-4 py-2.5 text-[11px] text-white ${mono ? 'font-mono' : ''}`}>{valB}</td>
    </tr>
  );

  const DeltaRow = ({ label, value }: { label: string; value: string }) => (
    <tr className="border-b border-white/5">
      <td className="px-4 py-2.5 text-[11px] text-slate-400 font-bold">{label}</td>
      <td colSpan={2} className="px-4 py-2.5 text-[11px] text-white font-mono font-bold text-center">
        {value}
      </td>
    </tr>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-slate-900"
    >
      <AppHeader />

      {/* Top bar */}
      <div className="bg-primary/5 border-b border-primary/10 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/explorer" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
            <ArrowLeft size={14} />
            <span className="uppercase tracking-widest font-bold text-[10px]">Volver al Explorador</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Comparador de Conceptos</h1>
          <p className="text-slate-400 text-xs mt-1">Selecciona dos conceptos del catálogo APUCMX para comparar sus costos desglosados lado a lado.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-end">
          {/* Concept A */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Concepto A</label>
            <div className="relative">
              <select
                value={idA}
                onChange={(e) => { setIdA(e.target.value); setShowTable(false); }}
                className="appearance-none w-full bg-panel-dark text-white border border-white/10 rounded-lg px-4 h-12 pr-10 focus:ring-0 focus:border-primary cursor-pointer font-bold text-sm outline-none"
              >
                <option value="">Seleccionar...</option>
                {concepts.map(c => (
                  <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Concept B */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Concepto B</label>
            <div className="relative">
              <select
                value={idB}
                onChange={(e) => { setIdB(e.target.value); setShowTable(false); }}
                className="appearance-none w-full bg-panel-dark text-white border border-white/10 rounded-lg px-4 h-12 pr-10 focus:ring-0 focus:border-primary cursor-pointer font-bold text-sm outline-none"
              >
                <option value="">Seleccionar...</option>
                {concepts.map(c => (
                  <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Compare button */}
          <button
            onClick={handleCompare}
            disabled={!idA || !idB || isSame}
            className="h-12 px-8 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            Comparar
          </button>
        </div>

        {/* Same concept warning */}
        {isSame && (
          <div className="max-w-5xl mx-auto mt-3">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-amber-200/80 text-xs font-bold">Selecciona conceptos diferentes para comparar.</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {showTable && conceptA && conceptB && vals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pb-12"
        >
          <div className="max-w-5xl mx-auto bg-panel-dark rounded-xl border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/3">Campo</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/3">
                    <div className="flex items-center gap-2">
                      <span>Concepto A</span>
                      {lowerCol === 'A' && <Badge />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/3">
                    <div className="flex items-center gap-2">
                      <span>Concepto B</span>
                      {lowerCol === 'B' && <Badge />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Basic info */}
                <DataRow label="Código" valA={conceptA.id} valB={conceptB.id} mono />
                <DataRow label="Nombre" valA={conceptA.name} valB={conceptB.name} />
                <DataRow label="Unidad" valA={conceptA.unit} valB={conceptB.unit} />
                <DataRow label="Región" valA={conceptA.region} valB={conceptB.region} />
                <DataRow label="Tipo" valA={conceptA.type || '—'} valB={conceptB.type || '—'} />

                {/* Direct cost */}
                <SectionHeader label="Costo Directo" />
                <DataRow
                  label="Subtotal Materiales"
                  valA={formatMXN(vals.matA, !hasBlock(conceptA.materials))}
                  valB={formatMXN(vals.matB, !hasBlock(conceptB.materials))}
                  mono
                />
                <DataRow
                  label="Subtotal Mano de Obra"
                  valA={formatMXN(vals.labA, !hasBlock(conceptA.labor))}
                  valB={formatMXN(vals.labB, !hasBlock(conceptB.labor))}
                  mono
                />
                <DataRow
                  label="Subtotal Equipo"
                  valA={formatMXN(vals.equA, !hasBlock(conceptA.equipment))}
                  valB={formatMXN(vals.equB, !hasBlock(conceptB.equipment))}
                  mono
                />
                <DataRow
                  label="Costo Directo Total"
                  valA={formatMXN(vals.dcA)}
                  valB={formatMXN(vals.dcB)}
                  mono
                />

                {/* Overcosts */}
                <SectionHeader label="Sobrecostos" />
                <DataRow
                  label="Indirectos (%)"
                  valA={conceptA.overcostFactors ? `${sumIndirectos(conceptA.overcostFactors).toFixed(2)}%` : '—'}
                  valB={conceptB.overcostFactors ? `${sumIndirectos(conceptB.overcostFactors).toFixed(2)}%` : '—'}
                  mono
                />
                <DataRow
                  label="Financiamiento (%)"
                  valA={conceptA.overcostFactors ? `${conceptA.overcostFactors.financiamiento.toFixed(2)}%` : '—'}
                  valB={conceptB.overcostFactors ? `${conceptB.overcostFactors.financiamiento.toFixed(2)}%` : '—'}
                  mono
                />
                <DataRow
                  label="Utilidad (%)"
                  valA={conceptA.overcostFactors ? `${conceptA.overcostFactors.utilidad.toFixed(2)}%` : '—'}
                  valB={conceptB.overcostFactors ? `${conceptB.overcostFactors.utilidad.toFixed(2)}%` : '—'}
                  mono
                />
                <DataRow
                  label="Total Sobrecostos ($)"
                  valA={conceptA.overcostFactors ? formatMXN(vals.ocA) : '—'}
                  valB={conceptB.overcostFactors ? formatMXN(vals.ocB) : '—'}
                  mono
                />

                {/* Total price */}
                <SectionHeader label="Precio Total" />
                <tr className={`border-b border-white/5`}>
                  <td className="px-4 py-3 text-[11px] text-white font-bold">Precio Unitario Total</td>
                  <td className={`px-4 py-3 text-sm font-mono font-bold ${lowerCol === 'A' ? 'text-green-400 border-l-2 border-green-400' : 'text-white'}`}>
                    {formatMXN(vals.upA)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-mono font-bold ${lowerCol === 'B' ? 'text-green-400 border-l-2 border-green-400' : 'text-white'}`}>
                    {formatMXN(vals.upB)}
                  </td>
                </tr>
                <DeltaRow
                  label="Δ$ (diferencia)"
                  value={`${vals.deltaAbs >= 0 ? '+' : ''}${formatMXN(vals.deltaAbs)}`}
                />
                <DeltaRow
                  label="Δ% (diferencia)"
                  value={`${vals.deltaPct >= 0 ? '+' : ''}${vals.deltaPct.toFixed(2)}%`}
                />
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const ChevronIcon = () => (
  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Badge = () => (
  <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
    <Award size={10} />
    Menor Precio
  </span>
);
