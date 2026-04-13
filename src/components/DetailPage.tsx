import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, BarChart3, Layers, Users, ShieldCheck, Info, TrendingUp, History, Database, Cpu, Lock, Package, HardHat, Settings } from 'lucide-react';
import { AppHeader, BlockchainBadge, MembershipTier } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useConcepts } from '../context/ConceptContext';
import { useAuth } from '../context/AuthContext';

export const DetailPage = () => {
  const { id } = useParams();
  const { concepts, loading } = useConcepts();
  const { membership } = useAuth();

  const [activeTab, setActiveTab] = useState('tecnico');

  const concept = useMemo(() => {
    return concepts.find(c => c.id === id) || concepts[0] || null;
  }, [id, concepts]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 items-center justify-center">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Analizando Matriz...</p>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-slate-950">
          <div className="bg-slate-900 p-8 rounded-full border border-white/5 shadow-2xl">
            <Info className="text-primary" size={64} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Concepto No Encontrado</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              El código de concepto <span className="text-primary font-mono font-bold">{id}</span> no existe en nuestra base de datos o hubo un error al cargar la información.
            </p>
          </div>
          <Link to="/explorer" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
             <ChevronRight className="rotate-180" size={18} /> Volver al Explorador
          </Link>
        </main>
      </div>
    );
  }


  const totals = useMemo(() => {
    const matTotal = concept.materials?.reduce((acc, m) => acc + (m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual, 0) || 0;
    const labTotal = concept.labor?.reduce((acc, l) => acc + (l.baseSalary * l.fsi * l.fasar * l.quantity), 0) || 0;
    const eqTotal = concept.equipment?.reduce((acc, e) => acc + (e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual, 0) || 0;
    const subTotal = concept.subcontracts?.reduce((acc, s) => acc + (s.costLab + s.fletes + s.maniobra), 0) || 0;
    
    const costoDirecto = matTotal + labTotal + eqTotal + subTotal;
    
    let indirectoMonto = 0;
    let financiamientoMonto = 0;
    let utilidadMonto = 0;
    let cargosAdicMonto = 0;
    let imssMonto = 0;
    let segurosMonto = 0;

    if (concept.overcostFactors) {
      const f = concept.overcostFactors;
      const indirectoTotalPct = f.indirectoHonorarios + f.indirectoDepreciacion + f.indirectoServicios + 
                               f.indirectoGastosOficina + f.indirectoFletes + f.indirectoCapacitacion + 
                               f.indirectoSeguridad + f.indirectoAuxiliares;
      
      indirectoMonto = costoDirecto * (indirectoTotalPct / 100);
      const subtotal1 = costoDirecto + indirectoMonto;
      
      financiamientoMonto = subtotal1 * (f.financiamiento / 100);
      const subtotal2 = subtotal1 + financiamientoMonto;
      
      utilidadMonto = subtotal2 * (f.utilidad / 100);
      const subtotal3 = subtotal2 + utilidadMonto;
      
      cargosAdicMonto = subtotal3 * (f.cargosAdicionales / 100);
      imssMonto = subtotal3 * (f.imss / 100);
      segurosMonto = subtotal3 * (f.seguros / 100);
    }

    const precioUnitarioFinal = costoDirecto + indirectoMonto + financiamientoMonto + utilidadMonto + cargosAdicMonto + imssMonto + segurosMonto;

    return {
      costoDirecto,
      indirectoMonto,
      financiamientoMonto,
      utilidadMonto,
      cargosAdicMonto,
      imssMonto,
      segurosMonto,
      precioUnitarioFinal
    };
  }, [concept]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen"
    >
      <AppHeader />
      <main className="flex-1 flex flex-col">
        <div className="bg-slate-900 border-b border-primary/10 px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Link className="text-slate-500 hover:text-primary" to="/">Inicio</Link>
            <ChevronRight size={10} className="text-slate-500" />
            <Link className="text-slate-500 hover:text-primary" to="/explorer">Explorador</Link>
            <ChevronRight size={10} className="text-slate-500" />
            <span className="text-primary font-semibold">{concept.id}</span>
          </div>
        </div>

        <div className="px-6 md:px-10 py-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 tracking-widest uppercase">Matriz de Precio Unitario</span>
                  <span className="text-slate-500 text-xs font-mono">{concept.id} | Rev. 2024</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 leading-tight">{concept.name}</h1>
                <p className="text-slate-400 max-w-3xl text-sm leading-relaxed italic">
                  Análisis detallado basado en rendimientos estándar y precios de mercado validados por la red APUCMX.
                </p>
                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl max-w-3xl">
                  <p className="text-[10px] text-amber-200/60 leading-relaxed italic">
                    <span className="font-bold">Nota:</span> Este precio puede ser modificado por precios de proveedores, mano de obra de la región u algún otro indicador diferente que haga variar el precio final.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 bg-slate-900 p-6 rounded-xl border border-primary/20 shadow-xl w-full lg:w-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio Unitario Total (Con Sobrecosto)</span>
                <div className="text-4xl font-black text-primary">$ {totals.precioUnitarioFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal text-slate-500">MXN</span></div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-primary/10 w-full justify-end">
                  <span className="text-xs text-slate-500 italic">Unidad: {concept.unit}</span>
                  <BarChart3 size={14} className="text-primary" />
                </div>
                {membership === 'gratis' && (
                  <div className="mt-4 w-full p-3 bg-primary/10 border border-primary/20 rounded-xl animate-pulse text-center">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">
                      Acceso Limitado (Gratis)
                    </p>
                    <button 
                      onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                      className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-lg uppercase"
                    >
                      Actualizar a Premium
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-700/50 mb-8 overflow-x-auto">
            <div className="flex gap-10">
              <button 
                onClick={() => setActiveTab('tecnico')}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative",
                  activeTab === 'tecnico' ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary" : "text-slate-400 hover:text-white"
                )}
              >
                Análisis Técnico
              </button>
              <button 
                onClick={() => setActiveTab('sobrecosto')}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative",
                  activeTab === 'sobrecosto' ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary" : "text-slate-400 hover:text-white"
                )}
              >
                Factor de Sobrecosto
              </button>
              <button 
                onClick={() => setActiveTab('blockchain')}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative flex items-center gap-2",
                  activeTab === 'blockchain' ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary" : "text-slate-400 hover:text-white"
                )}
              >
                Historial Blockchain
                {membership === 'gratis' && <Lock size={12} className="text-slate-500" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'tecnico' && (
              <motion.div 
                key="tecnico"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 gap-8 max-w-6xl"
              >
                {/* Materiales */}
                <section className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden shadow-sm">
                  <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-primary" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white">Materiales</h3>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Descripción</th>
                        <th className="px-4 py-4 text-center">Unidad</th>
                        <th className="px-4 py-4 text-center">Costo LAB</th>
                        <th className="px-4 py-4 text-center">Fletes</th>
                        <th className="px-4 py-4 text-center">Fc. Actual</th>
                        <th className="px-6 py-4 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {concept.materials && concept.materials.length > 0 ? concept.materials.map((m, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{m.code}</td>
                          <td className="px-6 py-4 text-slate-300">{m.description}</td>
                          <td className="px-4 py-4 text-center text-slate-400">{m.unit}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">${m.costLab.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">${m.fletes.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">{m.fcActual.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-bold text-primary font-mono">
                            ${((m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual).toFixed(2)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          {/* PATRÓN DEFENSIVO: Ocultar columnas de costo y usar colSpan completo para estados funcionales limpios */}
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic text-[11px] tracking-wide">
                            Este concepto no requiere materiales directos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                {/* Mano de Obra */}
                <section className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden shadow-sm">
                  <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HardHat size={14} className="text-primary" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white">Mano de Obra (FASAR)</h3>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                        <th className="px-6 py-4">Descripción</th>
                        <th className="px-4 py-4 text-center">Salario Base</th>
                        <th className="px-4 py-4 text-center">F.S.I.</th>
                        <th className="px-4 py-4 text-center">FASAR</th>
                        <th className="px-4 py-4 text-center">Cantidad</th>
                        <th className="px-6 py-4 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-300">
                      {concept.labor && concept.labor.length > 0 ? concept.labor.map((l, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4">{l.description}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">${l.baseSalary.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">{l.fsi.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">{l.fasar.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">{l.quantity.toFixed(4)}</td>
                          <td className="px-6 py-4 text-right font-bold text-primary font-mono">
                            ${(l.baseSalary * l.fsi * l.fasar * l.quantity).toFixed(2)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          {/* PATRÓN DEFENSIVO: Ocultar columnas de costo y usar colSpan completo para estados funcionales limpios */}
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic text-[11px] tracking-wide">
                            Este concepto no requiere mano de obra directa
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                {/* Equipo */}
                {concept.equipment && concept.equipment.length > 0 && (
                  <section className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden shadow-sm">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-primary" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-white">Equipo y Maquinaria</h3>
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                          <th className="px-6 py-4">Descripción</th>
                          <th className="px-4 py-4 text-center">Costo LAB</th>
                          <th className="px-4 py-4 text-center">Fc. Actual</th>
                          <th className="px-6 py-4 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-300">
                        {concept.equipment.map((e, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">{e.description}</td>
                            <td className="px-4 py-4 text-center text-slate-400 font-mono">${e.costLab.toFixed(2)}</td>
                            <td className="px-4 py-4 text-center text-slate-400 font-mono">{e.fcActual.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-bold text-primary font-mono">
                              ${((e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Subcontratos */}
                {concept.subcontracts && concept.subcontracts.length > 0 && (
                  <section className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden shadow-sm">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Settings size={14} className="text-primary" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-white">Subcontratos</h3>
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                          <th className="px-6 py-4">Descripción</th>
                          <th className="px-4 py-4 text-center">Unidad</th>
                          <th className="px-6 py-4 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-300">
                        {concept.subcontracts.map((s, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">{s.description}</td>
                            <td className="px-4 py-4 text-center text-slate-400">{s.unit}</td>
                            <td className="px-6 py-4 text-right font-bold text-primary font-mono">
                              ${(s.costLab + s.fletes + s.maniobra).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Costo Directo</span>
                  <span className="text-2xl font-black text-white font-mono">${totals.costoDirecto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'sobrecosto' && (
              <motion.div 
                key="sobrecosto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl"
              >
                <div className="bg-slate-900 rounded-xl border border-white/5 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-primary" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-white">Análisis de Indirectos</h3>
                  </div>
                  <div className="space-y-4">
                    {concept.overcostFactors && [
                      { label: 'Indirectos de Oficina Central', value: `${(concept.overcostFactors.indirectoHonorarios + concept.overcostFactors.indirectoGastosOficina).toFixed(2)}%` },
                      { label: 'Indirectos de Campo', value: `${(concept.overcostFactors.indirectoDepreciacion + concept.overcostFactors.indirectoServicios + concept.overcostFactors.indirectoFletes + concept.overcostFactors.indirectoCapacitacion + concept.overcostFactors.indirectoSeguridad + concept.overcostFactors.indirectoAuxiliares).toFixed(2)}%` },
                      { label: 'Financiamiento', value: `${concept.overcostFactors.financiamiento.toFixed(2)}%` },
                      { label: 'Utilidad', value: `${concept.overcostFactors.utilidad.toFixed(2)}%` },
                      { label: 'Cargos Adicionales', value: `${concept.overcostFactors.cargosAdicionales.toFixed(2)}%` }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-sm text-slate-400">{item.label}</span>
                        <span className="text-sm font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-4 flex justify-between items-center">
                      <span className="text-base font-bold text-primary uppercase">Factor de Sobrecosto</span>
                      <span className="text-xl font-black text-primary">{concept.overhead}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900 rounded-xl border border-white/5 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={18} className="text-primary" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-white">Resumen de Costos</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Costo Directo</p>
                      <p className="text-2xl font-bold text-white">${totals.costoDirecto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Indirectos y Utilidad</p>
                      <p className="text-2xl font-bold text-white">${(totals.precioUnitarioFinal - totals.costoDirecto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-primary uppercase font-bold">Precio Unitario Final</p>
                      <p className="text-4xl font-black text-primary">${totals.precioUnitarioFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'blockchain' && (
              <motion.div 
                key="blockchain"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl"
              >
                {membership === 'gratis' ? (
                  <div className="bg-slate-900 border border-primary/20 rounded-2xl p-12 flex flex-col items-center text-center">
                    <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6">
                      <Lock size={48} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Acceso Premium</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed max-w-md">
                      El historial de auditoría blockchain es una función exclusiva para miembros Premium. Actualiza tu plan para ver la trazabilidad completa de este concepto.
                    </p>
                    <button 
                      onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                      className="bg-primary hover:brightness-110 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                      Ver Planes
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/20">
                    {[
                      { block: '#449,121', date: '2024-05-20 14:32:01', action: 'Validación Final', hash: '882f...a12c', icon: <ShieldCheck size={16} /> },
                      { block: '#448,902', date: '2024-05-18 09:15:44', action: 'Actualización de Insumos', hash: '33a1...f902', icon: <Database size={16} /> },
                      { block: '#447,551', date: '2024-05-15 11:22:10', action: 'Ajuste de Rendimientos', hash: 'ee42...bb11', icon: <Cpu size={16} /> },
                      { block: '#445,001', date: '2024-05-10 16:45:33', action: 'Creación de Concepto', hash: '00a1...cc44', icon: <History size={16} /> }
                    ].map((item, idx) => (
                      <div key={item.block} className="relative">
                        <div className={cn(
                          "absolute -left-[25px] top-1 size-4 rounded-full border-2 border-primary z-10",
                          idx === 0 ? "bg-primary animate-pulse" : "bg-slate-900"
                        )}></div>
                        <div className="bg-slate-900 border border-white/5 rounded-xl p-5 shadow-sm hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-primary">{item.icon}</span>
                              <span className="text-sm font-bold text-white">{item.action}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Bloque</p>
                              <p className="text-xs font-mono text-slate-300">{item.block}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Hash</p>
                              <p className="text-xs font-mono text-slate-300">{item.hash}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 mb-8 bg-slate-900/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6 relative overflow-hidden group max-w-4xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-primary/20 p-3 rounded-lg border border-primary/40 flex items-center justify-center text-primary">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-white text-lg font-bold mb-1">Notas Técnicas de Ejecución</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 italic">
                  "La excavación debe realizarse siguiendo los niveles topográficos establecidos en plano. En caso de encontrar roca, se deberá reportar para ajuste de catálogo extraordinario. El costo incluye el acarreo libre hasta 20m."
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-800/50 px-3 py-1 rounded text-[10px] border border-slate-700 font-mono text-slate-300">Hash-ID: 882f...a12c</div>
                  <div className="bg-slate-800/50 px-3 py-1 rounded text-[10px] border border-slate-700 font-mono text-slate-300">Bloque: #449,121</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BlockchainBadge isVisible={status === 'verified'} />
    </motion.div>
  );
};
