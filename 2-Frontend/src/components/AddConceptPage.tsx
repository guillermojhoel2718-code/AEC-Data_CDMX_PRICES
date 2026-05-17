import React, { useState, useEffect, useMemo } from 'react';
import { AppHeader, MembershipTier } from 'src/components/Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from 'src/lib/utils';
import { 
  Plus, FileText, Database, Calculator, 
  AlertCircle, CheckCircle2, Lock, User, 
  ArrowRight, Info, Trash2, HardHat, 
  Truck, Settings, Percent, HelpCircle,
  ShieldCheck, Mail, Hash
} from 'lucide-react';
import { useConcepts } from 'src/context/ConceptContext';
import { useAuth } from 'src/context/AuthContext';

type TabType = 'general' | 'materiales' | 'mano-obra' | 'equipo' | 'subcontratos' | 'sobrecosto';

interface MaterialRow {
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

interface LaborRow {
  id: string;
  description: string;
  baseSalary: number;
  fsi: number;
  fasar: number;
  quantity: number;
}

interface EquipmentRow {
  id: string;
  description: string;
  costLab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fcActual: number;
}

interface SubcontractRow {
  id: string;
  description: string;
  unit: string;
  costLab: number;
  fletes: number;
  maniobra: number;
}

export const AddConceptPage = () => {
  const { addConcept } = useConcepts();
  const { user, profile, membership } = useAuth();
  const isLoggedIn = !!user;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showFasarCalc, setShowFasarCalc] = useState(false);
  const [selectedLaborId, setSelectedLaborId] = useState<string | null>(null);

  // Economic indicators from news
  const ECONOMIC_INDICATORS = {
    minWage: 248.93, // From NewsPage.tsx
    uma: 108.57,
    infonavit: 0.05,
    sar: 0.02,
    diasCalendario: 366,
    diasAguinaldo: 15,
    primaVacacional: 0.25,
    diasVacaciones: 12
  };

  const [generalData, setGeneralData] = useState({
    code: '',
    name: '',
    unit: '',
    region: 'CDMX',
    type: 'Albañilería'
  });

  // User Info (from Supabase profile)
  const userInfo = {
    name: profile?.full_name || user?.email?.split('@')[0] || 'Usuario',
    email: user?.email || '',
    nodeHash: user?.id ? `0x${user.id.replace(/-/g, '').substring(0, 40)}` : '0x0000000000000000000000000000000000000000',
    role: profile?.occupation || 'Validador',
  };

