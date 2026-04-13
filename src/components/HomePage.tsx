import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppHeader } from './Common';
import { motion } from 'motion/react';

const MAIN_PRICES = [
  { id: 'PRE-001', title: "Concreto f'c=250 kg/cm2", price: "$2,450.00", unit: "m3", validations: 124, img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
  { id: 'CON-042', title: "Excavación manual material I", price: "$185.00", unit: "m3", validations: 89, img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80" },
  { id: 'MTL-089', title: "Viga IPR 12\" A-36", price: "$3,120.00", unit: "ml", validations: 210, img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80" },
  { id: 'EXT-015', title: "Pintura Vinílica Comex", price: "$95.00", unit: "m2", validations: 56, img: "https://images.unsplash.com/photo-1562664377-709f2c337eb2?auto=format&fit=crop&w=800&q=80" }
];

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explorer?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen"
    >
      <AppHeader />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1024px] px-6 py-12 flex flex-col gap-12">
          
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tight uppercase">Base de Precios Unitarios <span className="text-primary">Validada</span></h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Consulta precios unitarios validados por expertos para máxima transparencia y precisión.</p>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
            <label className="relative flex grow h-16 group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={24} />
              </div>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 focus:ring-2 focus:ring-primary/50 text-slate-100 placeholder:text-slate-500 pl-14 pr-4 text-xl font-normal shadow-2xl outline-none transition-all" 
                placeholder="Busca un concepto por descripción o código..." 
              />
            </label>
            <button type="submit" className="bg-primary text-white px-10 h-16 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20">
              Buscar
            </button>
          </form>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck size={24} className="text-primary" />
                Precios Principales Validados
              </h2>
              <Link to="/explorer" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Ver catálogo completo <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MAIN_PRICES.map(item => (
                <Link to="/detail" key={item.id} className="flex flex-col bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group cursor-pointer shadow-xl">
                  <div className="w-full h-40 bg-slate-800 relative overflow-hidden">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.dispatchEvent(new Event('open-validation-modal'));
                      }}
                      className="absolute top-3 right-3 bg-primary/90 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm hover:scale-105 transition-transform cursor-help"
                    >
                      <CheckCircle2 size={10} />
                      VALIDADO
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-primary text-[10px] font-black uppercase tracking-widest">{item.id}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{item.validations} Validaciones</span>
                    </div>
                    <h3 className="text-white font-bold text-base line-clamp-2 leading-tight h-10">{item.title}</h3>
                    <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-white font-black text-xl">{item.price}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">MXN / {item.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 size-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="flex flex-col gap-3 relative z-10">
              <h3 className="text-white font-black text-2xl uppercase tracking-tight">¿Necesitas una base personalizada?</h3>
              <p className="text-slate-400 text-base max-w-xl">Contamos con más de 15,000 conceptos actualizados semanalmente y validados por nuestra red de expertos.</p>
            </div>
            <div className="flex gap-4 relative z-10">
              <button 
                onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all whitespace-nowrap shadow-2xl"
              >
                Ver Planes
              </button>
              <Link to="/explorer" className="bg-slate-800 text-white border border-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all whitespace-nowrap shadow-2xl">
                Explorar Base
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-auto py-10 border-t border-white/5 px-6 md:px-20 bg-slate-950 text-center md:text-left">
        <div className="max-w-[1024px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-sm font-medium">© 2026 APUCMX. Plataforma inteligente de costos de construcción.</div>
          <div className="flex gap-8 text-slate-500 text-sm font-bold">
            <button 
              onClick={() => window.dispatchEvent(new Event('open-terms-modal'))}
              className="hover:text-primary transition-colors"
            >
              Términos
            </button>
            <button 
              onClick={() => window.dispatchEvent(new Event('open-terms-modal'))}
              className="hover:text-primary transition-colors"
            >
              Privacidad
            </button>
            <button 
              onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
              className="hover:text-primary transition-colors"
            >
              Soporte
            </button>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
