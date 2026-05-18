/**
 * TokensPage.tsx
 * =============
 * Página de gestión de Tokens APUCMX:
 * - Muestra saldo actual y barra de progreso
 * - Tabla de historial de transacciones
 * - Botón de compra (redirige a Stripe Checkout)
 * - Plan de costos (tokens por acción)
 * 
 * Ruta: /tokens (destino de Stripe success_url y cancel_url)
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Coins, ShoppingCart, ArrowUpRight, ArrowDownLeft,
  CheckCircle, XCircle, Clock, ChevronLeft, Zap, BarChart3, FileText,
} from 'lucide-react';
import { useAuth } from 'src/context/AuthContext';
import { useTokens } from 'src/context/TokenContext';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYMENT_LINK = 'https://buy.stripe.com/test_bJe8wPbZn068dqFaXl4sE01';

const COSTOS: { label: string; tokens: number; icon: React.ReactNode; desc: string }[] = [
  { label: 'Explorar Catálogo',     tokens: 0, icon: <BarChart3 className="w-4 h-4" />, desc: 'Búsqueda de conceptos' },
  { label: 'Análisis de catálogo con IA', tokens: 5, icon: <Zap className="w-4 h-4" />, desc: 'Limpieza y sugerencias IA' },
  { label: 'Presupuesto PDF por Prompt',  tokens: 8, icon: <FileText className="w-4 h-4" />,desc: 'Catálogo base a partir de texto' },
  { label: 'Creación de catálogo IA',     tokens: 10, icon: <Zap className="w-4 h-4" />, desc: 'Matriz APU completa' },
  { label: 'Auditoría de presupuesto',    tokens: 15, icon: <CheckCircle className="w-4 h-4" />, desc: 'Excel/PDF con áreas de mejora' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    compra:         'Compra',
    bonus:          'Bienvenida',
    uso_auditoria:  'Auditoría',
    uso_matriz:     'Generar APU',
    uso_normalizar: 'Normalizar',
    uso_descripcion:'Descripción AEC',
    transferencia:  'Transferencia',
  };
  return map[action] ?? action;
}

// ─── Componentes ──────────────────────────────────────────────────────────────

const TransferCard = () => {
  const { transferTokens } = useTokens();
  const [email, setEmail] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = parseInt(amountStr);
    if (!email.trim()) {
      setErrorMsg('POR FAVOR INGRESA EL CORREO ELECTRÓNICO.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('EL MONTO DEBE SER UN NÚMERO ENTERO MAYOR A CERO.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await transferTokens(email, amount);
      if (res.ok) {
        setSuccessMsg(`¡TRANSFERENCIA EXITOSA! ENVIADOS ${amount} TOKENS A ${email.toUpperCase()}.`);
        setEmail('');
        setAmountStr('');
      } else {
        setErrorMsg(res.error || 'ERROR AL TRANSFERIR TOKENS.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ERROR DE RED AL TRANSFERIR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6 space-y-4">
      <div>
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-indigo-400" />
          Transferir Tokens
        </h3>
        <p className="text-[#8888AA] text-sm mt-1">Comparte créditos de forma instantánea con otros usuarios de la red</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Correo Electrónico Destino</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            disabled={isSubmitting}
            className="w-full bg-[#1A1A2E] border border-[#2A2A4A] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto a Transferir</label>
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="Monto de tokens"
            disabled={isSubmitting}
            className="w-full bg-[#1A1A2E] border border-[#2A2A4A] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
          />
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 flex items-start gap-2 text-[11px] font-mono leading-relaxed uppercase">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-400 flex items-start gap-2 text-[11px] font-mono leading-relaxed uppercase">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !amountStr.trim()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              Realizar Transferencia
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const BalanceCard = ({ balance, loadingTokens }: { balance: number; loadingTokens: boolean }) => {
  const pct = Math.min(100, (balance / 200) * 100); // max barra = 200 tokens

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A3E] to-[#0F0F2A] border border-[#6366F1]/20 p-6">
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8888AA] text-sm mb-1">Saldo de Tokens</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">
              {loadingTokens ? '–' : balance}
            </span>
            <span className="text-[#6366F1] text-lg font-mono">APUC</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#6366F1]/20 flex items-center justify-center">
          <Coins className="w-6 h-6 text-[#6366F1]" />
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-4 space-y-1">
        <div className="w-full h-2 rounded-full bg-[#1A1A4A]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[#444466] text-xs">{balance} / 200 tokens de referencia</p>
      </div>
    </div>
  );
};

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

    <a
      href={PAYMENT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F51D9] text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      <ShoppingCart className="w-4 h-4" />
      Comprar con Stripe
      <ArrowUpRight className="w-4 h-4 opacity-70" />
    </a>

    <p className="text-[#444466] text-xs text-center">
      Pago seguro · Modo sandbox (test) · No se realizan cobros reales
    </p>
  </div>
);

const CostTable = () => (
  <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6 space-y-4">
    <h3 className="text-white font-semibold">Costo por Acción</h3>
    <div className="space-y-2">
      {COSTOS.map((c) => (
        <div key={c.label} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#1A1A2E] transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[#6366F1]">{c.icon}</span>
            <div>
              <p className="text-white text-sm">{c.label}</p>
              <p className="text-[#666688] text-xs">{c.desc}</p>
            </div>
          </div>
          <span className={`text-sm font-mono font-bold ${c.tokens === 0 ? 'text-emerald-400' : 'text-[#A5B4FC]'}`}>
            {c.tokens === 0 ? 'Gratis' : `${c.tokens} tok`}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TransactionRow: React.FC<{ tx: { id: string; amount: number; action: string; description: string | null; created_at: string } }> = ({ tx }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#1A1A2E] last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
        {tx.amount > 0
          ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          : <ArrowDownLeft className="w-4 h-4 text-red-400" />
        }
      </div>
      <div>
        <p className="text-white text-sm">{actionLabel(tx.action)}</p>
        {tx.description && <p className="text-[#666688] text-xs">{tx.description}</p>}
      </div>
    </div>
    <div className="text-right">
      <p className={`text-sm font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {tx.amount > 0 ? '+' : ''}{tx.amount}
      </p>
      <p className="text-[#444466] text-xs">{formatDate(tx.created_at)}</p>
    </div>
  </div>
);

// ─── Banner de resultado de pago ──────────────────────────────────────────────

const PaymentBanner = ({ status }: { status: 'success' | 'cancelled' | null }) => {
  if (!status) return null;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
      status === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {status === 'success'
        ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
        : <XCircle    className="w-5 h-5 flex-shrink-0" />
      }
      <p className="text-sm">
        {status === 'success'
          ? '¡Pago completado! Los tokens se acreditarán en unos segundos. Si no aparecen, recarga la página.'
          : 'El pago fue cancelado. Puedes intentarlo nuevamente cuando quieras.'
        }
      </p>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const TokensPage: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { balance, loadingTokens, transactions, refreshBalance } = useTokens();

  // Detectar ?success=true o ?cancelled=true desde Stripe redirect
  const params     = new URLSearchParams(location.search);
  const payStatus  = params.get('success') === 'true'
    ? 'success'
    : params.get('cancelled') === 'true'
    ? 'cancelled'
    : null;

  useEffect(() => {
    if (payStatus === 'success') {
      // Refrescar balance tras regreso del pago (el webhook puede tardar ~5s)
      setTimeout(() => refreshBalance(), 3000);
      setTimeout(() => refreshBalance(), 8000);
    }
  }, [payStatus]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#0F0F1E]/80 border border-[#2A2A4A] p-8 text-center space-y-6 relative overflow-hidden backdrop-blur-md">
          {/* Glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center mx-auto shadow-xl">
            <Coins className="w-8 h-8 text-white animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-wider">Acceso Restringido</h2>
            <p className="text-sm text-slate-400">
              DEBES INICIAR SESIÓN EN LA PLATAFORMA DE APUCMX PARA GESTIONAR TUS TOKENS, COMPRAR CRÉDITOS Y COMPARTIR SALDO CON OTROS USUARIOS DE LA RED.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-semibold transition-all duration-200"
          >
            Ir al Inicio para Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <div className="border-b border-[#1A1A2E] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center hover:bg-[#2A2A4A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#8888AA]" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Tokens APUCMX</h1>
          <p className="text-[#8888AA] text-sm">Gestión de créditos para funciones IA</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        <PaymentBanner status={payStatus} />

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard balance={balance} loadingTokens={loadingTokens} />
            <CostTable />
          </div>
          <div className="space-y-6">
            <PurchaseCard />
            
            <TransferCard />

            {/* Info token */}
            <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-4 space-y-2">
              <p className="text-[#8888AA] text-xs font-semibold uppercase tracking-widest">Acerca de los tokens</p>
              <ul className="space-y-2 text-sm text-[#8888AA]">
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> Al registrarte recibes 50 tokens de bienvenida</li>
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> Los tokens no tienen fecha de expiración</li>
                <li className="flex gap-2"><span className="text-[#6366F1]">·</span> La búsqueda y consulta del catálogo es siempre gratuita</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="rounded-2xl bg-[#0F0F1E] border border-[#2A2A4A] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-white font-semibold">Historial de Movimientos</h3>
          </div>
          {loadingTokens ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-[#666688] text-sm text-center py-8">No hay movimientos aún.</p>
          ) : (
            transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </div>

        {/* Legal */}
        <p className="text-[#333355] text-xs text-center">
          APUCMX V1 · Plataforma de validación de precios unitarios · México 2026 ·
          Los precios son estimaciones de referencia, no cotizaciones formales.
        </p>
      </div>
    </div>
  );
};
