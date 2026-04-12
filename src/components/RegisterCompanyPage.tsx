import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Upload, ArrowRight, CheckCircle2, Globe, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { AppHeader } from './Common';
import { motion } from 'motion/react';

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", 
  "CDMX", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", 
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", 
  "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const CATEGORIES = [
  "Aceros", "Concretos", "Acabados", "Instalaciones Eléctricas", "Instalaciones Hidráulicas", 
  "Maquinaria Pesada", "Herramientas", "Pinturas", "Impermeabilizantes", "Maderas", "Vidrios", 
  "Aluminio", "Pre-fabricados", "Tuberías", "Iluminación"
];

export const RegisterCompanyPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    rfc: '',
    category: '',
    state: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    logo: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
    } else {
      // Logic to save company registration
      alert('Solicitud de registro enviada con éxito. Nuestro equipo validará la información en las próximas 24-48 horas.');
      navigate('/providers');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-slate-950"
    >
      <AppHeader />
      <main className="flex-1 flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">Registro de <span className="text-primary">Proveedores</span></h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Únete a la red más grande de proveedores certificados en la industria de la construcción. Tu empresa será validada en blockchain para máxima confianza.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Benefits */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl">
                <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Beneficios de ser Proveedor</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Certificación Blockchain</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">Tu empresa contará con un sello de autenticidad inmutable en la red.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Alcance Nacional</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">Exposición directa ante miles de constructores y analistas de costos.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Gestión de Cotizaciones</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">Recibe solicitudes de cotización directamente en tu panel de control.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl"></div>
                <h4 className="text-primary font-bold mb-2 relative z-10">¿Eres Fabricante?</h4>
                <p className="text-slate-400 text-xs mb-4 relative z-10">Contamos con planes especiales para fabricantes con integración directa en las matrices de precios unitarios.</p>
                <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1 relative z-10">
                  Contactar Soporte <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative">
                <div className="flex items-center gap-4 mb-10">
                  <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all", step === 1 ? "bg-primary text-white" : "bg-emerald-500 text-white")}>
                    {step === 1 ? '1' : <CheckCircle2 size={16} />}
                  </div>
                  <div className="h-px w-12 bg-slate-800"></div>
                  <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all", step === 2 ? "bg-primary text-white" : "bg-slate-800 text-slate-500")}>
                    2
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paso {step} de 2</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={12} /> Nombre de la Empresa
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all" 
                            placeholder="Ej. Aceros de México S.A." 
                            value={formData.companyName}
                            onChange={e => setFormData({...formData, companyName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={12} /> RFC / Tax ID
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all" 
                            placeholder="ABC123456XYZ" 
                            value={formData.rfc}
                            onChange={e => setFormData({...formData, rfc: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría Principal</label>
                          <select 
                            required
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          >
                            <option value="">Seleccionar categoría</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ubicación (Estado)</label>
                          <select 
                            required
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value})}
                          >
                            <option value="">Seleccionar estado</option>
                            {MEXICAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción de la Empresa</label>
                        <textarea 
                          rows={4}
                          className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all resize-none" 
                          placeholder="Cuéntanos sobre tus productos y servicios..."
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={12} /> Correo de Ventas
                          </label>
                          <input 
                            required
                            type="email" 
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all" 
                            placeholder="ventas@empresa.com" 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Phone size={12} /> Teléfono de Contacto
                          </label>
                          <input 
                            required
                            type="tel" 
                            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all" 
                            placeholder="+52 (55) 0000-0000" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={12} /> Sitio Web (Opcional)
                        </label>
                        <input 
                          type="url" 
                          className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all" 
                          placeholder="https://www.empresa.com" 
                          value={formData.website}
                          onChange={e => setFormData({...formData, website: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logotipo de la Empresa</label>
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/40 transition-all cursor-pointer bg-slate-800/30 group">
                          <div className="size-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                            <Upload size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-white font-bold">Haz clic para subir o arrastra</p>
                            <p className="text-[10px] text-slate-500 uppercase mt-1">PNG, JPG hasta 5MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 flex gap-4">
                    {step === 2 && (
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                      >
                        Atrás
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="flex-1 bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {step === 1 ? 'Siguiente Paso' : 'Finalizar Registro'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
