/**
 * NavHeader.tsx — Header limpio APUCMX V1
 * Solo rutas activas: Inicio, Explorador, Insumos, Comparador, Tokens
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Construction, User, HelpCircle, Bell, Menu, X, LogOut,
  Code, Package, BarChart3, Coins, Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',           label: 'Inicio',      icon: <Globe size={15} /> },
  { to: '/explorer',   label: 'Explorador',  icon: <Code size={15} /> },
  { to: '/insumos',    label: 'Insumos',     icon: <Package size={15} /> },
  { to: '/providers',  label: 'Proveedores', icon: <Package size={15} /> },
  { to: '/analysis',   label: 'Análisis IA', icon: <BarChart3 size={15} /> },
  { to: '/comparator', label: 'Comparador',  icon: <BarChart3 size={15} /> },
  { to: '/tokens',     label: 'Tokens',      icon: <Coins size={15} /> },
];

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-white/5'}`}>
      {label}
    </Link>
  );
};

export const NavHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await signOut(); setMenuOpen(false); navigate('/'); };

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-700/30 px-6 md:px-10 py-4 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 text-primary">
            <div className="size-8 flex items-center justify-center bg-primary text-white rounded-lg"><Construction size={20} /></div>
            <h2 className="text-white text-xl font-bold leading-tight tracking-tight">APUCMX</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map(n => <NavLink key={n.to} to={n.to} label={n.label} />)}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(p => !p)} className="md:hidden flex items-center justify-center rounded-lg h-10 w-10 bg-slate-800/50 border border-slate-700/50 text-slate-100 hover:bg-primary/20 transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-800/50 border border-slate-700/50 text-slate-100 hover:bg-primary/20 transition-colors">
            <HelpCircle size={18} />
          </button>

          {/* Avatar dropdown */}
          <div className="relative">
            <div onClick={() => setMenuOpen(p => !p)}
              className="bg-primary/20 border border-primary/30 rounded-full size-10 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all">
              <User size={20} className={user ? 'text-primary' : 'text-slate-500'} />
            </div>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  {!user ? (
                    <button onClick={() => { window.dispatchEvent(new Event('open-auth-modal')); setMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-primary hover:brightness-110 rounded-lg font-bold text-left">
                      <User size={16} /> Iniciar sesión
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-2 mb-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuario Activo</p>
                        {profile?.full_name && <p className="text-xs text-slate-400 font-medium truncate">{profile.full_name}</p>}
                        <p className="text-sm font-bold text-white truncate">{user.email}</p>
                      </div>
                      <div className="h-px bg-slate-800 mb-1" />
                    </>
                  )}
                  {NAV.slice(1).map(n => (
                    <button key={n.to} onClick={() => { navigate(n.to); setMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left">
                      <span className="text-primary">{n.icon}</span> {n.label}
                    </button>
                  ))}
                  {user && (
                    <>
                      <div className="h-px bg-slate-800 my-1" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                        <LogOut size={16} /> Cerrar sesión
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-700 overflow-hidden sticky top-[73px] z-40">
            <div className="p-4 flex flex-col gap-2">
              {NAV.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                  <span className="text-primary">{n.icon}</span> {n.label}
                </Link>
              ))}
              <div className="h-px bg-slate-800 my-1" />
              {!user
                ? <button onClick={() => { window.dispatchEvent(new Event('open-auth-modal')); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-slate-800 rounded-lg">
                    <User size={16} /> Iniciar Sesión
                  </button>
                : <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 bg-red-500/10 rounded-lg">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
