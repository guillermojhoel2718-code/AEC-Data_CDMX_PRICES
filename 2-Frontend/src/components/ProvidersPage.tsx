import React, { useState } from 'react';
import { AppHeader } from 'src/components/Common';
import { 
  Building2, Search, Filter, ShieldCheck, MapPin, Phone, 
  Mail, ExternalLink, PlusCircle, Check, X, Building,
  Truck, HardHat, Wrench, Award, Compass, Zap, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from 'src/lib/utils';
import { useAuth } from 'src/context/AuthContext';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  category: 'materiales' | 'acero' | 'maquinaria' | 'mano_obra' | 'subcontrato';
  categoryLabel: string;
  typicalProducts: string[];
  regions: string[];
  phone: string;
  email: string;
  website: string;
  rating: number;
  verified: boolean;
  featured: boolean;
  description: string;
}

// ─── Mock Data México Abril 2026 ──────────────────────────────────────────────

const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'p1',
    name: 'CEMEX MÉXICO S.A. DE C.V.',
    category: 'materiales',
    categoryLabel: 'Concreto & Agregados',
    typicalProducts: ['CONCRETO PREMEZCLADO F\'C 250 KG/CM2', 'CEMENTO PORTLAND GRIS OPC 40', 'ARENA Y GRAVA TRITURADA'],
    regions: ['CDMX', 'Norte', 'Bajio', 'Occidente', 'Sur'],
    phone: '+52 (81) 8328-3000',
    email: 'ventas@cemex.mx',
    website: 'https://www.cemexmexico.com',
    rating: 4.9,
    verified: true,
    featured: true,
    description: 'Líder nacional en suministro de cemento y concreto premezclado con monitoreo digital y baja huella de carbono Vertua.'
  },
  {
    id: 'p2',
    name: 'TERNIUM MÉXICO',
    category: 'acero',
    categoryLabel: 'Aceros & Estructuras',
    typicalProducts: ['VARILLA CORRUGADA R-42 3/8"', 'PERFILES ESTRUCTURALES IPR', 'MALLA ELECTROSOLDADA 6-6/10-10'],
    regions: ['Norte', 'Bajio', 'Occidente', 'CDMX'],
    phone: '+52 (81) 8865-7000',
    email: 'contacto@ternium.com.mx',
    website: 'https://mx.ternium.com',
    rating: 4.8,
    verified: true,
    featured: true,
    description: 'Principal productor de acero plano y largo en México, garantizando cumplimiento de normas ASTM y NMX vigentes.'
  },
  {
    id: 'p3',
    name: 'MADISA CATERPILLAR',
    category: 'maquinaria',
    categoryLabel: 'Maquinaria Pesada',
    typicalProducts: ['RETROEXCAVADORA CAT 416', 'EXCAVADORA HIDRÁULICA CAT 320', 'MOTOCONFORMADORA CAT 120'],
    regions: ['CDMX', 'Norte', 'Bajio', 'Occidente', 'Sur'],
    phone: '+52 (800) 228-7228',
    email: 'rentas@madisa.com',
    website: 'https://www.madisa.com',
    rating: 4.7,
    verified: true,
    featured: false,
    description: 'Distribuidor autorizado de Caterpillar en México. Venta, renta, servicio y refacciones de maquinaria pesada.'
  },
  {
    id: 'p4',
    name: 'HOLCIM MÉXICO',
    category: 'materiales',
    categoryLabel: 'Cemento & Concreto',
    typicalProducts: ['CEMENTO APASCO PREMIUM', 'CONCRETO ECOPACT F\'C 300 KG/CM2', 'MORTERO MAESTRO'],
    regions: ['Sur', 'Occidente', 'CDMX', 'Bajio'],
    phone: '+52 (55) 5724-0000',
    email: 'servicio.cliente@holcim.com',
    website: 'https://www.holcim.com.mx',
    rating: 4.8,
    verified: true,
    featured: false,
    description: 'Soluciones sostenibles de concreto e infraestructura con plantas de alta eficiencia y cobertura en el centro y sur del país.'
  },
  {
    id: 'p5',
    name: 'CUADRILLAS AEC CDMX',
    category: 'mano_obra',
    categoryLabel: 'Mano de Obra Certificada',
    typicalProducts: ['CUADRILLA DE ALBAÑILERÍA (1 OFICIAL + 2 PEONES)', 'CUADRILLA DE FIERREDOS Y CARPINTEROS', 'TOPÓGRAFO CON ESTACIÓN TOTAL'],
    regions: ['CDMX', 'Bajio'],
    phone: '+52 (55) 4321-8765',
    email: 'cuadrillas@apucmx.org',
    website: 'https://apucmx.org/cuadrillas',
    rating: 4.9,
    verified: true,
    featured: true,
    description: 'Sindicato de instaladores y subcontratistas homologados con prestaciones de ley y FASAR auditado para obras premium.'
  },
  {
    id: 'p6',
    name: 'INSTALACIONES ELECTROMECÁNICAS DEL BAJÍO',
    category: 'subcontrato',
    categoryLabel: 'Subcontratos Especiales',
    typicalProducts: ['SUMINISTRO E INSTALACIÓN DE SUBESTACIONES', 'REDES CONTRA INCENDIO NFPA', 'AIRE ACONDICIONADO HVAC'],
    regions: ['Bajio', 'Occidente', 'Norte'],
    phone: '+52 (442) 211-9000',
    email: 'proyectos@ie-bajio.com',
    website: 'https://www.ie-bajio.mx',
    rating: 4.6,
    verified: false,
    featured: false,
    description: 'Especialistas en montaje electromecánico industrial y comercial de mediana y alta tensión.'
  }
];

