import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Construction, Bell, Settings, User, Search, ChevronDown, 
  FileText, LogOut, HelpCircle, Code, Wallet, ShieldCheck,
  CreditCard, Zap, Crown, Check, X, MessageSquare, Send,
  Lock, Mail, Eye, EyeOff, Shield, Globe, Building2, Briefcase,
  Smartphone, CreditCard as CardIcon, Landmark, QrCode, Menu,
  ShoppingBag, Plus, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, MembershipTier as AuthMembershipTier } from 'src/context/AuthContext';

export type MembershipTier = 'gratis' | 'mensual' | 'anual' | 'creador';
// Re-export from AuthContext for backward compat
export type { AuthMembershipTier };

export const AppHeader = () => {
  const navigate = useNavigate();
  const { user, profile, membership, signOut } = useAuth();
  const isLoggedIn = !!user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isValidatedModalOpen, setIsValidatedModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    const handleOpenNewPost = () => setIsNewPostModalOpen(true);
    const handleOpenRegisterCompany = () => navigate('/register-company');
    const handleOpenSupport = () => setIsSupportOpen(true);
    const handleOpenTerms = () => setIsTermsModalOpen(true);
    const handleOpenValidation = () => setIsValidatedModalOpen(true);
    
    window.addEventListener('open-auth-modal', handleOpenAuth);
    window.addEventListener('open-new-post-modal', handleOpenNewPost);
    window.addEventListener('open-register-company-modal', handleOpenRegisterCompany);
    window.addEventListener('open-support-chat', handleOpenSupport);
    window.addEventListener('open-terms-modal', handleOpenTerms);
    window.addEventListener('open-validation-modal', handleOpenValidation);
    
    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('open-new-post-modal', handleOpenNewPost);
      window.removeEventListener('open-register-company-modal', handleOpenRegisterCompany);
      window.removeEventListener('open-support-chat', handleOpenSupport);
      window.removeEventListener('open-terms-modal', handleOpenTerms);
      window.removeEventListener('open-validation-modal', handleOpenValidation);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-700/30 px-6 md:px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 text-primary">
            <div className="size-8 flex items-center justify-center bg-primary text-white rounded-lg">
              <Construction size={20} />
            </div>
            <h2 className="text-white text-xl font-bold leading-tight tracking-tight">APUCMX</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" label="Inicio" />
            <NavLink to="/explorer" label="Explorador" />
            <NavLink to="/insumos" label="Insumos" />
            <NavLink to="/comparator" label="Comparador" />
            <NavLink to="/tokens" label="Tokens" />
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden flex items-center justify-center rounded-lg h-10 w-10 bg-slate-800/50 border border-slate-700/50 text-slate-100 hover:bg-primary/20 transition-colors"
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button 
            onClick={() => navigate('/tokens')}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
              membership === 'gratis' ? "bg-slate-800/50 border-white/5 text-slate-400" : 
              membership === 'mensual' ? "bg-primary/10 border-primary/30 text-primary" :
              "bg-amber-500/10 border-amber-500/30 text-amber-500"
            )}
          >
            {membership === 'gratis' ? <Zap size={12} /> : membership === 'mensual' ? <Crown size={12} /> : <ShieldCheck size={12} />}
            <span className="text-[10px] font-bold tracking-widest uppercase">{membership}</span>
          </button>
          
          <div className="flex gap-2">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-800/50 border border-slate-700/50 text-slate-100 hover:bg-primary/20 transition-colors">
              <Bell size={18} />
            </button>
            <button 
              onClick={() => setIsSupportOpen(true)}
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-800/50 border border-slate-700/50 text-slate-100 hover:bg-primary/20 transition-colors"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <div className="relative">
            <div 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-primary/20 border border-primary/30 rounded-full size-10 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all"
            >
              <User size={20} className={cn("transition-colors", isLoggedIn ? "text-primary" : "text-slate-500")} />
            </div>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  {!isLoggedIn ? (
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-primary hover:brightness-110 rounded-lg transition-colors text-left font-bold"
                    >
                      <User size={16} />
                      <span>Iniciar sesión</span>
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-2 mb-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuario Activo</p>
                        {profile?.full_name && <p className="text-xs text-slate-400 font-medium truncate">{profile.full_name}</p>}
                        <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                      </div>
                      <div className="h-px bg-slate-800 mb-1"></div>
                    </>
                  )}
                  
                  <button 
                    onClick={() => { navigate('/tokens'); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left"
                  >
                    <CreditCard size={16} className="text-primary" />
                    <span>Membresías y Tokens</span>
                  </button>
                  <button 
                    onClick={() => { setIsSupportOpen(true); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left"
                  >
                    <HelpCircle size={16} className="text-primary" />
                    <span>Soporte Técnico</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/explorer'); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left"
                  >
                    <Code size={16} className="text-primary" />
                    <span>Explorador APU</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/insumos'); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left"
                  >
                    <ShoppingBag size={16} className="text-primary" />
                    <span>Insumos</span>
                  </button>
                  
                  {isLoggedIn && (
                    <>
                      <div className="h-px bg-slate-800 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Cerrar sesión</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-700 overflow-hidden sticky top-[73px] z-40"
          >
            <div className="p-4 flex flex-col gap-2">
              <MobileNavLink to="/" label="Inicio" icon={<Globe size={16} />} onClick={() => setIsMobileNavOpen(false)} />
              <MobileNavLink to="/explorer" label="Explorador" icon={<Code size={16} />} onClick={() => setIsMobileNavOpen(false)} />
              <MobileNavLink to="/insumos" label="Insumos" icon={<ShoppingBag size={16} />} onClick={() => setIsMobileNavOpen(false)} />
              <MobileNavLink to="/comparator" label="Comparador" icon={<FileText size={16} />} onClick={() => setIsMobileNavOpen(false)} />
              
              <div className="h-px bg-slate-800 my-2"></div>
              
              <button 
                onClick={() => { navigate('/tokens'); setIsMobileNavOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-bold bg-primary/10 rounded-lg"
              >
                <Crown size={16} />
                <span>Tokens APUCMX</span>
              </button>
              
              {!isLoggedIn ? (
                <button 
                  onClick={() => { setIsAuthModalOpen(true); setIsMobileNavOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-slate-800 rounded-lg"
                >
                  <User size={16} />
                  <span>Iniciar Sesión</span>
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 bg-red-500/10 rounded-lg"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <MembershipModal isOpen={isMembershipModalOpen} onClose={() => setIsMembershipModalOpen(false)} />
      <SupportChat isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <NewPostModal isOpen={isNewPostModalOpen} onClose={() => setIsNewPostModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <ValidationExplanationModal isOpen={isValidatedModalOpen} onClose={() => setIsValidatedModalOpen(false)} />
    </>
  );
};

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
        isActive 
          ? "bg-primary text-white shadow-lg shadow-primary/20" 
          : "text-slate-400 hover:text-primary hover:bg-white/5"
      )}
    >
      {label}
    </Link>
  );
};

const MobileNavLink = ({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick: () => void }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
  >
    <span className="text-primary">{icon}</span>
    {label}
  </Link>
);

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [region, setRegion] = useState('CDMX');
  const [accountType, setAccountType] = useState('Usuario Individual');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setOccupation('');
    setRegion('CDMX');
    setAccountType('Usuario Individual');
    setTermsAccepted(false);
    setAuthError(null);
    setSuccessMsg(null);
  };

  const handleModeSwitch = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setAuthError(error);
      } else {
        onClose();
      }
    } else {
      if (!termsAccepted) {
        setAuthError('Debes aceptar los términos de servicio');
        setIsLoading(false);
        return;
      }
      const { error } = await signUp({ email, password, fullName, occupation, region, accountType });
      if (error) {
        setAuthError(error);
      } else {
        setSuccessMsg('¡Cuenta creada! Revisa tu correo para confirmar tu registro.');
      }
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {mode === 'login' ? 'Bienvenido de ' : 'Crear '}
              <span className="text-primary">{mode === 'login' ? 'Nuevo' : 'Cuenta'}</span>
            </h2>
            <p className="text-slate-400 text-sm">Ingresa tus datos para acceder a la red APUCMX.</p>
          </div>
          <button onClick={() => { onClose(); resetForm(); }} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {successMsg ? (
          <div className="p-8 text-center space-y-4">
            <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
              <Check size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-bold">{successMsg}</p>
            </div>
            <button onClick={() => { onClose(); resetForm(); }} className="w-full bg-primary text-white font-bold py-3 rounded-xl">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="p-8 space-y-4">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-red-300 text-xs">{authError}</p>
              </div>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre Completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="Juan Perez" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ocupación</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="text" value={occupation} onChange={e => setOccupation(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="Arquitecto" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="ejemplo@correo.com" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-12 py-2.5 text-sm text-white focus:border-primary outline-none" 
                  placeholder="••••••••"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado / Región</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="text" value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="CDMX" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Cuenta</label>
                  <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none">
                    <option>Usuario Individual</option>
                    <option>Empresa / Constructora</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 accent-primary" />
                  <span className="text-[10px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    Acepto los <span className="text-primary hover:underline">Términos de Servicio</span> y la <span className="text-primary hover:underline">Política de Privacidad</span>.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:brightness-110 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === 'login' ? 'Entrar a la Red' : 'Crear Mi Nodo'}
            </button>

            <div className="text-center pt-4">
              <button type="button" onClick={handleModeSwitch} className="text-xs text-slate-500 hover:text-primary transition-colors">
                {mode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const MembershipModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { updateMembership } = useAuth();
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [step, setStep] = useState<'selection' | 'payment'>('selection');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = (tier: MembershipTier) => {
    if (tier === 'gratis') {
      updateMembership('gratis');
      onClose();
    } else {
      setSelectedTier(tier);
      setStep('payment');
    }
  };

  const handlePayment = async () => {
    if (selectedTier) {
      setIsProcessing(true);
      await updateMembership(selectedTier as AuthMembershipTier);
      setIsProcessing(false);
      onClose();
      setStep('selection');
      setSelectedTier(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Side: Main Content */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {step === 'selection' ? 'Planes de ' : 'Finalizar '}
              <span className="text-primary">{step === 'selection' ? 'Membresía' : 'Pago'}</span>
            </h2>
            <button onClick={onClose} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {step === 'selection' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Gratis */}
              <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-bold text-lg mb-1">Gratis</h3>
                <div className="text-3xl font-black text-white mb-6">$0 <span className="text-xs text-slate-500 font-normal uppercase">MXN</span></div>
                <ul className="space-y-3 mb-8 flex-1 text-xs text-slate-400">
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Explorador APU</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Noticias</li>
                </ul>
                <button onClick={() => handleSelect('gratis')} className="w-full py-3 rounded-xl font-bold text-xs uppercase bg-white text-black hover:bg-primary hover:text-white transition-all">Seleccionar</button>
              </div>
              {/* Mensual */}
              <div className="bg-slate-800/30 border border-primary/40 rounded-2xl p-6 flex flex-col relative scale-105 shadow-xl shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Popular</div>
                <h3 className="text-white font-bold text-lg mb-1">Mensual</h3>
                <div className="text-3xl font-black text-white mb-6">$250 <span className="text-xs text-slate-500 font-normal uppercase">MXN / Mes</span></div>
                <ul className="space-y-3 mb-8 flex-1 text-xs text-slate-300">
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Directorio Proveedores</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Publicar Conceptos</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Foro de Expertos</li>
                </ul>
                <button onClick={() => handleSelect('mensual')} className="w-full py-3 rounded-xl font-bold text-xs uppercase bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all">Seleccionar</button>
              </div>
              {/* Anual */}
              <div className="bg-slate-800/30 border border-amber-500/40 rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-bold text-lg mb-1">Anual</h3>
                <div className="text-3xl font-black text-white mb-6">$2,000 <span className="text-xs text-slate-500 font-normal uppercase">MXN / Año</span></div>
                <ul className="space-y-3 mb-8 flex-1 text-xs text-slate-300">
                  <li className="flex gap-2"><Check size={14} className="text-amber-500 shrink-0" /> Todo lo del plan Mensual</li>
                  <li className="flex gap-2"><Check size={14} className="text-amber-500 shrink-0" /> Ahorro del 33%</li>
                </ul>
                <button onClick={() => handleSelect('anual')} className="w-full py-3 rounded-xl font-bold text-xs uppercase bg-amber-500 text-white hover:brightness-110 transition-all">Seleccionar</button>
              </div>
              {/* Creador */}
              <div className="bg-gradient-to-br from-slate-800/60 to-primary/10 border border-primary/60 rounded-2xl p-6 flex flex-col relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">PRO</div>
                <h3 className="text-white font-bold text-lg mb-1">Creador</h3>
                <div className="text-2xl font-black text-white mb-1">$500 <span className="text-xs text-slate-500 font-normal uppercase">MXN / Mes</span></div>
                <p className="text-[10px] text-primary font-bold mb-4 uppercase tracking-wide">+ Acceso Total a Datos</p>
                <ul className="space-y-2 mb-8 flex-1 text-xs text-slate-300">
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Todo lo del plan Mensual</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Publicar activos en Marketplace</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Ganar insignias por contribuciones</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Reputación CEDIA verificable</li>
                  <li className="flex gap-2"><Check size={14} className="text-primary shrink-0" /> Sello de Auditoría Técnica</li>
                </ul>
                <button onClick={() => handleSelect('creador')} className="w-full py-3 rounded-xl font-bold text-xs uppercase bg-gradient-to-r from-primary to-amber-500 text-white hover:brightness-110 shadow-lg shadow-primary/20 transition-all">Activar Creador</button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">Método de Pago <span className="text-slate-500 font-normal ml-2 flex items-center gap-1 inline-flex"><Lock size={10} /> Seguro y cifrado</span></h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={cn("w-full p-4 rounded-xl border flex items-center justify-between transition-all", paymentMethod === 'card' ? "bg-primary/10 border-primary" : "bg-slate-800/50 border-white/5")}
                  >
                    <div className="flex items-center gap-3">
                      <CardIcon size={20} className={paymentMethod === 'card' ? "text-primary" : "text-slate-500"} />
                      <span className="text-sm font-bold text-white">Tarjetas (Visa, Mastercard, Amex)</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">VISA</div>
                      <div className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">MC</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('crypto')}
                    className={cn("w-full p-4 rounded-xl border flex items-center justify-between transition-all", paymentMethod === 'crypto' ? "bg-primary/10 border-primary" : "bg-slate-800/50 border-white/5")}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode size={20} className={paymentMethod === 'crypto' ? "text-primary" : "text-slate-500"} />
                      <span className="text-sm font-bold text-white">Criptomonedas (Binance Pay)</span>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre en la tarjeta</label>
                    <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="GUILLERMO JHOEL HERNANDEZ GOMEZ" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Número de tarjeta</label>
                    <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="**** **** **** 0093" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha de vencimiento</label>
                    <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="10/2026" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                    <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="***" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button onClick={() => setStep('selection')} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest">Volver</button>
                <button onClick={handlePayment} className="flex-1 bg-primary hover:brightness-110 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-sm">
                  {isProcessing ? 'Procesando...' : `Pagar ${selectedTier === 'mensual' ? '$250' : selectedTier === 'anual' ? '$2,000' : selectedTier === 'creador' ? '$500' : ''} MXN`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Summary */}
        {step === 'payment' && (
          <div className="w-full md:w-80 bg-slate-800/50 p-8 md:p-12 border-l border-white/5">
            <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tight">Resumen</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Plan {selectedTier}</span>
                <span className="text-white font-bold">{selectedTier === 'mensual' ? '$250' : selectedTier === 'anual' ? '$2,000' : selectedTier === 'creador' ? '$500' : ''} MXN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Descuento</span>
                <span className="text-emerald-400 font-bold">-$0 MXN</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between text-lg font-black">
                <span className="text-white">Total</span>
                <span className="text-primary">{selectedTier === 'mensual' ? '$250' : selectedTier === 'anual' ? '$2,000' : selectedTier === 'creador' ? '$500' : ''} MXN</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-500 text-center">
              Al completar la compra, aceptas nuestras <span className="text-primary hover:underline cursor-pointer">Condiciones de Uso</span>.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SupportChat = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState([
    { role: 'system', text: '¡Hola! Soy el asistente de soporte de APUCMX. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'system', text: 'Gracias por tu mensaje. Un agente se conectará pronto para asistirte.' }]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[110] w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 border border-primary/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
        <div className="bg-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-white/20 rounded-full flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Soporte APUCMX</h4>
              <p className="text-[10px] text-white/70 flex items-center gap-1">
                <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse"></span> En línea ahora
              </p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed",
                msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-slate-800 text-slate-300 rounded-tl-none border border-white/5"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-slate-900">
          <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <input 
              type="text" 
              className="bg-transparent border-none outline-none text-white text-xs flex-1" 
              placeholder="Escribe tu duda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="text-primary hover:scale-110 transition-transform">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BlockchainBadge = ({ isVisible = true }: { isVisible?: boolean }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      onClick={() => window.dispatchEvent(new Event('open-validation-modal'))}
      className="fixed bottom-6 right-6 z-[100] transform hover:scale-105 transition-transform cursor-help"
    >
      <div className="bg-white dark:bg-slate-900 border border-primary rounded-lg p-2.5 shadow-2xl flex items-center gap-3 max-w-[220px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
        <div className="bg-primary text-white size-8 rounded-full flex items-center justify-center shrink-0">
          <ShieldCheck size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] uppercase font-black text-primary tracking-tighter mb-0.5 truncate">Sello de Calidad</div>
          <div className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight truncate">Verificación Técnica</div>
          <div className="text-[7px] font-mono text-slate-500 mt-0.5 uppercase">Revisado 2024</div>
        </div>
      </div>
    </div>
  );
};

const NewPostModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Nueva <span className="text-primary">Publicación</span></h2>
          <button onClick={onClose} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título</label>
            <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="¿De qué quieres hablar?" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contenido</label>
            <textarea rows={5} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none resize-none" placeholder="Escribe aquí tu mensaje..."></textarea>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Etiquetas (separadas por coma)</label>
            <input type="text" className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none" placeholder="acero, concreto, cdmx" />
          </div>
          <button onClick={onClose} className="w-full bg-primary hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-2">
            Publicar en el Foro
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TermsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Términos y <span className="text-primary">Privacidad</span></h2>
          <button onClick={onClose} className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">1. Aceptación de Términos</h3>
            <p>Al acceder a APUCMX, aceptas cumplir con nuestros términos de servicio. Esta plataforma utiliza tecnologías modernas para garantizar la integridad de los datos de costos de construcción.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">2. Privacidad de Datos</h3>
            <p>Tus datos personales están protegidos y cifrados. No compartimos información sensible con terceros sin tu consentimiento explícito, excepto lo requerido por la red descentralizada para la validación de nodos.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">3. Responsabilidad del Usuario</h3>
            <p>Eres responsable de la veracidad de los conceptos que subas para validación. El mal uso de la plataforma puede resultar en la revocación de tu membresía y la pérdida de puntos de reputación en la red.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">4. Propiedad Intelectual</h3>
            <p>Los análisis de precios unitarios validados pertenecen a la plataforma APUCMX bajo licencias de uso para miembros activos.</p>
          </section>
        </div>
        <div className="p-6 border-t border-white/5 bg-slate-800/30">
          <button onClick={onClose} className="w-full bg-primary hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">
            He leído y acepto
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ValidationExplanationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">¿Qué significa <span className="text-primary">Validado</span>?</h2>
          <button 
            onClick={onClose} 
            className="size-10 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl h-fit">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Verificación por Expertos</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Cada concepto marcado como "Validado" ha sido revisado por analistas de costos certificados para asegurar que los rendimientos y precios de mercado sean precisos.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl h-fit">
              <Globe className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Registro Digital Seguro</h3>
              <p className="text-slate-400 text-sm leading-relaxed">La información del análisis de precios unitarios se registra en un sistema confiable, previendo futuras integraciones Web3 para mayor inmutabilidad.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl h-fit">
              <Check className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Confianza en Licitaciones</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Utilizar conceptos validados reduce el riesgo de errores en tus presupuestos y aumenta la probabilidad de éxito en concursos de obra pública y privada.</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-white/5 bg-slate-800/30">
          <button onClick={onClose} className="w-full bg-primary hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
