import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Lock, User, Star, CheckCircle, ExternalLink, ArrowRight, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { AppHeader, MembershipTier } from './Common';
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

export const ProvidersPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [membership, setMembership] = useState<MembershipTier>((localStorage.getItem('membership') as MembershipTier) || 'gratis');

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setMembership((localStorage.getItem('membership') as MembershipTier) || 'gratis');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasAccess = isLoggedIn && membership !== 'gratis';
  const hasMembership = membership !== 'gratis';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen"
    >
      <AppHeader />
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Directorio de <span className="text-primary">Proveedores</span></h1>
              <p className="text-slate-400 font-medium">Conecta con los mejores proveedores de la industria de la construcción en México.</p>
            </div>
            <Link 
              to="/register-company"
              className="bg-primary hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Star size={18} />
              Registrar mi Empresa
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Filtros</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Categoría</label>
                    <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                      <option>Todos los materiales</option>
                      {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Ubicación</label>
                    <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                      <option>Toda la República</option>
                      {MEXICAN_STATES.map(state => <option key={state}>{state}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                <h4 className="text-primary font-bold mb-2 relative z-10">Membresía PRO</h4>
                <p className="text-slate-400 text-xs mb-4 relative z-10">Desbloquea datos de contacto directo, precios preferenciales y trato con fabricantes.</p>
                <button className="w-full bg-primary text-white py-2 rounded-lg text-xs font-bold relative z-10">Adquirir Membresía</button>
              </div>
            </aside>

            <div className="lg:col-span-3">
              {!isLoggedIn ? (
                <div className="bg-slate-900 border border-primary/20 rounded-2xl p-12 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                  <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6 relative z-10">
                    <Lock size={48} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight relative z-10">Acceso Restringido</h2>
                  <p className="text-slate-400 mb-8 leading-relaxed max-w-md relative z-10">
                    Para ver el catálogo de proveedores y sus datos de contacto, es necesario haber iniciado sesión.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm relative z-10">
                    <button 
                      onClick={() => {
                        localStorage.setItem('isLoggedIn', 'true');
                        window.location.reload();
                      }}
                      className="flex-1 bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <User size={18} />
                      Iniciar Sesión
                    </button>
                    <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-white/5">
                      Ver Planes
                    </button>
                  </div>
                </div>
              ) : membership === 'gratis' ? (
                <div className="bg-slate-900 border border-primary/20 rounded-2xl p-12 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                  <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6 relative z-10">
                    <Star size={48} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight relative z-10">Membresía Premium Requerida</h2>
                  <p className="text-slate-400 mb-8 leading-relaxed max-w-md relative z-10">
                    El directorio de proveedores es una herramienta exclusiva para usuarios Premium. Obtén acceso a datos de contacto directo y precios preferenciales.
                  </p>
                  <button 
                    onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                    className="bg-primary hover:brightness-110 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 relative z-10"
                  >
                    Actualizar a Premium ($250 MXN)
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { name: "Aceros de México S.A.", cat: "Aceros", loc: "Monterrey, NL", verified: true },
                    { name: "Concretos del Centro", cat: "Concretos", loc: "Querétaro, Qro", verified: true },
                    { name: "Iluminación Pro", cat: "Iluminación", loc: "CDMX", verified: false },
                    { name: "Tuberías Industriales", cat: "Tuberías", loc: "Guadalajara, Jal", verified: true }
                  ].map((prov, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                          <div className="size-16 bg-slate-800 rounded-xl flex items-center justify-center text-primary font-black text-xl">
                            {prov.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-bold text-lg">{prov.name}</h3>
                              {prov.verified && <ShieldCheck size={16} className="text-primary" />}
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{prov.cat}</span>
                              <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <MapPin size={12} />
                                <span>{prov.loc}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-center min-w-[200px]">
                          {!hasMembership ? (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                              <Lock size={16} className="text-slate-500 mx-auto mb-2" />
                              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Datos bloqueados</p>
                              <button className="text-primary text-xs font-bold hover:underline">Ver con Membresía</button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-slate-300 text-sm">
                                <Phone size={14} className="text-primary" />
                                <span>+52 (55) 1234-5678</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300 text-sm">
                                <Mail size={14} className="text-primary" />
                                <span>ventas@acerosmex.com</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};
