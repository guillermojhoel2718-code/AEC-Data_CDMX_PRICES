import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Fuel, Wrench, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Clock, DollarSign,
  BarChart3, Truck, Info
} from 'lucide-react';
import { supabase } from 'src/lib/supabase';
import { cn } from 'src/lib/utils';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface MachineryCost {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  valor_adquisicion: number;
  vida_economica_hrs: number;
  tipo_combustible: 'diesel' | 'gasolina' | 'electricidad' | 'ninguno';
  // Cargos Fijos
  depreciacion: number;
  inversion: number;
  seguros: number;
  mantenimiento: number;
  total_cargos_fijos: number;
  // Consumos
  precio_combustible: number;
  combustible_importe: number;
  lubricantes: number;
  llantas: number;
  total_consumos: number;
  // Operación
  operacion: number;
  // Total
  costo_horario_total: number;
  // CEDIA
  cedia_alerta_combustible: boolean;
  cedia_mensaje: string;
  cedia_precio_referencia: number;
  cedia_precio_regional: number;
  cedia_diff_pct: number;
  // Meta
  source_catalog: string;
}

interface MachineryDetailPanelProps {
  /** Machine code to look up. If null, panel is hidden. */
  codigoMaquina?: string | null;
  /** Machine data already fetched (optional bypass for DB call) */
  machine?: MachineryCost | null;
  /** Called when user closes the panel */
  onClose: () => void;
  /** Trigger from parent e.g. when a concept with equipment is selected */
  isOpen: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FUEL_LABELS: Record<string, string> = {
  diesel: 'Diésel',
  gasolina: 'Gasolina Magna',
  electricidad: 'Electricidad',
  ninguno: 'Sin combustible',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Excavacion':       <Truck size={14} />,
  'Excavación':       <Truck size={14} />,
  'Compactacion':     <BarChart3 size={14} />,
  'Compactación':     <BarChart3 size={14} />,
  'Elevacion':        <ChevronUp size={14} />,
  'Elevación':        <ChevronUp size={14} />,
  'Carga y Acarreo':  <Truck size={14} />,
  'Concreto':         <Wrench size={14} />,
  'Nivelacion':       <BarChart3 size={14} />,
  'Nivelación':       <BarChart3 size={14} />,
  'Carreteras':       <Truck size={14} />,
  'Perforacion':      <Wrench size={14} />,
  'Perforación':      <Wrench size={14} />,
  'Hidraulica':       <Fuel size={14} />,
  'Hidráulica':       <Fuel size={14} />,
  'Equipo ligero':    <Wrench size={14} />,
  'Equipo General':   <Wrench size={14} />,
};

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

const CostRow = ({
  label,
  value,
  indent = false,
  highlight = false,
  total = false,
}: {
  label: string;
  value: number;
  indent?: boolean;
  highlight?: boolean;
  total?: boolean;
}) => (
  <div
    className={cn(
      'flex justify-between items-center py-1.5 border-b border-white/5',
      indent && 'pl-4',
      highlight && 'bg-orange-500/5 rounded px-2',
      total && 'border-t border-white/20 pt-2 mt-1 font-bold',
    )}
  >
    <span className={cn('text-xs', total ? 'text-white' : 'text-slate-400')}>
      {label}
    </span>
    <span
      className={cn(
        'text-xs font-mono',
        total
          ? 'text-orange-400 text-sm font-black'
          : highlight
          ? 'text-orange-300'
          : 'text-white',
      )}
    >
      ${fmt(value)}
    </span>
  </div>
);

const SectionHeader = ({
  title,
  subtotal,
  expanded,
  onToggle,
  color = 'concrete',
}: {
  title: string;
  subtotal: number;
  expanded: boolean;
  onToggle: () => void;
  color?: 'concrete' | 'orange' | 'blue';
}) => {
  const colors = {
    concrete: 'border-slate-600/50 text-slate-300',
    orange:   'border-orange-500/30 text-orange-300',
    blue:     'border-blue-500/30 text-blue-300',
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex justify-between items-center py-2 px-3 mt-3 mb-1',
        'bg-slate-800/50 rounded-lg border cursor-pointer hover:bg-slate-700/50 transition-colors',
        colors[color],
      )}
    >
      <span className="text-xs font-black uppercase tracking-widest">
        {title}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold">${fmt(subtotal)}/hr</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
    </button>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// CEDIA Fuel Alert Banner
// ──────────────────────────────────────────────────────────────────────────────

const CediaFuelAlert = ({ machine }: { machine: MachineryCost }) => {
  if (!machine.cedia_alerta_combustible) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        <span className="text-[11px] text-emerald-300">
          Protocolo CEDIA: Costos de combustible dentro del rango aceptable.
        </span>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-lg border border-orange-500/40 bg-orange-500/10 mb-3"
      role="alert"
      aria-label="Alerta CEDIA: Costo de Insumo Desactualizado"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-black text-orange-300 uppercase tracking-wide mb-1">
            ⚠ Costo de Insumo Desactualizado — Protocolo CEDIA
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {machine.cedia_mensaje ||
              `El precio de ${FUEL_LABELS[machine.tipo_combustible]} 
              en el catálogo CMIC 2023 ($${fmt(machine.cedia_precio_referencia)}/lt) 
              difiere ${machine.cedia_diff_pct?.toFixed(1)}% del precio regional actual 
              ($${fmt(machine.cedia_precio_regional || 0)}/lt).`}
          </p>
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <p className="text-[9px] text-slate-500 uppercase">CMIC 2023</p>
              <p className="text-xs font-mono text-white">
                ${fmt(machine.cedia_precio_referencia)}/lt
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 uppercase">Regional Actual</p>
              <p className="text-xs font-mono text-orange-300">
                ${fmt(machine.cedia_precio_regional || 0)}/lt
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 uppercase">Diferencia</p>
              <p className="text-xs font-mono text-orange-400 font-bold">
                {machine.cedia_diff_pct?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Cost Breakdown Donut (pure CSS, no canvas)
// ──────────────────────────────────────────────────────────────────────────────

const CostDonut = ({ machine }: { machine: MachineryCost }) => {
  const total = machine.costo_horario_total || 1;
  const pctFijos = Math.round((machine.total_cargos_fijos / total) * 100);
  const pctConsumos = Math.round((machine.total_consumos / total) * 100);
  const pctOper = 100 - pctFijos - pctConsumos;

  // SVG donut chart
  const RADIUS = 36;
  const CIRC = 2 * Math.PI * RADIUS;

  const segments = [
    { pct: pctFijos,   color: '#6E6E6E', label: 'Cargos Fijos' },
    { pct: pctConsumos, color: '#F05A28', label: 'Consumos' },
    { pct: pctOper,    color: '#3B82F6', label: 'Operación' },
  ];

  let cumulative = 0;
  return (
    <div className="flex items-center gap-4 mb-4 p-3 bg-slate-800/40 rounded-xl border border-white/5">
      <div className="relative shrink-0">
        <svg width={88} height={88} viewBox="0 0 88 88" className="-rotate-90">
          <circle cx={44} cy={44} r={RADIUS} fill="none" stroke="#1e293b" strokeWidth={12} />
          {segments.map((seg, i) => {
            const offset = cumulative;
            const dash = (seg.pct / 100) * CIRC;
            cumulative += dash;
            return (
              <circle
                key={i}
                cx={44} cy={44} r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={12}
                strokeDasharray={`${dash} ${CIRC}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[9px] text-slate-500">$/hr</p>
            <p className="text-sm font-black text-white">${fmt(machine.costo_horario_total).split('.')[0]}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-slate-400">{seg.label}</span>
            </div>
            <span className="text-[10px] font-bold text-white">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Panel Component
// ──────────────────────────────────────────────────────────────────────────────

export const MachineryDetailPanel: React.FC<MachineryDetailPanelProps> = ({
  codigoMaquina,
  machine: machineProp,
  onClose,
  isOpen,
}) => {
  const [machine, setMachine] = useState<MachineryCost | null>(machineProp || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    fijos: true,
    consumos: true,
    operacion: true,
  });

  // Fetch machine by code
  useEffect(() => {
    if (machineProp) {
      setMachine(machineProp);
      return;
    }
    if (!codigoMaquina || !isOpen) return;

    setLoading(true);
    setError(null);

    supabase
      .from('machinery_costs')
      .select('*')
      .eq('codigo', codigoMaquina)
      .single()
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError('No se encontró la maquinaria en la base de datos.');
        } else {
          setMachine(data as MachineryCost);
        }
      });
  }, [codigoMaquina, machineProp, isOpen]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed right-0 top-0 h-full z-50',
            'w-full max-w-sm',
            'bg-slate-900 border-l border-white/10',
            'flex flex-col shadow-2xl shadow-black/50',
          )}
          style={{ fontFamily: "'Inter', sans-serif" }}
          aria-label="Panel de detalle de maquinaria"
          role="complementary"
        >
          {/* ── HEADER ────────────────────────────────────────────────── */}
          <header
            className="flex items-center justify-between px-5 py-4 border-b border-white/10"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#F05A28' }}
              >
                <Wrench size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  Análisis CMIC 2023
                </p>
                <h2 className="text-sm font-black text-white leading-tight">
                  Costo Horario de Maquinaria
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              id="machinery-panel-close"
              aria-label="Cerrar panel de maquinaria"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          {/* ── CONTENT ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Cargando datos de maquinaria...</p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Info size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Machine detail */}
            {machine && !loading && (
              <>
                {/* Machine identity */}
                <div className="pb-3 mb-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                          style={{ backgroundColor: '#6E6E6E33', color: '#6E6E6E', border: '1px solid #6E6E6E44' }}
                        >
                          {machine.codigo}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase">
                          {CATEGORY_ICONS[machine.categoria]}
                          {machine.categoria}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {machine.nombre}
                      </h3>
                    </div>
                  </div>

                  {/* Key specs */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                      <DollarSign size={12} className="mx-auto text-slate-500 mb-0.5" />
                      <p className="text-[9px] text-slate-500 uppercase">Adquisición</p>
                      <p className="text-xs font-bold text-white">
                        ${(machine.valor_adquisicion / 1_000_000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                      <Clock size={12} className="mx-auto text-slate-500 mb-0.5" />
                      <p className="text-[9px] text-slate-500 uppercase">Vida Econ.</p>
                      <p className="text-xs font-bold text-white">
                        {machine.vida_economica_hrs.toLocaleString()} hrs
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                      <Fuel size={12} className="mx-auto text-slate-500 mb-0.5" />
                      <p className="text-[9px] text-slate-500 uppercase">Combustible</p>
                      <p className="text-xs font-bold text-white">
                        {FUEL_LABELS[machine.tipo_combustible]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CEDIA Alert */}
                <CediaFuelAlert machine={machine} />

                {/* Donut Chart */}
                <CostDonut machine={machine} />

                {/* ── CARGOS FIJOS ──────────────────────────────────── */}
                <SectionHeader
                  title="Cargos Fijos"
                  subtotal={machine.total_cargos_fijos}
                  expanded={expandedSections.fijos}
                  onToggle={() => toggleSection('fijos')}
                  color="concrete"
                />
                <AnimatePresence>
                  {expandedSections.fijos && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-1"
                    >
                      <CostRow label="Depreciación" value={machine.depreciacion} indent />
                      <CostRow label="Inversión (financiamiento)" value={machine.inversion} indent />
                      <CostRow label="Seguros" value={machine.seguros} indent />
                      <CostRow label="Mantenimiento mayor" value={machine.mantenimiento} indent />
                      <CostRow
                        label="Subtotal Cargos Fijos"
                        value={machine.total_cargos_fijos}
                        total
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── CONSUMOS ──────────────────────────────────────── */}
                <SectionHeader
                  title="Consumos"
                  subtotal={machine.total_consumos}
                  expanded={expandedSections.consumos}
                  onToggle={() => toggleSection('consumos')}
                  color="orange"
                />
                <AnimatePresence>
                  {expandedSections.consumos && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-1"
                    >
                      {/* Combustible with price ref */}
                      <div
                        className={cn(
                          'flex justify-between items-start py-1.5 border-b border-white/5 pl-4',
                          machine.cedia_alerta_combustible && 'bg-orange-500/5 rounded px-2',
                        )}
                      >
                        <div>
                          <span className="text-xs text-slate-400">
                            {FUEL_LABELS[machine.tipo_combustible]}
                          </span>
                          <p className="text-[9px] text-slate-600 mt-0.5">
                            Precio ref: ${fmt(machine.precio_combustible)}/lt
                            {machine.cedia_alerta_combustible && (
                              <span className="text-orange-500 ml-1">⚠ Desactualizado</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-white">${fmt(machine.combustible_importe)}</span>
                      </div>
                      <CostRow label="Lubricantes" value={machine.lubricantes} indent />
                      {machine.llantas > 0 && (
                        <CostRow label="Llantas" value={machine.llantas} indent />
                      )}
                      <CostRow
                        label="Subtotal Consumos"
                        value={machine.total_consumos}
                        total
                        highlight
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── OPERACIÓN ─────────────────────────────────────── */}
                <SectionHeader
                  title="Operación"
                  subtotal={machine.operacion}
                  expanded={expandedSections.operacion}
                  onToggle={() => toggleSection('operacion')}
                  color="blue"
                />
                <AnimatePresence>
                  {expandedSections.operacion && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-1"
                    >
                      <CostRow label="Operador (salario real + prestaciones)" value={machine.operacion} indent />
                      <CostRow
                        label="Subtotal Operación"
                        value={machine.operacion}
                        total
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── COSTO HORARIO TOTAL ────────────────────────────── */}
                <div
                  className="mt-4 p-4 rounded-xl border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(240,90,40,0.15) 0%, rgba(240,90,40,0.05) 100%)',
                    borderColor: 'rgba(240,90,40,0.4)',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">
                        Costo Horario Total
                      </p>
                      <p className="text-[9px] text-slate-600">
                        Cargos Fijos + Consumos + Operación
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-2xl font-black"
                        style={{ color: '#F05A28' }}
                      >
                        ${fmt(machine.costo_horario_total)}
                      </p>
                      <p className="text-[9px] text-slate-500">MXN / hora</p>
                    </div>
                  </div>
                </div>

                {/* Source note */}
                <div className="flex items-center gap-1.5 mt-3 px-1">
                  <Info size={10} className="text-slate-600 shrink-0" />
                  <p className="text-[9px] text-slate-600">
                    Fuente: {machine.source_catalog || 'Catálogos CMIC 2023'} — CEICO,
                    Cámara Mexicana de la Industria de la Construcción.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Hook for machinery lookup from ExplorerPage
// ──────────────────────────────────────────────────────────────────────────────

export const useMachineryPanel = () => {
  const [selectedMaquina, setSelectedMaquina] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = (codigo: string) => {
    setSelectedMaquina(codigo);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    // Delay clearing to allow exit animation
    setTimeout(() => setSelectedMaquina(null), 350);
  };

  return { selectedMaquina, isPanelOpen, openPanel, closePanel };
};

export default MachineryDetailPanel;
