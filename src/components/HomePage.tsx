import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ShieldCheck, CheckCircle2, Zap, FileText,
  Building2, BarChart3, Coins, Lock, Crown,
} from 'lucide-react';
import { AppHeader } from './Common';
import { motion } from 'motion/react';

// ─── Tipos de usuario ──────────────────────────────────────────────────────────

const USER_TIERS = [
  {
    id: 'profesional',
    icon: <Crown className="w-6 h-6 text-[#6366F1]" />,
    label: 'Profesional',
    badge: 'Con API Key',
    color: 'border-[#6366F1]/40 bg-[#6366F1]/5',
    badgeColor: 'bg-[#6366F1]/20 text-[#A5B4FC]',
    desc: 'Para arquitectos, ingenieros y constructores.',
    features: [
      { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: 'Acceso a matrices auditadas (50 matrices + 10k insumos)' },
      { icon: <BarChart3 className="w-4 h-4 text-emerald-400" />, text: 'Auditoría de presupuestos con IA (PDF/Excel) — 10 tokens' },
      { icon: <Zap className="w-4 h-4 text-emerald-400" />, text: 'Generar concepto APU por prompt o catálogo — 5 tokens' },
      { icon: <FileText className="w-4 h-4 text-emerald-400" />, text: 'API Key propia para integraciones' },
    ],
    cta: 'Explorar catálogo',
    route: '/explorer',
  },
  {
    id: 'no_profesional',
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    label: 'No Profesional',
    badge: 'Público',
    color: 'border-amber-500/40 bg-amber-500/5',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    desc: 'Para usuarios que necesitan estimados rápidos.',
    features: [
      { icon: <FileText className="w-4 h-4 text-amber-400" />, text: 'Presupuesto conceptual en PDF generado por IA' },
      { icon: <Search className="w-4 h-4 text-amber-400" />, text: 'Buscar matrices e insumos en el explorador (gratis)' },
      { icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />, text: 'Nota de estimado incluida en el PDF' },
    ],
    cta: 'Buscar insumos',
    route: '/insumos',
  },
  {
    id: 'vendedor',
    icon: <Building2 className="w-6 h-6 text-cyan-400" />,
    label: 'Vendedor / Proveedor',
    badge: '$100 MXN/mes',
    color: 'border-cyan-500/40 bg-cyan-500/5',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    desc: 'Para empresas que quieren visibilidad en la plataforma.',
    features: [
      { icon: <Building2 className="w-4 h-4 text-cyan-400" />, text: 'Registro de empresa con validación (ciudad, catálogo, disponibilidad)' },
      { icon: <BarChart3 className="w-4 h-4 text-cyan-400" />, text: 'Análisis de mercado vs otros proveedores con IA' },
      { icon: <FileText className="w-4 h-4 text-cyan-400" />, text: 'Publicar catálogo de precios y portafolio' },
    ],
    cta: 'Próximamente',
    route: null,
    disabled: true,
  },
];

// ─── Precios muestra ───────────────────────────────────────────────────────────

