import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Filter, Star, Download, 
  Plus, Box, Layers, Cpu, Layout, ArrowRight,
  CheckCircle2, Lock, Wallet, Info, X
} from 'lucide-react';
import { AppHeader, BlockchainBadge } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Fuse from 'fuse.js';

const FAMILIES = [
  { id: 1, name: "Set de Mobiliario de Oficina Pro", category: "Mobiliario", price: 450, rating: 4.9, downloads: 124, author: "ArchDesign", software: "Revit 2023+" },
  { id: 2, name: "Paquete de Luminarias Industriales", category: "Iluminación", price: 320, rating: 4.7, downloads: 89, author: "LightMaster", software: "Revit 2022+" },
  { id: 3, name: "Sistemas de Aire Acondicionado HVAC", category: "Instalaciones", price: 580, rating: 4.8, downloads: 215, author: "MEP_Expert", software: "Revit 2024" },
  { id: 4, name: "Colección de Puertas de Seguridad", category: "Carpintería", price: 280, rating: 4.6, downloads: 56, author: "SafeBuild", software: "Revit 2021+" },
  { id: 5, name: "Familias de Cocina Integral Modular", category: "Mobiliario", price: 650, rating: 5.0, downloads: 342, author: "InteriorPro", software: "Revit 2023+" },
  { id: 6, name: "Set de Vegetación Regional México", category: "Paisajismo", price: 150, rating: 4.5, downloads: 178, author: "EcoBIM", software: "Revit / Rhino" },
];