  // State for rows
  const [materials, setMaterials] = useState<MaterialRow[]>([
    { id: '1', code: 'MAT-01', description: '', unit: 'pza', costLab: 0, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1 }
  ]);
  const [labor, setLabor] = useState<LaborRow[]>([
    { id: '1', description: '', baseSalary: 0, fsi: 1.05, fasar: 1.75, quantity: 1 }
  ]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([
    { id: '1', description: '', costLab: 0, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1 }
  ]);
  const [subcontracts, setSubcontracts] = useState<SubcontractRow[]>([
    { id: '1', description: '', unit: 'pza', costLab: 0, fletes: 0, maniobra: 0 }
  ]);

  // Sobrecosto factors
  const [overcostFactors, setOvercostFactors] = useState({
    indirectoHonorarios: 5.0,
    indirectoDepreciacion: 2.0,
    indirectoServicios: 1.0,
    indirectoGastosOficina: 1.5,
    indirectoFletes: 0.5,
    indirectoCapacitacion: 0.2,
    indirectoSeguridad: 0.8,
    indirectoAuxiliares: 1.0,
    financiamiento: 2.0,
    utilidad: 10.0,
    cargosAdicionales: 0.5,
    imss: 2.0,
    seguros: 1.0
  });

  // Calculations
  const totals = useMemo(() => {
    const matTotal = materials.reduce((acc, m) => acc + (m.costLab + m.fletes + m.maniobra + m.almacenaje) * m.fcActual, 0);
    const labTotal = labor.reduce((acc, l) => acc + (l.baseSalary * l.fsi * l.fasar * l.quantity), 0);
    const eqTotal = equipment.reduce((acc, e) => acc + (e.costLab + e.fletes + e.maniobra + e.almacenaje) * e.fcActual, 0);
    const subTotal = subcontracts.reduce((acc, s) => acc + (s.costLab + s.fletes + s.maniobra), 0);
    
    const costoDirecto = matTotal + labTotal + eqTotal + subTotal;
    
    const indirectoTotalPct = overcostFactors.indirectoHonorarios + overcostFactors.indirectoDepreciacion + overcostFactors.indirectoServicios + 
                             overcostFactors.indirectoGastosOficina + overcostFactors.indirectoFletes + overcostFactors.indirectoCapacitacion + 
                             overcostFactors.indirectoSeguridad + overcostFactors.indirectoAuxiliares;
    
    const indirectoMonto = costoDirecto * (indirectoTotalPct / 100);
    const subtotal1 = costoDirecto + indirectoMonto;
    
    const financiamientoMonto = subtotal1 * (overcostFactors.financiamiento / 100);
    const subtotal2 = subtotal1 + financiamientoMonto;
    
    const utilidadMonto = subtotal2 * (overcostFactors.utilidad / 100);
    const subtotal3 = subtotal2 + utilidadMonto;
    
    const cargosAdicMonto = subtotal3 * (overcostFactors.cargosAdicionales / 100);
    const imssMonto = subtotal3 * (overcostFactors.imss / 100);
    const segurosMonto = subtotal3 * (overcostFactors.seguros / 100);
    
    const precioUnitarioFinal = subtotal3 + cargosAdicMonto + imssMonto + segurosMonto;

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
  }, [materials, labor, equipment, subcontracts, overcostFactors]);

  useEffect(() => {
    // No longer need localStorage listener - auth comes from AuthContext
  }, []); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addConcept({
        id: generalData.code || `NEW-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name: generalData.name || 'Nuevo Concepto Propuesto',
        price: `$ ${totals.precioUnitarioFinal.toFixed(2)}`,
        unit: generalData.unit || 'pza',
        region: generalData.region,
        status: 'pending',
        type: generalData.type,
        overhead: (totals.precioUnitarioFinal / (totals.costoDirecto || 1)).toFixed(4),
        materials,
        labor,
        equipment,
        subcontracts,
        overcostFactors
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting concept:', err);
      alert('Error al guardar el concepto. Intente de nuevo.');
    }
  };

  const addRow = (type: 'materials' | 'labor' | 'equipment' | 'subcontracts') => {
    const id = Math.random().toString(36).substr(2, 9);
    if (type === 'materials') setMaterials([...materials, { id, code: `MAT-0${materials.length + 1}`, description: '', unit: 'pza', costLab: 0, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1 }]);
    if (type === 'labor') setLabor([...labor, { id, description: '', baseSalary: 0, fsi: 1.05, fasar: 1.75, quantity: 1 }]);
    if (type === 'equipment') setEquipment([...equipment, { id, description: '', costLab: 0, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1 }]);
    if (type === 'subcontracts') setSubcontracts([...subcontracts, { id, description: '', unit: 'pza', costLab: 0, fletes: 0, maniobra: 0 }]);
  };

  const removeRow = (type: 'materials' | 'labor' | 'equipment' | 'subcontracts', id: string) => {
    if (type === 'materials') setMaterials(materials.filter(r => r.id !== id));
    if (type === 'labor') setLabor(labor.filter(r => r.id !== id));
    if (type === 'equipment') setEquipment(equipment.filter(r => r.id !== id));
    if (type === 'subcontracts') setSubcontracts(subcontracts.filter(r => r.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-slate-900 border border-primary/20 rounded-2xl p-10 shadow-2xl">
            <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6 inline-flex">
              <Lock size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Acceso Restringido</h2>
            <p className="text-slate-400 mb-8">Debes iniciar sesión para proponer nuevos conceptos a la red APUCMX.</p>
            <button 
              onClick={() => {
                window.dispatchEvent(new Event('open-auth-modal'));
              }}
              className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <User size={18} />
              Iniciar Sesión
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (membership === 'gratis') {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-slate-900 border border-primary/20 rounded-2xl p-10 shadow-2xl">
            <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6 inline-flex">
              <Calculator size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Membresía Requerida</h2>
            <p className="text-slate-400 mb-8">La publicación de nuevos conceptos y análisis detallados es una función exclusiva para miembros con plan Mensual o Anual.</p>
            <button 
              onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
              className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all"
            >
              Ver Planes de Membresía
            </button>
          </div>
        </main>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: Info },
    { id: 'materiales', label: 'Materiales', icon: Database },
    { id: 'mano-obra', label: 'Mano de Obra', icon: HardHat },
    { id: 'equipo', label: 'Equipo', icon: Truck },
    { id: 'subcontratos', label: 'Subcontratos', icon: Settings },
    { id: 'sobrecosto', label: 'Sobrecosto', icon: Percent },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Agregar <span className="text-primary">Concepto</span></h1>
              <p className="text-slate-400 font-medium">Registra los datos necesarios para realizar un análisis de precio unitario completo.</p>
            </div>
            
            {/* User Info Card */}
            <div className="bg-slate-900 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
              <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{userInfo.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                  <Mail size={10} />
                  <span className="truncate">{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-primary font-mono mt-0.5">
                  <Hash size={10} />
                  <span className="truncate">{userInfo.nodeHash.substring(0, 10)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="bg-primary/20 p-2 rounded-lg text-primary shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <span className="font-bold text-white">Nota importante:</span> El concepto estará en estado de <span className="text-primary font-bold">pendiente</span> hasta que sea validado por la red. Basado en estándares de análisis de precios unitarios.
              </p>
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                  <span className="font-bold">Nota:</span> Este precio puede ser modificado por precios de proveedores, mano de obra de la región u algún otro indicador diferente que haga variar el precio final.
                </p>
              </div>
            </div>
          </div>

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-12 text-center"
            >
              <div className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30 mb-6 inline-flex">
                <CheckCircle2 size={48} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">¡Propuesta Enviada!</h2>
              <p className="text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
                Tu concepto ha sido registrado exitosamente en la blockchain y se encuentra en espera de validación por la comunidad.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-xl transition-all border border-white/5"
              >
                Agregar otro concepto
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Tabs Navigation */}
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border",
                      activeTab === tab.id 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:border-white/10"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900 border border-white/5 rounded-2xl p-8"
                  >
                    {activeTab === 'general' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Código del Concepto</label>
                            <input required type="text" placeholder="Ej: HID-101" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all" value={generalData.code} onChange={(e) => setGeneralData({...generalData, code: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Partida</label>
                            <select className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all" value={generalData.type} onChange={(e) => setGeneralData({...generalData, type: e.target.value})}>
                              <option>Albañilería</option>
                              <option>Instalaciones Hidráulicas</option>
                              <option>Instalaciones Sanitarias</option>
                              <option>Instalaciones Eléctricas</option>
                              <option>Cimentación</option>
                              <option>Acabados</option>
                              <option>Estructura</option>
                              <option>Excavación</option>
                              <option>Terracerías</option>
                              <option>Preliminares</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción del Concepto</label>
                          <textarea required rows={4} placeholder="Describe detalladamente el concepto..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none" value={generalData.name} onChange={(e) => setGeneralData({...generalData, name: e.target.value})}></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unidad</label>
                            <input required type="text" placeholder="m2, m3, pza..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all" value={generalData.unit} onChange={(e) => setGeneralData({...generalData, unit: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Región</label>
                            <input required type="text" placeholder="CDMX, Norte..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all" value={generalData.region} onChange={(e) => setGeneralData({...generalData, region: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'materiales' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white font-bold uppercase text-sm tracking-widest">Listado de Materiales</h3>
                          <button 
                            type="button" 
                            onClick={() => addRow('materials')}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <Plus size={14} /> Agregar Fila
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Código</th>
                                <th className="pb-4">Descripción</th>
                                <th className="pb-4">Unidad</th>
                                <th className="pb-4">Costo LAB</th>
                                <th className="pb-4">Fletes</th>
                                <th className="pb-4">Maniobra</th>
                                <th className="pb-4">Almacenaje</th>
                                <th className="pb-4">Fc. Actual</th>
                                <th className="pb-4">Total</th>
                                <th className="pb-4"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {materials.map((row) => (
                                <tr key={row.id} className="border-b border-white/5">
                                  <td className="py-4 pr-2"><input type="text" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.code} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, code: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="text" className="w-full min-w-[150px] bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" placeholder="Nombre del material" value={row.description} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, description: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="text" className="w-12 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.unit} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, unit: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.costLab} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, costLab: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.fletes} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, fletes: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.maniobra} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, maniobra: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.almacenaje} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, almacenaje: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-2"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-[10px]" value={row.fcActual} onChange={(e) => setMaterials(materials.map(r => r.id === row.id ? {...r, fcActual: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 font-bold text-primary text-xs">$ {((row.costLab + row.fletes + row.maniobra + row.almacenaje) * row.fcActual).toFixed(2)}</td>
                                  <td className="py-4 text-right">
                                    <button type="button" onClick={() => removeRow('materials', row.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === 'mano-obra' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white font-bold uppercase text-sm tracking-widest">Análisis de Mano de Obra</h3>
                          <button 
                            type="button" 
                            onClick={() => addRow('labor')}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <Plus size={14} /> Agregar Fila
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Cuadrilla / Categoría</th>
                                <th className="pb-4">Salario Base</th>
                                <th className="pb-4">F.S.I.</th>
                                <th className="pb-4">FASAR</th>
                                <th className="pb-4">Sal. Integrado</th>
                                <th className="pb-4">Cantidad</th>
                                <th className="pb-4">Total</th>
                                <th className="pb-4">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labor.map((row) => (
                                <tr key={row.id} className="border-b border-white/5">
                                  <td className="py-4 pr-4"><input type="text" className="w-full bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" placeholder="Ej: Oficial Albañil" value={row.description} onChange={(e) => setLabor(labor.map(r => r.id === row.id ? {...r, description: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-24 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.baseSalary} onChange={(e) => setLabor(labor.map(r => r.id === row.id ? {...r, baseSalary: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.fsi} onChange={(e) => setLabor(labor.map(r => r.id === row.id ? {...r, fsi: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4">
                                    <div className="flex items-center gap-2">
                                      <input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.fasar} onChange={(e) => setLabor(labor.map(r => r.id === row.id ? {...r, fasar: parseFloat(e.target.value) || 0} : r))} />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setSelectedLaborId(row.id);
                                          setShowFasarCalc(true);
                                        }}
                                        className="text-primary hover:text-white transition-colors"
                                        title="Calcular FASAR"
                                      >
                                        <Calculator size={14} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-4 pr-4 font-mono text-xs text-slate-400">$ {(row.baseSalary * row.fsi * row.fasar).toFixed(2)}</td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.quantity} onChange={(e) => setLabor(labor.map(r => r.id === row.id ? {...r, quantity: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 font-bold text-primary">$ {(row.baseSalary * row.fsi * row.fasar * row.quantity).toFixed(2)}</td>
                                  <td className="py-4 text-right">
                                    <button type="button" onClick={() => removeRow('labor', row.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === 'equipo' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white font-bold uppercase text-sm tracking-widest">Equipo y Maquinaria (Costos Horarios)</h3>
                          <button 
                            type="button" 
                            onClick={() => addRow('equipment')}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <Plus size={14} /> Agregar Fila
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Equipo</th>
                                <th className="pb-4">Costo LAB</th>
                                <th className="pb-4">Fletes</th>
                                <th className="pb-4">Maniobra</th>
                                <th className="pb-4">Almacenaje</th>
                                <th className="pb-4">Fc. Act.</th>
                                <th className="pb-4">Costo</th>
                                <th className="pb-4"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipment.map((row) => (
                                <tr key={row.id} className="border-b border-white/5">
                                  <td className="py-4 pr-4"><input type="text" className="w-full bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" placeholder="Ej: Grúa HIAB" value={row.description} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, description: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-20 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.costLab} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, costLab: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.fletes} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, fletes: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.maniobra} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, maniobra: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.almacenaje} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, almacenaje: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.fcActual} onChange={(e) => setEquipment(equipment.map(r => r.id === row.id ? {...r, fcActual: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 font-bold text-primary">$ {((row.costLab + row.fletes + row.maniobra + row.almacenaje) * row.fcActual).toFixed(2)}</td>
                                  <td className="py-4 text-right">
                                    <button type="button" onClick={() => removeRow('equipment', row.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === 'subcontratos' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white font-bold uppercase text-sm tracking-widest">Subcontratos</h3>
                          <button 
                            type="button" 
                            onClick={() => addRow('subcontracts')}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <Plus size={14} /> Agregar Fila
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[600px]">
                            <thead>
                              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Descripción</th>
                                <th className="pb-4">Unidad</th>
                                <th className="pb-4">Costo LAB</th>
                                <th className="pb-4">Fletes</th>
                                <th className="pb-4">Maniobra</th>
                                <th className="pb-4">Total</th>
                                <th className="pb-4"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {subcontracts.map((row) => (
                                <tr key={row.id} className="border-b border-white/5">
                                  <td className="py-4 pr-4"><input type="text" className="w-full bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" placeholder="Ej: Galvanizado" value={row.description} onChange={(e) => setSubcontracts(subcontracts.map(r => r.id === row.id ? {...r, description: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="text" className="w-16 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.unit} onChange={(e) => setSubcontracts(subcontracts.map(r => r.id === row.id ? {...r, unit: e.target.value} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-24 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.costLab} onChange={(e) => setSubcontracts(subcontracts.map(r => r.id === row.id ? {...r, costLab: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-24 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.fletes} onChange={(e) => setSubcontracts(subcontracts.map(r => r.id === row.id ? {...r, fletes: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 pr-4"><input type="number" className="w-24 bg-slate-800 border border-white/5 rounded px-2 py-1 text-xs" value={row.maniobra} onChange={(e) => setSubcontracts(subcontracts.map(r => r.id === row.id ? {...r, maniobra: parseFloat(e.target.value) || 0} : r))} /></td>
                                  <td className="py-4 font-bold text-primary">$ {(row.costLab + row.fletes + row.maniobra).toFixed(2)}</td>
                                  <td className="py-4 text-right">
                                    <button type="button" onClick={() => removeRow('subcontracts', row.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === 'sobrecosto' && (
                      <div className="space-y-8">
                        <h3 className="text-white font-bold uppercase text-sm tracking-widest mb-4">Análisis, Cálculo e Integración de Sobrecosto</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          {/* Column 1: Indirect Costs */}
                          <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-primary/20">
                              <h4 className="text-primary text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-primary text-white size-5 rounded flex items-center justify-center text-[10px]">1</span>
                                Costo Indirecto
                              </h4>
                              <div className="space-y-3">
                                {[
                                  { label: '1.1 Honorarios, sueldos y prestaciones', key: 'indirectoHonorarios' },
                                  { label: '1.2 Depreciación, mantenimiento y rentas', key: 'indirectoDepreciacion' },
                                  { label: '1.3 Servicios Externos', key: 'indirectoServicios' },
                                  { label: '1.4 Gastos de Oficina', key: 'indirectoGastosOficina' },
                                  { label: '1.5 Fletes y Acarreos', key: 'indirectoFletes' },
                                  { label: '1.6 Capacitación', key: 'indirectoCapacitacion' },
                                  { label: '1.7 Seguridad e Higiene en Obra', key: 'indirectoSeguridad' },
                                  { label: '1.8 Trabajos Previos y Auxiliares', key: 'indirectoAuxiliares' },
                                ].map((item) => (
                                  <div key={item.key} className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] text-slate-400">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        className="w-16 bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white text-right" 
                                        value={overcostFactors[item.key as keyof typeof overcostFactors]} 
                                        onChange={(e) => setOvercostFactors({...overcostFactors, [item.key]: parseFloat(e.target.value) || 0})}
                                      />
                                      <span className="text-[10px] text-slate-600">%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Other Charges */}
                          <div className="space-y-6">
                            <div className="space-y-4">
                              {[
                                { id: '2', label: 'Cargo por Financiamiento', key: 'financiamiento' },
                                { id: '3', label: 'Cargo por Utilidad', key: 'utilidad' },
                                { id: '4', label: 'Cargos Adicionales', key: 'cargosAdicionales' },
                                { id: '5', label: 'Cierre de Obra ante el I.M.S.S.', key: 'imss' },
                                { id: '6', label: 'Seguros y Fianzas', key: 'seguros' },
                              ].map((item) => (
                                <div key={item.key} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                  <h4 className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="bg-slate-700 text-slate-300 size-5 rounded flex items-center justify-center text-[10px]">{item.id}</span>
                                    {item.label}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      className="w-16 bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white text-right" 
                                      value={overcostFactors[item.key as keyof typeof overcostFactors]} 
                                      onChange={(e) => setOvercostFactors({...overcostFactors, [item.key]: parseFloat(e.target.value) || 0})}
                                    />
                                    <span className="text-[10px] text-slate-600">%</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Summary Card */}
                            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Costo Directo (CD)</span>
                                <span className="text-white font-mono">$ {totals.costoDirecto.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Total Indirectos</span>
                                <span className="text-white font-mono">$ {totals.indirectoMonto.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Utilidad</span>
                                <span className="text-white font-mono">$ {totals.utilidadMonto.toFixed(2)}</span>
                              </div>
                              <div className="h-px bg-primary/20 my-2"></div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-black text-white uppercase tracking-tighter">Precio Unitario Final</span>
                                <span className="text-2xl font-black text-primary">$ {totals.precioUnitarioFinal.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">MXN</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {tabs.map((tab, idx) => (
                      <div key={tab.id} className={cn("size-2 rounded-full", activeTab === tab.id ? "bg-primary" : "bg-slate-800")} />
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" className="text-slate-500 hover:text-white font-bold text-sm transition-colors">Cancelar</button>
                    <button 
                      type="submit"
                      className="bg-primary hover:brightness-110 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Publicar Concepto
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* FASAR Calculator Modal */}
      <AnimatePresence>
        {showFasarCalc && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowFasarCalc(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/5 bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Calculator className="text-primary" size={24} />
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Calculadora de FASAR</h2>
                </div>
                <button onClick={() => setShowFasarCalc(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ArrowRight className="rotate-180" size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <Info size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Cálculo basado en la Ley del Seguro Social y el Reglamento de la Ley de Obras Públicas. 
                    Los indicadores económicos se actualizan automáticamente según las noticias del sector.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Indicadores Económicos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Salario Mínimo (Noticias)</span>
                        <span className="text-white font-mono">${ECONOMIC_INDICATORS.minWage}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">UMA Actual</span>
                        <span className="text-white font-mono">${ECONOMIC_INDICATORS.uma}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Infonavit</span>
                        <span className="text-white font-mono">{(ECONOMIC_INDICATORS.infonavit * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Días del Periodo</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Días Calendario</span>
                        <span className="text-white font-mono">{ECONOMIC_INDICATORS.diasCalendario}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Días de Aguinaldo</span>
                        <span className="text-white font-mono">{ECONOMIC_INDICATORS.diasAguinaldo}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Días de Vacaciones</span>
                        <span className="text-white font-mono">{ECONOMIC_INDICATORS.diasVacaciones}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Resultado del Análisis</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Factor de Salario Integrado (FSI)</p>
                      <p className="text-xl font-bold text-white">1.0452</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-primary uppercase font-bold">FASAR Calculado</p>
                      <p className="text-3xl font-black text-primary">1.7542</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (selectedLaborId) {
                      setLabor(labor.map(r => r.id === selectedLaborId ? {...r, fasar: 1.7542, fsi: 1.0452} : r));
                    }
                    setShowFasarCalc(false);
                  }}
                  className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                >
                  Aplicar Cálculo a la Matriz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
