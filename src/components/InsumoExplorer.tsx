import React, { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle, CheckCircle2, Clock, Eye, BarChart3, ChevronLeft, ChevronRight, X, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Insumo {
  codigo: string; descripcion: string; unidad: string; precio_unitario: number;
  categoria: string | null; tipo_registro: string; nivel_confianza: number;
  status: string; es_outlier: boolean; z_precio: number | null; activo: boolean;
}
interface Stats { total: number; listos: number; a_verificar: number; outliers: number; n_categorias: number; precio_promedio: number; }
interface CatStat { categoria: string; total: number; outliers: number; }

const PAGE_SIZE = 40;
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  listo:     { label: 'Listo',     color: 'text-emerald-400 bg-emerald-400/10' },
  verificar: { label: 'Verificar', color: 'text-amber-400 bg-amber-400/10' },
  observado: { label: 'Observado', color: 'text-red-400 bg-red-400/10' },
  pendiente: { label: 'Pendiente', color: 'text-slate-400 bg-slate-400/10' },
};
const TIPO_CFG: Record<string, string> = { material: 'MAT', mano_obra: 'MO', equipo: 'EQ', indirecto: 'IND' };
const fmt = (n: number | null | undefined, dec = 2) => n != null ? n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';
const ConfBar = ({ nivel }: { nivel: number }) => (
  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => (<div key={i} className={`h-2 w-2 rounded-sm ${i <= nivel ? 'bg-[#6366F1]' : 'bg-[#2A2A4A]'}`} />))}</div>
);
const StatCard = ({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: string }) => (
  <div className="bg-[#0F0F1E] border border-[#1A1A2E] rounded-xl p-4 flex items-start gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? 'bg-[#6366F1]/15'}`}>{icon}</div>
    <div><p className="text-[#666688] text-xs">{label}</p><p className="text-white font-bold text-xl leading-none mt-0.5">{value}</p>{sub && <p className="text-[#666688] text-xs mt-0.5">{sub}</p>}</div>
  </div>
);

