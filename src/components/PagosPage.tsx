import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coins, ShoppingCart, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Clock, ChevronLeft, Zap, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';

const PAYMENT_LINK = 'https://buy.stripe.com/test_bJe8wPbZn068dqFaXl4sE01';

const COSTOS = [
  { label: 'Búsqueda de conceptos', tokens: 0, desc: 'Explorar el catálogo' },
  { label: 'Normalizar insumo', tokens: 1, desc: 'IA corrige descripción y unidad' },
  { label: 'Generar descripción AEC', tokens: 1, desc: 'Texto técnico desde prompt' },
  { label: 'Generar matriz APU', tokens: 5, desc: 'APU completa con IA' },
  { label: 'Auditar presupuesto', tokens: 10, desc: 'Score + observaciones' },
];

const fmt = (iso: string) => { try { return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
const actionLabel = (a: string) => ({ compra: 'Compra', bonus: 'Bienvenida', uso_auditoria: 'Auditoría', uso_matriz: 'Generar APU', uso_normalizar: 'Normalizar', uso_descripcion: 'Descripción AEC' }[a] ?? a);

const BalanceCard = ({ balance, loadingTokens }: { balance: number; loadingTokens: boolean }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A3E] to-[#0F0F2A] border border-[#6366F1]/20 p-6">
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[#8888AA] text-sm mb-1">Saldo de Tokens</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">{loadingTokens ? '–' : balance}</span>
          <span className="text-[#6366F1] text-lg font-mono">APUC</span>
        </div>
      </div>
      <div className="w-12 h-12 rounded-xl bg-[#6366F1]/20 flex items-center justify-center">
        <Coins className="w-6 h-6 text-[#6366F1]" />
      </div>
    </div>
    <div className="mt-4 space-y-1">
      <div className="w-full h-2 rounded-full bg-[#1A1A4A]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-700" style={{ width: `${Math.min(100, (balance / 200) * 100)}%` }} />
      </div>
      <p className="text-[#444466] text-xs">{balance} / 200 tokens de referencia</p>
    </div>
  </div>
);

const PurchaseCard = () => (
  <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6 space-y-4">
    <div>
      <h3 className="text-white font-semibold text-lg">Comprar Tokens</h3>
      <p className="text-[#8888AA] text-sm mt-1">Paquete estándar para profesionales AEC</p>
    </div>
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#1A1A2E] border border-[#6366F1]/20">
      <div>
        <p className="text-white font-bold text-xl">$200 <span className="text-[#8888AA] text-sm font-normal">MXN</span></p>
        <p className="text-[#8888AA] text-xs mt-0.5">100 tokens · pago único</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
        <Coins className="w-5 h-5 text-[#6366F1]" />
      </div>
    </div>
    <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F51D9] text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
      <ShoppingCart className="w-4 h-4" /> Comprar con Stripe <ArrowUpRight className="w-4 h-4 opacity-70" />
    </a>
    <p className="text-[#444466] text-xs text-center">Pago seguro · Modo sandbox (test)</p>
  </div>
);

const CostTable = () => (
  <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6 space-y-4">
    <h3 className="text-white font-semibold">Costo por Acción</h3>
    <div className="space-y-2">
      {COSTOS.map((c) => (
        <div key={c.label} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#1A1A2E] transition-colors">
          <div>
            <p className="text-white text-sm">{c.label}</p>
            <p className="text-[#666688] text-xs">{c.desc}</p>
          </div>
          <span className={`text-sm font-mono font-bold ${c.tokens === 0 ? 'text-emerald-400' : 'text-[#A5B4FC]'}`}>
            {c.tokens === 0 ? 'Gratis' : `${c.tokens} tok`}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PaymentBanner = ({ status }: { status: 'success' | 'cancelled' | null }) => {
  if (!status) return null;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {status === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
      <p className="text-sm">{status === 'success' ? '¡Pago completado! Los tokens se acreditarán en unos segundos.' : 'El pago fue cancelado. Puedes intentarlo nuevamente.'}</p>
    </div>
  );
};

export const PagosPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, loadingTokens, transactions, refreshBalance } = useTokens();
  const params = new URLSearchParams(location.search);
  const payStatus = params.get('success') === 'true' ? 'success' : params.get('cancelled') === 'true' ? 'cancelled' : null;

  useEffect(() => {
    if (payStatus === 'success') {
      setTimeout(() => refreshBalance(), 3000);
      setTimeout(() => refreshBalance(), 8000);
    }
  }, [payStatus]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="border-b border-[#1A1A2E] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center hover:bg-[#2A2A4A] transition-colors">
          <ChevronLeft className="w-4 h-4 text-[#8888AA]" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Tokens APUCMX</h1>
          <p className="text-[#8888AA] text-sm">Gestión de créditos para funciones IA</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <PaymentBanner status={payStatus} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard balance={balance} loadingTokens={loadingTokens} />
            <CostTable />
          </div>
          <div className="space-y-6">
            <PurchaseCard />
            <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-4 space-y-2">
              <p className="text-[#8888AA] text-xs font-semibold uppercase tracking-widest">Acerca de los tokens</p>
              <ul className="space-y-2 text-sm text-[#8888AA]">
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> Al registrarte recibes 50 tokens de bienvenida</li>
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> Los tokens no tienen fecha de expiración</li>
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> La búsqueda del catálogo es siempre gratuita</li>
              </ul>
            </div>
          </div>
        </div>
        {user && (
          <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#6366F1]" />
              <h3 className="text-white font-semibold">Historial de Movimientos</h3>
            </div>
            {loadingTokens ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-[#666688] text-sm text-center py-8">No hay movimientos aún.</p>
            ) : transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#1A1A2E] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownLeft className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm">{actionLabel(tx.action)}</p>
                    {tx.description && <p className="text-[#666688] text-xs">{tx.description}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</p>
                  <p className="text-[#444466] text-xs">{fmt(tx.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {!user && (
          <div className="text-center py-12 space-y-3">
            <p className="text-[#8888AA]">Inicia sesión para ver tu saldo y comprar tokens</p>
            <button onClick={() => navigate('/')} className="px-5 py-2 rounded-xl bg-[#6366F1] text-white text-sm hover:bg-[#4F51D9] transition-colors">Ir al inicio</button>
          </div>
        )}
        <p className="text-[#333355] text-xs text-center">APUCMX V1 · México 2026 · Los precios son estimaciones de referencia.</p>
      </div>
    </div>
  );
};