const SAMPLE_PRICES = [
  { id: 'PRE-001', title: "Concreto f'c=250 kg/cm2", price: '$2,450.00', unit: 'm3', validations: 124, img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80' },
  { id: 'CON-042', title: 'Excavación manual material I', price: '$185.00', unit: 'm3', validations: 89, img: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80' },
  { id: 'MTL-089', title: 'Viga IPR 12" A-36', price: '$3,120.00', unit: 'ml', validations: 210, img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
  { id: 'EXT-015', title: 'Pintura Vinílica Comex', price: '$95.00', unit: 'm2', validations: 56, img: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?auto=format&fit=crop&w=800&q=80' },
];

// ─── Componente ────────────────────────────────────────────────────────────────

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explorer?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1100px] px-6 py-12 flex flex-col gap-16">

          {/* Hero */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#A5B4FC] text-xs font-bold uppercase tracking-widest">
              <Coins className="w-3 h-3" /> Sistema de tokens · 50 gratis al registrarte
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight uppercase">
              Base de Precios Unitarios <span className="text-primary">AEC · CDMX 2026</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Matrices auditadas, insumos normalizados e IA para profesionales de la construcción.
              Sin blockchain por ahora — todo en Supabase.
            </p>
          </div>

          {/* Buscador */}
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

          {/* Tipos de usuario */}
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-white text-2xl font-bold tracking-tight">¿Cómo usas APUCMX?</h2>
              <p className="text-slate-500 text-sm">Elige tu perfil — todas las cuentas arrancan con 50 tokens de prueba</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {USER_TIERS.map((tier) => (
                <div key={tier.id} className={`rounded-2xl border p-6 flex flex-col gap-5 ${tier.color}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">{tier.icon}</div>
                      <div>
                        <p className="text-white font-bold text-sm">{tier.label}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.badgeColor}`}>{tier.badge}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">{tier.desc}</p>
                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="mt-0.5 flex-shrink-0">{f.icon}</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  {tier.disabled ? (
                    <div className="flex items-center gap-2 py-3 rounded-xl bg-slate-800/50 text-slate-500 text-xs font-bold justify-center border border-slate-700/50">
                      <Lock className="w-3 h-3" /> {tier.cta}
                    </div>
                  ) : (
                    <Link to={tier.route!} className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700/50">
                      {tier.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Tokens info */}
          <div className="rounded-2xl bg-gradient-to-br from-[#1A1A3E] to-[#0F0F2A] border border-[#6366F1]/20 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-7 h-7 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="text-white font-black text-xl">Sistema de Tokens APUCMX</h3>
                <p className="text-slate-400 text-sm mt-1">
                  $100 MXN = 100 tokens · Auditorías 10 tok · Generación APU 5 tok · Búsqueda gratis
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/tokens" className="bg-[#6366F1] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#4F51D9] transition-colors whitespace-nowrap shadow-lg shadow-[#6366F1]/20">
                Comprar Tokens
              </Link>
              <Link to="/insumos" className="bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors whitespace-nowrap">
                Ver Catálogo
              </Link>
            </div>
          </div>

          {/* Muestra de precios */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                Precios de Referencia · CDMX 2026
              </h2>
              <Link to="/explorer" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Ver catálogo <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SAMPLE_PRICES.map(item => (
                <Link to="/detail" key={item.id} className="flex flex-col bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group shadow-xl">
                  <div className="w-full h-36 bg-slate-800 relative overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 right-3 bg-primary/90 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                      <CheckCircle2 size={10} /> VALIDADO
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-primary text-[10px] font-black uppercase tracking-widest">{item.id}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{item.validations} val.</span>
                    </div>
                    <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">{item.title}</h3>
                    <div className="mt-1 pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-white font-black text-lg">{item.price}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">MXN / {item.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Nota V2 */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-center space-y-1">
            <p className="text-slate-400 text-xs">
              <span className="text-[#6366F1] font-bold">V2 (roadmap):</span> Token on-chain con OpenZeppelin + Arbitrum/Polygon. Validación comunitaria open-source. Por ahora todo opera en Supabase + Stripe.
            </p>
          </div>

        </div>
      </main>
      <footer className="mt-auto py-8 border-t border-white/5 px-6 bg-slate-950 text-center">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-sm">© 2026 APUCMX · Plataforma de costos de construcción · CDMX</div>
          <div className="flex gap-6 text-slate-500 text-sm font-bold">
            <button onClick={() => window.dispatchEvent(new Event('open-terms-modal'))} className="hover:text-primary transition-colors">Términos</button>
            <button onClick={() => window.dispatchEvent(new Event('open-terms-modal'))} className="hover:text-primary transition-colors">Privacidad</button>
            <button onClick={() => window.dispatchEvent(new Event('open-support-chat'))} className="hover:text-primary transition-colors">Soporte</button>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
