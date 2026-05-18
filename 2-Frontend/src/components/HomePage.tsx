import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, CheckCircle2, Briefcase, Zap, Store, Coins, HelpCircle, BookOpen, X } from 'lucide-react';
import { AppHeader } from 'src/components/Common';
import { motion, AnimatePresence } from 'motion/react';

const MAIN_PRICES = [
  { id: 'PRE-001', title: "Concreto f'c=250 kg/cm2", price: "$2,450.00", unit: "m3", validations: 124, img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
  { id: 'CON-042', title: "Excavación manual material I", price: "$185.00", unit: "m3", validations: 89, img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80" },
  { id: 'MTL-089', title: "Viga IPR 12\" A-36", price: "$3,120.00", unit: "ml", validations: 210, img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80" },
  { id: 'EXT-015', title: "Pintura Vinílica Comex", price: "$95.00", unit: "m2", validations: 56, img: "https://images.unsplash.com/photo-1562664377-709f2c337eb2?auto=format&fit=crop&w=800&q=80" }
];

const PROFILES = [
  {
    icon: <Briefcase className="w-8 h-8 text-blue-500" />,
    title: "Profesionales",
    desc: "Audita y mejora matrices APU. Ejecuta auditorías de presupuestos con IA y detecta áreas de mejora.",
    color: "from-blue-600/20 to-blue-600/5",
    border: "border-blue-500/30 hover:border-blue-400"
  },
  {
    icon: <Zap className="w-8 h-8 text-red-500" />,
    title: "Constructores",
    desc: "Genera presupuestos de partidas en PDF por Prompt usando nuestra BBDD. Explora matrices e insumos rápido.",
    color: "from-red-600/20 to-red-600/5",
    border: "border-red-500/30 hover:border-red-400"
  },
  {
    icon: <Store className="w-8 h-8 text-blue-400" />,
    title: "Vendedores",
    desc: "Registra tu empresa, carga tus catálogos, ubicaciones y muestra disponibilidad por ciudad a la red AEC.",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30 hover:border-blue-400"
  }
];

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explorer?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-[#07070F]"
    >
      <AppHeader />
      
      {/* Glow background effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 flex flex-col items-center relative z-10">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-[1100px] px-6 py-20 flex flex-col items-center gap-10">
          <div className="text-center space-y-6 max-w-3xl">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-md mb-4"
            >
              <Zap size={14} className="text-blue-400" />
              <span className="text-slate-300 text-xs font-semibold tracking-widest uppercase">APUCMX Engine 2026</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]"
            >
              Precios <br/>
              <motion.span 
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{ backgroundSize: "200% auto" }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-red-500 to-blue-400 cursor-default"
              >
                validados con IA
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-lg md:text-xl font-light mx-auto leading-relaxed"
            >
              La base de precios unitarios más precisa de México. Audita, genera y consulta presupuestos de construcción utilizando inteligencia artificial en segundos.
            </motion.p>
          </div>

          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSearch} 
            className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 relative"
          >
            <div className="relative flex grow h-16 group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                <Search size={22} />
              </div>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full rounded-2xl border border-slate-700/50 bg-[#0F0F1A]/80 backdrop-blur-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder:text-slate-500 pl-16 pr-6 text-lg font-light shadow-2xl outline-none transition-all" 
                placeholder="Busca concreto, excavación, acero..." 
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-8 h-16 rounded-2xl font-bold tracking-wide hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2">
              Explorar <ArrowRight size={18} />
            </button>
          </motion.form>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <button 
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-950/80 to-slate-900/80 border border-blue-500/20 hover:border-red-500/40 rounded-2xl text-xs font-bold text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-red-950/20 backdrop-blur-md uppercase tracking-wider"
            >
              <HelpCircle size={14} className="text-red-500 animate-pulse" />
              <span>¿Cómo usar APUCMX? - Guía Interactiva</span>
            </button>
          </motion.div>
        </section>

        {/* 3 PERFILES (NUEVO REQUERIMIENTO) */}
        <section className="w-full max-w-[1100px] px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROFILES.map((profile, idx) => (
              <motion.div 
                key={idx}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className={`p-8 rounded-3xl bg-gradient-to-br ${profile.color} border ${profile.border} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="mb-6 bg-[#0F0F1A] w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                  {profile.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{profile.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{profile.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRECIOS PRINCIPALES VALIDADOS */}
        <section className="w-full max-w-[1100px] px-6 py-20">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-3">
                <ShieldCheck size={28} className="text-blue-400" />
                Catálogo normal
              </h2>
              <Link to="/explorer" className="text-slate-400 text-sm font-medium flex items-center gap-1 hover:text-blue-400 transition-colors">
                Ver catálogo completo <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MAIN_PRICES.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                >
                  <Link to="/detail" className="flex flex-col bg-[#0F0F1A]/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_40px_-15px_rgba(37,99,235,0.3)] transition-all group cursor-pointer">
                    <div className="w-full h-40 bg-slate-800 relative overflow-hidden">
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-black/60 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-md border border-blue-500/20">
                        <CheckCircle2 size={12} />
                        VALIDADO
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-red-500 text-[11px] font-bold uppercase tracking-widest">{item.id}</span>
                      </div>
                      <h3 className="text-white font-medium text-lg line-clamp-2 leading-snug h-12">{item.title}</h3>
                      <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-end">
                        <span className="text-white font-bold text-2xl tracking-tight">{item.price}</span>
                        <span className="text-[11px] text-slate-500 font-medium mb-1">MXN / {item.unit}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TOKENS BANNER (REPLACES MEMBERSHIP) */}
        <section className="w-full max-w-[1100px] px-6 py-10 mb-20">
          <div className="relative p-10 rounded-[2rem] bg-gradient-to-br from-[#0F172A] to-[#0F0F1A] border border-blue-500/20 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
                <Coins size={14} className="text-blue-400" />
                <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Pay as you go</span>
              </div>
              <h3 className="text-white font-black text-3xl md:text-4xl tracking-tight">Potencia tu trabajo con IA</h3>
              <p className="text-slate-400 text-lg leading-relaxed">Usa tus tokens APUCMX para auditar catálogos, generar presupuestos en PDF con inteligencia artificial y limpiar matrices automáticamente.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
              <Link 
                to="/tokens"
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold tracking-wide hover:bg-blue-500 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] transition-all whitespace-nowrap text-center"
              >
                Comprar Tokens
              </Link>
              <Link 
                to="/explorer" 
                className="bg-[#1A1A2E] text-white border border-white/10 px-8 py-4 rounded-2xl font-bold tracking-wide hover:bg-[#1E293B] transition-all whitespace-nowrap text-center"
              >
                Ver Catálogo
              </Link>
            </div>
          </div>
        </section>
        
      </main>

      <footer className="mt-auto py-12 border-t border-white/5 px-6 md:px-20 bg-[#07070F] text-center md:text-left relative z-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-blue-400" />
            <span className="text-slate-500 text-sm font-medium">© 2026 APUCMX. Plataforma inteligente AEC.</span>
          </div>
          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <button onClick={() => window.dispatchEvent(new Event('open-terms-modal'))} className="hover:text-white transition-colors">Términos</button>
            <button onClick={() => window.dispatchEvent(new Event('open-terms-modal'))} className="hover:text-white transition-colors">Privacidad</button>
            <button onClick={() => window.dispatchEvent(new Event('open-support-chat'))} className="hover:text-white transition-colors">Soporte</button>
          </div>
        </div>
      </footer>

      {/* ── Modal de Guía "Cómo usar APUCMX" ── */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-red-600 rounded-xl">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      Guía de Uso <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500 font-black">APUCMX</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">Domina la plataforma inteligente de precios unitarios AEC 2026.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGuideOpen(false)}
                  className="size-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Table Container */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#07070F]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0F0F1A]">
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">Sección / Módulo</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">Funcionalidad Clave</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-2/4">Instrucciones Paso a Paso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>1. EXPLORADOR APU</span>
                        </td>
                        <td className="p-4 text-blue-400 font-semibold">Base de Datos de Insumos y Conceptos</td>
                        <td className="p-4 leading-relaxed">
                          Ingresa al buscador, filtra por región (CDMX, Norte, etc.) y categoría. Haz clic en cualquier fila para abrir el panel técnico con desglose de mano de obra, materiales y maquinaria homologados a <span className="font-bold text-white">Abril 2026</span>.
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>2. ANÁLISIS IA (CONSTRUCTORES)</span>
                        </td>
                        <td className="p-4 text-red-400 font-semibold">Generador de Presupuestos PDF</td>
                        <td className="p-4 leading-relaxed">
                          Elige una plantilla de proyecto (ej: Residencial). Configura indirectos y escribe las partidas. La IA procesará mediante RAG/LangChain y compilará un <span className="font-bold text-white">presupuesto listo en PDF</span>. <span className="text-amber-400 font-semibold">Consumo: 10 tokens.</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>3. ANÁLISIS IA (PROFESIONALES)</span>
                        </td>
                        <td className="p-4 text-amber-400 font-semibold">Auditoría de Catálogos de Obra</td>
                        <td className="p-4 leading-relaxed">
                          Sube tu catálogo de conceptos en formato Excel o CSV. Selecciona una plantilla de auditoría (ej: precios fuera de mercado). La IA detectará desviaciones, mermas y FASAR en comparación con la base de datos Supabase. <span className="text-amber-400 font-semibold">Consumo: 10 tokens.</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>4. DIRECTORIO DE PROVEEDORES</span>
                        </td>
                        <td className="p-4 text-emerald-400 font-semibold">Registro de Catálogos & RFC</td>
                        <td className="p-4 leading-relaxed">
                          Los contratistas pueden registrarse con RFC oficial y subir su catálogo PDF por <span className="font-bold text-white">$100 MXN mensuales</span>. <span className="text-red-400 font-semibold">Regla estricta:</span> todos los insumos deben registrarse con <span className="font-bold underline text-white">precios unitarios sin IVA</span>.
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>5. BILLETERA DE TOKENS</span>
                        </td>
                        <td className="p-4 text-indigo-400 font-semibold">Recarga e Intercambio Seguro</td>
                        <td className="p-4 leading-relaxed">
                          Adquiere paquetes de tokens vía Stripe. Los tokens sirven para RAG de base de datos y chats. <span className="font-bold text-white">¡Novedad!</span> Ahora puedes transferir e intercambiar tokens de forma segura ingresando el email de otro usuario.
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span>6. CHATS E INSTANCIAS RAG</span>
                        </td>
                        <td className="p-4 text-cyan-400 font-semibold">Asistente Azul vs Soporte Rojo</td>
                        <td className="p-4 leading-relaxed">
                          El <span className="text-blue-400 font-bold">Asistente BD (Azul)</span> es inteligente y realiza consultas RAG a la base de datos de conceptos (<span className="text-amber-400">1 token por consulta</span>). El <span className="text-red-400 font-bold">Soporte Técnico (Rojo)</span> es libre y sirve únicamente para incidencias del sistema.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                  <Zap size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Formatos Homologados AEC obligatorios</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      Todas las descripciones ingresadas a la plataforma se normalizan automáticamente a <span className="text-white font-bold">MAYÚSCULAS</span> y las unidades se registran en <span className="text-white font-bold">minúsculas</span> (<span className="font-mono">pza, m2, ml, kg, kgf, m3, lote</span>) para garantizar consistencia nacional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold rounded-xl text-xs uppercase hover:brightness-110 transition-all"
                >
                  Entendido, Comenzar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
