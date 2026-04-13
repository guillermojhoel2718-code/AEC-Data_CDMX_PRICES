import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Verified, Clock, Package, HardHat, BarChart3, TrendingUp, Cpu, Layers } from 'lucide-react';
import { AppHeader, BlockchainBadge } from './Common';
import { motion } from 'motion/react';
import Fuse from 'fuse.js';
import { cn } from '../lib/utils';
import { useConcepts } from '../context/ConceptContext';
import { useAuth } from '../context/AuthContext';
import { REGIONS, REGION_LABELS } from '../lib/supabase';
import { MachineryDetailPanel, useMachineryPanel } from './MachineryDetailPanel';

export const ExplorerPage = () => {
  const { concepts, loading } = useConcepts();
  const { membership } = useAuth();

  const location = useLocation();
  const [selectedId, setSelectedId] = useState('CLAVE-001');
  const [regionFilter, setRegionFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const { isPanelOpen, selectedMaquina, openPanel, closePanel } = useMachineryPanel();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [location]);

  const fuse = useMemo(() => new Fuse(concepts, {
    keys: ['name', 'id'],
    threshold: 0.4, // Adjust for fuzziness
    distance: 100,
  }), [concepts]);

  const filteredConcepts = useMemo(() => {
    let results = searchTerm 
      ? fuse.search(searchTerm).map(r => r.item)
      : concepts;
    
    if (regionFilter !== 'Todas') {
      results = results.filter(c => c.region === regionFilter);
    }
    
    return results;
  }, [searchTerm, regionFilter, fuse, concepts]);

  const selectedConcept = useMemo(() => {
    if (selectedId && concepts.length > 0) {
      const found = concepts.find(c => c.id === selectedId);
      if (found) return found;
    }
    return filteredConcepts[0] || concepts[0] || null;
  }, [selectedId, concepts, filteredConcepts]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-900 items-center justify-center">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Inteligencia APU...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen overflow-hidden"
    >
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        {/* Left Section: Search & List */}
        <section className="flex-1 flex flex-col bg-slate-900 industrial-texture overflow-hidden">
          <div className="p-6 bg-primary/5 border-b border-primary/10">
            <div className="max-w-5xl mx-auto flex gap-0 shadow-2xl">
              <div className="relative">
                <select 
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="appearance-none bg-panel-dark text-white border-y border-l border-white/10 rounded-l-lg px-6 h-14 pr-12 focus:ring-0 focus:border-primary cursor-pointer font-bold text-sm outline-none"
                >
                <option value="Todas">Todas</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{REGION_LABELS[r]}</option>
                ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 bg-panel-dark border border-white/10 pl-14 pr-6 focus:ring-0 focus:border-primary text-white text-base placeholder:text-slate-500 outline-none rounded-r-lg" 
                  placeholder="Buscar conceptos, códigos o materiales..." 
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-5xl mx-auto space-y-2">
              <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <div className="col-span-2">Estatus</div>
                <div className="col-span-2">Código</div>
                <div className="col-span-3">Nombre del Concepto</div>
                <div className="col-span-2 text-right">Tipo de Partida</div>
                <div className="col-span-2 text-right">Precio Unit. / Unidad</div>
                <div className="col-span-1 text-right">Región</div>
              </div>

              {filteredConcepts.map((concept) => (
                <div 
                  key={concept.id}
                  onClick={() => setSelectedId(concept.id)}
                  className={`grid grid-cols-12 items-center px-6 py-3 rounded-lg border transition-all cursor-pointer shadow-md ${selectedId === concept.id ? 'bg-primary/20 border-primary/40 text-white' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new Event('open-validation-modal'));
                      }}
                      className="col-span-2 flex items-center gap-2 cursor-help group/badge"
                    >
                      {concept.status === 'verified' ? (
                        <Verified className="text-primary group-hover/badge:scale-110 transition-transform" size={14} />
                      ) : (
                        <Clock className="text-slate-500" size={14} />
                      )}
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded-full border font-black uppercase transition-all",
                        concept.status === 'verified' ? "bg-primary/10 border-primary/30 text-primary group-hover/badge:bg-primary/20" : "bg-slate-800 border-white/10 text-slate-500"
                      )}>
                        {concept.status === 'verified' ? 'VALIDADO' : 'PENDIENTE'}
                      </span>
                    </div>
                  <div className="col-span-2 font-mono font-bold text-[11px]">
                    {concept.id}
                  </div>
                  <div className="col-span-3 font-medium truncate pr-4 text-[12px]">{concept.name}</div>
                  <div className="col-span-2 text-right">
                    {concept.type && (
                      <span className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded-full border border-primary/30 font-bold uppercase">
                        {concept.type}
                      </span>
                    )}
                  </div>
                  <div className={`col-span-2 text-right font-bold font-mono text-[12px] ${selectedId === concept.id ? 'text-primary' : 'text-slate-300'}`}>
                    {concept.price} <span className="text-[10px] opacity-60">/ {concept.unit}</span>
                  </div>
                  <div className="col-span-1 text-right font-bold text-[10px] uppercase">{concept.region}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Section: Drawer */}
        <aside className="hidden lg:flex w-[360px] bg-panel-dark border-l border-primary/10 flex-col shadow-2xl">
          {!selectedConcept ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
              <div className="bg-slate-800 p-4 rounded-full border border-white/5">
                <Search className="text-slate-500" size={32} />
              </div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs">Sin Datos</h3>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                No se encontraron conceptos en la base de datos de Supabase. Verifica la conexión o los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-white/5 bg-background-dark/50">

            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-primary font-bold tracking-widest text-[9px] uppercase">Análisis de Concepto</span>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-xl font-bold text-white">{selectedConcept.id}</h2>
                  <span className={cn(
                    "text-[7px] px-1.5 py-0.5 rounded-full border font-black uppercase",
                    selectedConcept.status === 'verified' ? "bg-primary/10 border-primary/30 text-primary" : "bg-slate-800 border-white/10 text-slate-500"
                  )}>
                    {selectedConcept.status === 'verified' ? 'VALIDADO' : 'PENDIENTE'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-300 font-medium">
              {selectedConcept.name}. Base de datos actualizada 2024.
            </p>
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-[8px] text-amber-200/70 leading-relaxed italic">
                <span className="font-bold">Nota:</span> Este precio puede ser modificado por precios de proveedores, mano de obra de la región u algún otro indicador diferente que haga variar el precio final.
              </p>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 bg-background-dark p-2.5 rounded-lg border border-primary/10">
                  <p className="text-[7px] text-slate-500 uppercase font-bold">P.U. Total</p>
                  <p className="text-lg font-bold text-primary mt-0.5">{selectedConcept.price}</p>
                </div>
                <div className="flex-1 bg-background-dark p-2.5 rounded-lg border border-primary/10">
                  <p className="text-[7px] text-slate-500 uppercase font-bold">Región</p>
                  <p className="text-lg font-bold text-white mt-0.5">{selectedConcept.region}</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={11} className="text-primary" />
                  <span className="text-[7px] text-slate-400 uppercase font-bold">Factor de Sobrecosto</span>
                </div>
                <span className="text-sm font-black text-white font-mono">{selectedConcept.overhead || '1.2450'}</span>
              </div>
            </div>

            {membership === 'gratis' && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl animate-pulse">
                <p className="text-[8px] text-primary leading-relaxed font-bold text-center uppercase tracking-widest">
                  Actualiza a Membresía PRO para ver análisis detallados y descargar matrices completas.
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                  className="w-full mt-2 py-1.5 bg-primary text-white text-[8px] font-black rounded-lg uppercase tracking-tighter hover:brightness-110 transition-all"
                >
                  Ver Planes Premium
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Resumen de Costos Directos */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Resumen de Análisis Técnico</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Materiales</span>
                  <span className="text-white font-mono">
                    ${(selectedConcept.materials?.reduce((acc, m) => acc + (m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual, 0) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Mano de Obra (FASAR)</span>
                  <span className="text-white font-mono">
                    ${(selectedConcept.labor?.reduce((acc, l) => acc + (l.baseSalary * l.fsi * l.fasar * l.quantity), 0) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Maquinaria y Equipo</span>
                  <span className="text-white font-mono">
                    ${(selectedConcept.equipment?.reduce((acc, e) => acc + (e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual, 0) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Subcontratos</span>
                  <span className="text-white font-mono">
                    ${(selectedConcept.subcontracts?.reduce((acc, s) => acc + (s.costLab + s.fletes + s.maniobra), 0) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-white/5 my-2"></div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-white uppercase">Costo Directo Total</span>
                  <span className="text-primary font-mono">
                    ${(
                      (selectedConcept.materials?.reduce((acc, m) => acc + (m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual, 0) || 0) +
                      (selectedConcept.labor?.reduce((acc, l) => acc + (l.baseSalary * l.fsi * l.fasar * l.quantity), 0) || 0) +
                      (selectedConcept.equipment?.reduce((acc, e) => acc + (e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual, 0) || 0) +
                      (selectedConcept.subcontracts?.reduce((acc, s) => acc + (s.costLab + s.fletes + s.maniobra), 0) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Materiales */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="text-primary" size={14} />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Detalle de Materiales</h3>
              </div>
              <table className="w-full text-left text-[10px]">
                <tbody className="text-slate-300">
                  {selectedConcept.materials && selectedConcept.materials.length > 0 ? selectedConcept.materials.map((m, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-2">{m.description}</td>
                      <td className="py-2 text-right font-mono text-slate-400">
                        ${((m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual).toFixed(2)}
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-slate-500 italic">Sin materiales registrados</td>
                      <td className="py-2 text-right font-mono text-slate-400">$0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mano de Obra */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HardHat className="text-primary" size={14} />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Mano de Obra (FASAR)</h3>
              </div>
              <table className="w-full text-left text-[10px]">
                <tbody className="text-slate-300">
                  {selectedConcept.labor && selectedConcept.labor.length > 0 ? selectedConcept.labor.map((l, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-2">{l.description}</td>
                      <td className="py-2 text-right font-mono text-slate-400">
                        ${(l.baseSalary * l.fsi * l.fasar * l.quantity).toFixed(2)}
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-slate-500 italic">Sin mano de obra registrada</td>
                      <td className="py-2 text-right font-mono text-slate-400">$0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Equipo y Maquinaria */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="text-primary" size={14} />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Equipo y Maquinaria</h3>
              </div>
              <table className="w-full text-left text-[10px]">
                <tbody className="text-slate-300">
                  {selectedConcept.equipment && selectedConcept.equipment.length > 0 ? selectedConcept.equipment.map((e, i) => (
                    <tr 
                      key={i} 
                      onClick={() => openPanel(e.code || '')}
                      className="border-b border-white/5 cursor-pointer hover:bg-slate-800/80 transition-colors group"
                    >
                      <td className="py-2 pr-2 group-hover:text-white transition-colors">
                        <span className="text-orange-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">▸</span>
                        {e.description}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-400">
                        ${((e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual).toFixed(2)}
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-slate-500 italic">Sin equipo registrado</td>
                      <td className="py-2 text-right font-mono text-slate-400">$0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Subcontratos */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-primary" size={14} />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Subcontratos</h3>
              </div>
              <table className="w-full text-left text-[10px]">
                <tbody className="text-slate-300">
                  {selectedConcept.subcontracts && selectedConcept.subcontracts.length > 0 ? selectedConcept.subcontracts.map((s, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-2">{s.description}</td>
                      <td className="py-2 text-right font-mono text-slate-400">
                        ${(s.costLab + s.fletes + s.maniobra).toFixed(2)}
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-b border-white/5">
                      <td className="py-2 text-slate-500 italic">Sin subcontratos registrados</td>
                      <td className="py-2 text-right font-mono text-slate-400">$0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sobrecostos */}
            {selectedConcept.overcostFactors && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="text-primary" size={14} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Factores de Sobrecosto</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                  <div className="flex justify-between border-b border-white/5 py-1">
                    <span>Indirectos</span>
                    <span className="text-white font-mono">{(selectedConcept.overcostFactors.indirectoHonorarios + selectedConcept.overcostFactors.indirectoGastosOficina + selectedConcept.overcostFactors.indirectoServicios).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1">
                    <span>Financiamiento</span>
                    <span className="text-white font-mono">{selectedConcept.overcostFactors.financiamiento.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1">
                    <span>Utilidad</span>
                    <span className="text-white font-mono">{selectedConcept.overcostFactors.utilidad.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1">
                    <span>Cargos Adic.</span>
                    <span className="text-white font-mono">{selectedConcept.overcostFactors.cargosAdicionales.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-background-dark/80 backdrop-blur-md border-t border-white/10">
            <Link to={`/detail/${selectedConcept.id}`} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20">
              <BarChart3 size={20} /> VER MATRIZ
            </Link>
            <p className="text-center text-[9px] text-slate-500 mt-3 font-mono uppercase">Integración Web3 en planeación</p>
            </div>
          </>
          )}
        </aside>
      </main>
      {selectedConcept && <BlockchainBadge isVisible={selectedConcept.status === 'verified'} />}
      <MachineryDetailPanel 
        isOpen={isPanelOpen} 
        codigoMaquina={selectedMaquina} 
        onClose={closePanel} 
      />
    </motion.div>
  );
};