export const MarketplacePage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userBalance, setUserBalance] = useState(() => {
    const saved = localStorage.getItem('apuc_balance');
    return saved ? parseInt(saved) : 12450;
  });

  const fuse = useMemo(() => new Fuse(FAMILIES, {
    keys: ['name', 'category', 'author', 'software'],
    threshold: 0.3,
  }), []);

  const filteredFamilies = useMemo(() => {
    if (!searchQuery) return FAMILIES;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  useEffect(() => {
    localStorage.setItem('apuc_balance', userBalance.toString());
    window.dispatchEvent(new Event('storage'));
  }, [userBalance]);

  const handlePurchase = () => {
    if (selectedResource) {
      if (userBalance >= selectedResource.price) {
        setUserBalance(prev => prev - selectedResource.price);
        alert(`¡Recurso "${selectedResource.name}" adquirido con éxito!`);
        setSelectedResource(null);
      } else {
        alert('Saldo insuficiente en $APUC.');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-slate-950"
    >
      <AppHeader />
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">BIM Marketplace</span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">• Beta</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Mercado de <span className="text-primary">Recursos BIM</span></h1>
              <p className="text-slate-400 font-medium">Adquiere familias, plantillas y software de modelado usando tus tokens <span className="text-primary font-bold">$APUC</span>.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-slate-900 border border-primary/30 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Wallet size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tu Balance</p>
                  <p className="text-xl font-black text-white">{userBalance.toLocaleString()} <span className="text-primary">$APUC</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-primary hover:brightness-110 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs h-full"
              >
                <Plus size={18} />
                Subir mi Familia
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar familias, texturas, scripts..."
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-primary outline-none transition-all shadow-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <button className="w-full h-full bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-white hover:border-primary/30 transition-all font-bold uppercase tracking-widest text-xs">
                <Filter size={18} />
                Filtros Avanzados
              </button>
            </div>
          </div>

          {/* Categories Quick Links */}
          <div className="flex flex-wrap gap-3 mb-12">
            {["Todos", "Mobiliario", "Instalaciones", "Estructura", "Vegetación", "Texturas", "Scripts Dynamo"].map((cat) => (
              <button key={cat} className="px-6 py-2.5 bg-slate-900 border border-white/5 rounded-full text-xs font-bold text-slate-400 hover:text-white hover:border-primary/40 transition-all uppercase tracking-widest">
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFamilies.map((item) => (
              <motion.div 
                key={item.id}
                layout
                whileHover={{ y: -5 }}
                className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-primary/30 transition-all shadow-2xl"
              >
                <div className="aspect-video bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                    <Box size={12} className="text-primary" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{item.software}</span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">{item.category}</span>
                  </div>
                  {/* Placeholder for preview image */}
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Layout size={48} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                  </div>
                  <p className="text-slate-500 text-xs mb-4">Por <span className="text-slate-300 font-bold">{item.author}</span></p>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold">{item.rating}</span>
                      <span className="text-slate-600 text-xs font-medium">({item.downloads})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <Wallet size={14} />
                      <span className="text-sm font-black tracking-tight">{item.price} $APUC</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedResource(item)}
                    className="w-full bg-slate-800 hover:bg-primary text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs group-hover:shadow-lg group-hover:shadow-primary/20"
                  >
                    <Download size={16} />
                    Adquirir Recurso
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Subir <span className="text-primary">Recurso BIM</span></h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gana $APUC compartiendo tu conocimiento</p>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Recurso</label>
                    <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none" placeholder="Ej. Familia de Ventana Doble" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Software / Versión</label>
                    <select className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none">
                      <option>Revit 2024</option>
                      <option>Revit 2023</option>
                      <option>Revit 2022</option>
                      <option>Rhino / Grasshopper</option>
                      <option>AutoCAD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</label>
                    <select className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none">
                      <option>Mobiliario</option>
                      <option>Estructura</option>
                      <option>Instalaciones</option>
                      <option>Arquitectura</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Precio Sugerido ($APUC)</label>
                    <input type="number" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none" placeholder="Ej. 250" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción del Recurso</label>
                  <textarea rows={4} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none resize-none" placeholder="Describe las características técnicas, parámetros y uso del recurso..."></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Archivo (.rfa, .rvt, .zip)</label>
                    <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-all cursor-pointer bg-slate-800/30">
                      <Download size={20} className="text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Subir Archivo</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imagen de Previsualización</label>
                    <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-all cursor-pointer bg-slate-800/30">
                      <Layout size={20} className="text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Subir Imagen</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
                  <Info size={18} className="text-primary shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Al subir un recurso, garantizas que eres el autor original o posees los derechos de distribución. APUCMX retendrá una comisión del 5% en $APUC por cada transacción para el mantenimiento de la red.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-slate-800/50 border-t border-white/5">
                <button 
                  onClick={() => {
                    alert('Recurso enviado para validación técnica. Se te notificará cuando esté disponible en el mercado.');
                    setIsUploadModalOpen(false);
                  }}
                  className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                >
                  Registrar y Publicar Familia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Confirmar <span className="text-primary">Adquisición</span></h2>
                <button onClick={() => setSelectedResource(null)} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Recurso:</span>
                    <span className="text-white font-bold text-sm">{selectedResource.name}</span>
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Balance Actual:</span>
                    <span className="text-white font-mono">{userBalance.toLocaleString()} $APUC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Costo Recurso:</span>
                    <span className="text-primary font-mono">-{selectedResource.price.toLocaleString()} $APUC</span>
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white text-sm font-black uppercase tracking-widest">Balance Final:</span>
                    <span className={cn(
                      "text-xl font-black font-mono",
                      (userBalance - selectedResource.price) >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {(userBalance - selectedResource.price).toLocaleString()} $APUC
                    </span>
                  </div>
                </div>

                {userBalance < selectedResource.price && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
                    <Info size={18} className="text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-400 leading-relaxed font-bold uppercase">
                      Saldo insuficiente. Necesitas {(selectedResource.price - userBalance).toLocaleString()} $APUC adicionales para esta compra.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedResource(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={userBalance < selectedResource.price}
                    onClick={handlePurchase}
                    className="flex-1 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                  >
                    Confirmar Compra
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BlockchainBadge />
    </motion.div>
  );
};