export const ProvidersPage = () => {
  const { isLoggedIn, profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeRegion, setActiveRegion] = useState<string>('todas');
  
  // Registration Form Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [rfc, setRfc] = useState('');
  const [category, setCategory] = useState<'materiales' | 'acero' | 'maquinaria' | 'mano_obra' | 'subcontrato'>('materiales');
  const [prodList, setProdList] = useState('');
  const [repName, setRepName] = useState('');
  const [regionInput, setRegionInput] = useState('CDMX');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [webInput, setWebInput] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const handleRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProvider: Provider = {
      id: `p-${Date.now()}`,
      name: companyName.toUpperCase(),
      category: category,
      categoryLabel: 
        category === 'materiales' ? 'Materiales & Suministros' :
        category === 'acero' ? 'Aceros & Perfiles' :
        category === 'maquinaria' ? 'Maquinaria Pesada' :
        category === 'mano_obra' ? 'Mano de Obra' : 'Subcontrato Especial',
      typicalProducts: prodList.split(',').map(p => p.trim().toUpperCase()).filter(Boolean),
      regions: [regionInput],
      phone: phoneInput || '+52 (55) 0000-0000',
      email: emailInput || 'contacto@empresa.com',
      website: webInput || 'https://empresa.com',
      rating: 5.0,
      verified: false, // Requiere auditoría de APUCMX
      featured: false,
      description: `Proveedor registrado por el usuario. RFC: ${rfc.toUpperCase()}. Representante: ${repName}.`
    };

    setProviders([newProvider, ...providers]);
    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      setIsRegisterModalOpen(false);
      // Reset Form
      setCompanyName('');
      setRfc('');
      setProdList('');
      setRepName('');
      setEmailInput('');
      setPhoneInput('');
      setWebInput('');
    }, 2500);
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.typicalProducts.some(pr => pr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
    const matchesRegion = activeRegion === 'todas' || p.regions.includes(activeRegion);
    
    return matchesSearch && matchesCategory && matchesRegion;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#07070F] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-10 py-10 space-y-10">
        
        {/* ── Banner/Header ── */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0F24] via-[#090915] to-[#07070F] border border-white/5 p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Building2 size={12} />
                <span>Directorio AEC 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                Proveedores y <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Fabricantes</span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed">
                Explora cotizaciones reales referenciadas a Abril 2026. Conéctate con proveedores validados por la red APUCMX con cumplimiento normativo mexicano.
              </p>
            </div>
            
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-cyan-950/40 hover:brightness-110 active:scale-95 transition-all text-sm uppercase shrink-0"
            >
              <PlusCircle size={18} />
              <span>Enlistarse como Proveedor</span>
            </button>
          </div>
        </div>

        {/* ── Controles de Filtros y Búsqueda ── */}
        <div className="bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="relative w-full lg:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar CEMEX, varilla, excavadora, concreto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#07070F] border border-white/5 hover:border-white/15 focus:border-cyan-500 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2 bg-[#07070F] border border-white/5 rounded-xl px-3.5 py-2">
              <Filter size={14} className="text-cyan-400" />
              <select 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer border-none p-0 focus:ring-0"
              >
                <option value="todos">Todas las Categorías</option>
                <option value="materiales">Materiales & Agregados</option>
                <option value="acero">Acero & Metales</option>
                <option value="maquinaria">Maquinaria Pesada</option>
                <option value="mano_obra">Mano de Obra</option>
                <option value="subcontrato">Subcontratos Especiales</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#07070F] border border-white/5 rounded-xl px-3.5 py-2">
              <MapPin size={14} className="text-cyan-400" />
              <select 
                value={activeRegion} 
                onChange={e => setActiveRegion(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer border-none p-0 focus:ring-0"
              >
                <option value="todas">Todas las Regiones</option>
                <option value="CDMX">CDMX</option>
                <option value="Norte">Norte (Mty / Tj)</option>
                <option value="Bajio">Bajío (Qro / Gto)</option>
                <option value="Occidente">Occidente (Gdl)</option>
                <option value="Sur">Sur</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Grid de Proveedores ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProviders.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={cn(
                  "group relative rounded-2xl bg-[#0F0F1A] border p-6 flex flex-col justify-between shadow-lg transition-all duration-300 hover:-translate-y-1",
                  p.featured 
                    ? "border-cyan-500/20 shadow-cyan-950/10 hover:border-cyan-500/40 hover:shadow-cyan-500/5 bg-gradient-to-b from-[#0F0F24] to-[#0F0F1A]" 
                    : "border-white/5 hover:border-white/15"
                )}
              >
                {/* Glow decorativo para destacados */}
                {p.featured && (
                  <div className="absolute top-0 right-10 w-24 h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full blur-[2px]" />
                )}

                <div className="space-y-4">
                  {/* Top line: Category and Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#18182E] text-cyan-400 border border-cyan-800/20">
                      {p.categoryLabel}
                    </span>
                    <div className="flex gap-1.5">
                      {p.verified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} />
                          <span>VALIDADO</span>
                        </span>
                      )}
                      {!p.verified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
                          <Clock size={10} />
                          <span>PTE AUDIT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Provider Name */}
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight line-clamp-1 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-[#8888AA] text-xs font-mono mt-1 flex items-center gap-1">
                      <MapPin size={10} className="text-slate-500" />
                      <span>Cobertura: {p.regions.join(', ')}</span>
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {p.description}
                  </p>

                  {/* Typical Products */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Insumos Homologados:</p>
                    <div className="flex flex-col gap-1">
                      {p.typicalProducts.slice(0, 3).map((prod, pidx) => (
                        <div key={pidx} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                          <span className="size-1 rounded-full bg-cyan-400" />
                          <span className="truncate uppercase">{prod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom line: Contact & Website */}
                <div className="border-t border-white/5 pt-4 mt-5 flex justify-between items-center text-xs">
                  <div className="flex gap-3 text-slate-400">
                    <a href={`tel:${p.phone}`} className="hover:text-white flex items-center gap-1 transition-colors">
                      <Phone size={12} />
                      <span>Llamar</span>
                    </a>
                    <a href={`mailto:${p.email}`} className="hover:text-white flex items-center gap-1 transition-colors">
                      <Mail size={12} />
                      <span>Escribir</span>
                    </a>
                  </div>
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-white font-bold transition-colors"
                  >
                    <span>Sitio Web</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProviders.length === 0 && (
            <div className="col-span-full py-16 text-center space-y-4 bg-[#0F0F1A] border border-white/5 rounded-2xl">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">No se encontraron proveedores que coincidan con la búsqueda.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('todos'); setActiveRegion('todas'); }}
                className="px-4 py-2 bg-[#07070F] border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal de Registro como Proveedor ── */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    Registrar <span className="text-primary">Empresa o Proveedor</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Enlista tu empresa en el directorio nacional APUCMX.</p>
                </div>
                <button 
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="size-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Success Banner */}
              {successMessage ? (
                <div className="p-8 text-center space-y-4">
                  <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30 w-fit mx-auto">
                    <Check size={32} className="text-emerald-400 mx-auto" />
                  </div>
                  <h3 className="text-white text-lg font-black uppercase">¡Registro Exitoso!</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Tu empresa se ha enlistado en borrador. Nuestro equipo auditará los precios y RFC antes de activar el sello <span className="text-emerald-400 font-bold">VALIDADO</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterCompany} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                  
                  {/* Company Name & RFC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Razón Social</label>
                      <input 
                        required 
                        type="text" 
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="CEMEX MÉXICO S.A." 
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">RFC Oficial (México)</label>
                      <input 
                        required 
                        type="text" 
                        value={rfc}
                        onChange={e => setRfc(e.target.value)}
                        placeholder="CEM010101ABC" 
                        maxLength={13}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Category & Region */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Categoría del Insumo</label>
                      <select 
                        value={category}
                        onChange={e => setCategory(e.target.value as any)}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                      >
                        <option value="materiales">Materiales y Concretos</option>
                        <option value="acero">Acero y Perfiles</option>
                        <option value="maquinaria">Maquinaria Pesada</option>
                        <option value="mano_obra">Cuadrillas / Mano de Obra</option>
                        <option value="subcontrato">Subcontratos y Especialistas</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Región Matriz</label>
                      <select 
                        value={regionInput}
                        onChange={e => setRegionInput(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                      >
                        <option value="CDMX">CDMX</option>
                        <option value="Norte">Norte</option>
                        <option value="Bajio">Bajío</option>
                        <option value="Occidente">Occidente</option>
                        <option value="Sur">Sur</option>
                      </select>
                    </div>
                  </div>

                  {/* Typical Products */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Insumos Clave (Separados por coma)</label>
                    <textarea 
                      required 
                      value={prodList}
                      onChange={e => setProdList(e.target.value)}
                      placeholder="Ej: Varilla de 3/8, Cemento Gris, Clavos de 2 pulgadas..."
                      rows={2}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>

                  {/* Representative & Web */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Representante Técnico</label>
                      <input 
                        required 
                        type="text" 
                        value={repName}
                        onChange={e => setRepName(e.target.value)}
                        placeholder="Ing. Carlos Slim" 
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sitio Web</label>
                      <input 
                        type="url" 
                        value={webInput}
                        onChange={e => setWebInput(e.target.value)}
                        placeholder="https://empresa.com" 
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Email de Ventas</label>
                      <input 
                        required 
                        type="email" 
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="ventas@empresa.com" 
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Teléfono de Atención</label>
                      <input 
                        required 
                        type="tel" 
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        placeholder="+52 (55) 1234-5678" 
                        className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs uppercase"
                  >
                    Enviar Registro a Auditoría APUCMX
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