export const InsumoExplorer: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [catStats, setCatStats] = useState<CatStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtStatus, setFiltStatus] = useState('');
  const [filtTipo, setFiltTipo] = useState('');
  const [soloOutliers, setSoloOutliers] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: cs }] = await Promise.all([
        supabase.from('v_insumos_stats').select('*').single(),
        supabase.from('v_insumos_por_categoria').select('categoria,total,outliers').limit(30),
      ]);
      if (s) setStats(s as Stats);
      if (cs) setCatStats(cs as CatStat[]);
    })();
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('apuc_insumos').select('codigo,descripcion,unidad,precio_unitario,categoria,tipo_registro,nivel_confianza,status,es_outlier,z_precio,activo', { count: 'exact' });
      if (filtCat) q = q.eq('categoria', filtCat);
      if (filtStatus) q = q.eq('status', filtStatus);
      if (filtTipo) q = q.eq('tipo_registro', filtTipo);
      if (soloOutliers) q = q.eq('es_outlier', true);
      if (busqueda.trim().length >= 3) q = q.ilike('descripcion', `%${busqueda.trim()}%`);
      const { data, count, error } = await q.order('categoria').order('descripcion').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (!error) { setInsumos((data ?? []) as Insumo[]); setTotal(count ?? 0); }
    } finally { setLoading(false); }
  }, [busqueda, filtCat, filtStatus, filtTipo, soloOutliers, page]);

  useEffect(() => { setPage(0); }, [busqueda, filtCat, filtStatus, filtTipo, soloOutliers]);
  useEffect(() => { cargar(); }, [cargar]);

  const hayFiltros = !!(filtCat || filtStatus || filtTipo || soloOutliers || busqueda);
  const limpiarFiltros = () => { setBusqueda(''); setFiltCat(''); setFiltStatus(''); setFiltTipo(''); setSoloOutliers(false); };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="border-b border-[#1A1A2E] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5 text-[#6366F1]" />Catálogo de Insumos</h1><p className="text-[#666688] text-sm mt-0.5">Resultado del análisis con Gemini Flash · CDMX 2026</p></div>
        <button onClick={cargar} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A1A2E] hover:bg-[#2A2A4A] text-[#8888AA] text-sm transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Actualizar</button>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total" value={stats.total.toLocaleString()} icon={<Package className="w-4 h-4 text-[#6366F1]" />} />
            <StatCard label="Listos" value={stats.listos.toLocaleString()} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} accent="bg-emerald-500/10" sub={`${stats.total ? Math.round(100*stats.listos/stats.total) : 0}%`} />
            <StatCard label="A verificar" value={stats.a_verificar?.toLocaleString() ?? '—'} icon={<Eye className="w-4 h-4 text-amber-400" />} accent="bg-amber-500/10" />
            <StatCard label="Outliers" value={stats.outliers?.toLocaleString() ?? '—'} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} accent="bg-red-500/10" />
            <StatCard label="Categorías" value={stats.n_categorias ?? '—'} icon={<BarChart3 className="w-4 h-4 text-purple-400" />} accent="bg-purple-500/10" />
            <StatCard label="Precio prom." value={stats.precio_promedio ? `$${fmt(stats.precio_promedio)}` : '—'} icon={<TrendingUp className="w-4 h-4 text-cyan-400" />} accent="bg-cyan-500/10" sub="MXN" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">{[...Array(6)].map((_,i) => (<div key={i} className="h-20 rounded-xl bg-[#0F0F1E] animate-pulse border border-[#1A1A2E]" />))}</div>
        )}
        {catStats.length > 0 && (
          <div className="bg-[#0F0F1E] border border-[#1A1A2E] rounded-xl p-4">
            <p className="text-[#666688] text-xs font-semibold uppercase tracking-widest mb-3">Distribución por Categoría</p>
            <div className="flex flex-wrap gap-2">
              {catStats.slice(0, 14).map(c => (
                <button key={c.categoria} onClick={() => setFiltCat(filtCat === c.categoria ? '' : c.categoria)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filtCat === c.categoria ? 'bg-[#6366F1] border-[#6366F1] text-white' : 'bg-[#1A1A2E] border-[#2A2A4A] text-[#8888AA] hover:border-[#6366F1]/50 hover:text-white'}`}>
                  <span>{c.categoria}</span><span className="opacity-60">{c.total}</span>
                  {c.outliers > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666688]" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar descripción (mín. 3 caracteres)…"
              className="w-full bg-[#0F0F1E] border border-[#2A2A4A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#444466] focus:outline-none focus:border-[#6366F1]/60 transition-colors" />
          </div>
          <select value={filtStatus} onChange={e => setFiltStatus(e.target.value)} className="bg-[#0F0F1E] border border-[#2A2A4A] rounded-xl px-3 py-2.5 text-sm text-[#8888AA] focus:outline-none min-w-[140px]">
            <option value="">Todos los status</option>
            {Object.entries(STATUS_CFG).map(([k,v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <select value={filtTipo} onChange={e => setFiltTipo(e.target.value)} className="bg-[#0F0F1E] border border-[#2A2A4A] rounded-xl px-3 py-2.5 text-sm text-[#8888AA] focus:outline-none min-w-[130px]">
            <option value="">Todos los tipos</option>
            <option value="material">Material</option><option value="mano_obra">Mano de Obra</option>
            <option value="equipo">Equipo</option><option value="indirecto">Indirecto</option>
          </select>
          <button onClick={() => setSoloOutliers(p => !p)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${soloOutliers ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-[#0F0F1E] border-[#2A2A4A] text-[#666688]'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> Outliers
          </button>
          {hayFiltros && (<button onClick={limpiarFiltros} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm bg-[#1A1A2E] text-[#8888AA] hover:text-white border border-[#2A2A4A]"><X className="w-3.5 h-3.5" /> Limpiar</button>)}
        </div>
        <div className="flex items-center justify-between text-sm text-[#666688]">
          <span>{loading ? 'Cargando…' : `${total.toLocaleString()} insumos encontrados${hayFiltros ? ' (filtrado)' : ''}`}</span>
          {total === 0 && !loading && (<span className="text-amber-400 text-xs">Tabla vacía — ejecuta <code className="bg-[#1A1A2E] px-1 rounded font-mono">insumo_analyzer.py</code></span>)}
        </div>
        <div className="bg-[#0F0F1E] border border-[#1A1A2E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#1A1A2E]">{['Código','Descripción','Cat.','Tipo','Unidad','Precio (MXN)','Conf.','Status'].map(h => (<th key={h} className="text-left px-4 py-3 text-[#666688] text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>))}</tr></thead>
              <tbody>
                {loading ? ([...Array(8)].map((_,i) => (<tr key={i} className="border-b border-[#0A0A0F]">{[...Array(8)].map((_,j) => (<td key={j} className="px-4 py-3"><div className="h-3 rounded bg-[#1A1A2E] animate-pulse" style={{width:`${40+Math.random()*50}%`}} /></td>))}</tr>)))
                : insumos.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-[#666688]">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-[#8888AA]">Sin insumos aún</p>
                    <p className="text-xs mt-1">Ejecuta <code className="bg-[#1A1A2E] px-1 rounded font-mono">python 1-Backend/scripts/insumo_analyzer.py</code></p>
                  </td></tr>
                ) : insumos.map((ins, idx) => {
                  const cfg = STATUS_CFG[ins.status] ?? STATUS_CFG.pendiente;
                  return (
                    <tr key={ins.codigo} className={`border-b border-[#0A0A0F] hover:bg-[#0F0F2A] transition-colors ${ins.es_outlier ? 'bg-red-950/10' : idx % 2 === 0 ? '' : 'bg-[#0A0A15]'}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#6366F1] whitespace-nowrap">{ins.codigo}</td>
                      <td className="px-4 py-3 max-w-xs"><div className="flex items-start gap-2">{ins.es_outlier && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />}<span className="text-white text-xs leading-relaxed line-clamp-2">{ins.descripcion}</span></div></td>
                      <td className="px-4 py-3 text-[#8888AA] text-xs"><span className="truncate block max-w-[120px]" title={ins.categoria ?? ''}>{ins.categoria ?? '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#2A2A4A] text-[#8888AA]">{TIPO_CFG[ins.tipo_registro] ?? ins.tipo_registro}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-[#A5B4FC] whitespace-nowrap">{ins.unidad ?? '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap"><span className={`font-mono text-sm ${ins.es_outlier ? 'text-red-400' : 'text-white'}`}>{ins.precio_unitario > 0 ? `$${fmt(ins.precio_unitario)}` : '—'}</span>{ins.es_outlier && ins.z_precio != null && <p className="text-red-400/70 text-xs">z={ins.z_precio}</p>}</td>
                      <td className="px-4 py-3"><ConfBar nivel={ins.nivel_confianza ?? 1} /></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1A1A2E]">
              <span className="text-[#666688] text-xs">Página {page + 1} de {totalPages} · {total.toLocaleString()} insumos</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 rounded-lg bg-[#1A1A2E] flex items-center justify-center disabled:opacity-30 hover:bg-[#2A2A4A] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-8 rounded-lg bg-[#1A1A2E] flex items-center justify-center disabled:opacity-30 hover:bg-[#2A2A4A] transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
        <p className="text-[#333355] text-xs text-center">Catálogo APUCMX · CDMX 2026 · Precios estimados, sujetos a verificación.</p>
      </div>
    </div>
  );
};
