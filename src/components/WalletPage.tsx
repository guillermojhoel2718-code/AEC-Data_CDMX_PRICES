import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, History, ShieldCheck, ArrowUpRight, ArrowDownLeft, ExternalLink, Compass, Lock, User, Crown, FileText, Download, Trash2, Plus, Box, Edit3, X, Save } from 'lucide-react';
import { AppHeader, BlockchainBadge, MembershipTier } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const WalletPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [membership, setMembership] = useState<MembershipTier>((localStorage.getItem('membership') as MembershipTier) || 'gratis');
  const [userBalance, setUserBalance] = useState(() => {
    const saved = localStorage.getItem('apuc_balance');
    return saved ? parseInt(saved) : 12450;
  });

  const [myFamilies, setMyFamilies] = useState([
    { id: 1, name: 'Set de Mobiliario de Oficina Pro', price: 450, software: 'Revit 2023+' },
    { id: 2, name: 'Paquete de Luminarias Industriales', price: 320, software: 'Revit 2022+' },
  ]);

  const [editingFamily, setEditingFamily] = useState<any>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setMembership((localStorage.getItem('membership') as MembershipTier) || 'gratis');
      const saved = localStorage.getItem('apuc_balance');
      if (saved) setUserBalance(parseInt(saved));
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (!isLoggedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex flex-col min-h-screen"
      >
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-slate-900 border border-primary/20 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6">
                  <Lock size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Acceso Restringido</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  El apartado de "Mi Cartera" está reservado para usuarios registrados. Inicia sesión para gestionar tus créditos APUC y ver tu historial de recompensas blockchain.
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => {
                      localStorage.setItem('isLoggedIn', 'true');
                      window.location.reload();
                    }}
                    className="bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Iniciar Sesión
                  </button>
                  <Link 
                    to="/explorer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all"
                  >
                    Volver al Explorador
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BlockchainBadge isVisible={false} />
      </motion.div>
    );
  }

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
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Mi Cartera <span className="text-primary">APUC</span></h1>
              <p className="text-slate-400 font-medium">Gestiona tus activos digitales y recompensas por validación de red.</p>
            </div>
            <div className="flex gap-4">
              <button 
                disabled={membership === 'gratis'}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg",
                  membership === 'gratis' 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5" 
                    : "bg-primary hover:brightness-110 text-white shadow-primary/20"
                )}
              >
                <ArrowUpRight size={18} />
                Retirar Fondos
                {membership === 'gratis' && <Lock size={12} />}
              </button>
              <button 
                disabled={membership === 'gratis'}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border",
                  membership === 'gratis'
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border-white/5"
                    : "bg-slate-800 hover:bg-slate-700 text-white border-white/5"
                )}
              >
                <ArrowDownLeft size={18} />
                Recargar
                {membership === 'gratis' && <Lock size={12} />}
              </button>
            </div>
          </div>

          {membership === 'gratis' && (
            <div className="mb-10 bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                  <Crown size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Funciones Premium Bloqueadas</h4>
                  <p className="text-slate-400 text-sm">Para retirar o recargar fondos, es necesario contar con una membresía Premium.</p>
                </div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Actualizar Plan
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-primary/20 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet size={80} />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Balance Total</p>
                <h3 className="text-4xl font-black text-white mb-4">{userBalance.toLocaleString()}.00 <span className="text-lg font-normal text-slate-500">APUC</span></h3>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <TrendingUp size={16} />
                  <span>+12.5% este mes</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck size={80} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estatus de Nodo</p>
                <h3 className="text-2xl font-black text-white mb-4">Activo / Validando</h3>
                <div className="flex items-center gap-2 text-primary text-sm font-bold">
                  <Compass size={16} />
                  <span>Red Principal APUCMX</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Acciones Rápidas
              </h4>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Ver White Paper</span>
                  <ExternalLink size={14} className="text-slate-500" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Explorador de Bloques</span>
                  <ExternalLink size={14} className="text-slate-500" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">Soporte Técnico</span>
                  <ExternalLink size={14} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <History size={18} className="text-primary" />
                  Historial de Recompensas
                </h4>
                <button className="text-xs font-bold text-primary hover:underline">Ver todo</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                      <th className="px-8 py-4">Fecha</th>
                      <th className="px-8 py-4">Concepto</th>
                      <th className="px-8 py-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { date: '2024-05-20', concept: 'Validación APU-00124', amount: '+45.00', type: 'plus' },
                      { date: '2024-05-19', concept: 'Nodo Activo', amount: '+12.50', type: 'plus' },
                      { date: '2024-05-18', concept: 'Validación APU-00115', amount: '+38.20', type: 'plus' },
                    ].map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-slate-400 font-mono text-xs">{item.date}</td>
                        <td className="px-8 py-4 text-white font-bold">{item.concept}</td>
                        <td className={cn(
                          "px-8 py-4 text-right font-black",
                          item.type === 'plus' ? "text-emerald-400" : "text-red-400"
                        )}>{item.amount} APUC</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Box size={18} className="text-primary" />
                  Mis Familias BIM
                </h4>
                <Link to="/marketplace" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                  <Plus size={14} />
                  Subir Nueva
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {myFamilies.length > 0 ? myFamilies.map((family) => (
                  <div key={family.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Box size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white truncate max-w-[180px]">{family.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{family.software} • <span className="text-primary font-bold">{family.price} $APUC</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingFamily(family);
                          setNewPrice(family.price);
                        }}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                        title="Editar Precio"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('¿Estás seguro de que deseas dar de baja esta familia del mercado?')) {
                            setMyFamilies(prev => prev.filter(f => f.id !== family.id));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Dar de baja"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No tienes familias publicadas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Price Modal */}
      <AnimatePresence>
        {editingFamily && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setEditingFamily(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Editar <span className="text-primary">Precio</span></h2>
                <button onClick={() => setEditingFamily(null)} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Recurso</label>
                  <p className="text-white font-bold">{editingFamily.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nuevo Precio ($APUC)</label>
                  <div className="relative">
                    <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <input 
                      type="number" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:border-primary outline-none font-mono"
                      placeholder="Ej. 500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingFamily(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      setMyFamilies(prev => prev.map(f => f.id === editingFamily.id ? { ...f, price: newPrice } : f));
                      setEditingFamily(null);
                      alert('Precio actualizado correctamente.');
                    }}
                    className="flex-1 bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BlockchainBadge isVisible={true} />
    </motion.div>
  );
};
