import React,{useEffect} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {Coins,ShoppingCart,ArrowUpRight,ArrowDownLeft,CheckCircle,XCircle,Clock,Zap,FileText,BarChart3,Search,Building2,Sparkles,Shield,RefreshCw} from 'lucide-react';
import {NavHeader} from './NavHeader';
import {useAuth} from '../context/AuthContext';
import {useTokens} from '../context/TokenContext';

const PAYMENT_LINK='https://buy.stripe.com/test_bJe8wPbZn068dqFaXl4sE01';

const ACCIONES=[
  {cat:'Exploración',label:'Buscar en catálogo de insumos',tokens:0,free:true},
  {cat:'Exploración',label:'Ver precio unitario',tokens:0,free:true},
  {cat:'IA · Básico',label:'Normalizar descripción AEC',tokens:1},
  {cat:'IA · Básico',label:'Generar descripción técnica',tokens:1},
  {cat:'IA · Profesional',label:'Análisis de catálogo con IA',tokens:5},
  {cat:'IA · Profesional',label:'Generar concepto APU por prompt',tokens:5},
  {cat:'IA · Profesional',label:'Ver matriz APU completa',tokens:5},
  {cat:'IA · Profesional',label:'Presupuesto PDF por prompt (IA)',tokens:10},
  {cat:'IA · Profesional',label:'Auditoría de presupuesto PDF/Excel',tokens:10},
  {cat:'Vendedor',label:'Publicar catálogo de proveedor',tokens:0,flat:'$100 MXN/mes'},
  {cat:'Vendedor',label:'Análisis de mercado con IA',tokens:10},
];

const CAT_BADGE:Record<string,string>={
  'Exploración':'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'IA · Básico':'text-[#A5B4FC] bg-[#6366F1]/10 border-[#6366F1]/20',
  'IA · Profesional':'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Vendedor':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
};

const fmt=(iso:string)=>{try{return new Date(iso).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch{return iso;}};
const actionLabel=(a:string)=>({compra:'Compra de tokens',bonus:'Tokens bienvenida',uso_auditoria:'Auditoría',uso_matriz:'Generar APU',uso_normalizar:'Normalizar',uso_descripcion:'Descripción AEC'}[a]??a);

const BalanceCard=({balance,loadingTokens,onRefresh}:{balance:number;loadingTokens:boolean;onRefresh:()=>void})=>(
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A3E] via-[#0F0F2A] to-[#0A0A1F] border border-[#6366F1]/30 p-8">
    <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none"/>
    <div className="flex items-start justify-between mb-6">
      <div>
        <p className="text-[#8888AA] text-xs mb-2 uppercase tracking-widest font-semibold">Saldo Disponible</p>
        <div className="flex items-baseline gap-3">
          <span className="text-7xl font-black text-white tracking-tight">{loadingTokens?'—':balance}</span>
          <div className="flex flex-col"><span className="text-[#6366F1] text-xl font-bold">APUC</span><span className="text-[#444466] text-xs">tokens</span></div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center"><Coins className="w-7 h-7 text-[#6366F1]"/></div>
        <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-[#444466] hover:text-[#8888AA] transition-colors"><RefreshCw className="w-3 h-3"/>Actualizar</button>
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[#444466]"><span>{balance} tokens</span><span>ref: 200</span></div>
      <div className="w-full h-2 rounded-full bg-[#1A1A4A] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-1000" style={{width:`${Math.min(100,(balance/200)*100)}%`}}/>
      </div>
    </div>
  </div>
);

const PurchaseCard=()=>(
  <div className="rounded-2xl bg-gradient-to-b from-[#0F0F1E] to-[#080810] border border-[#2A2A4A] p-6 space-y-5">
    <div>
      <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-[#6366F1]"/><h3 className="text-white font-bold text-lg">Recargar Tokens</h3></div>
      <p className="text-[#666688] text-sm">Mínimo $100 MXN = 100 tokens</p>
    </div>
    <div className="space-y-2">
      {[{mxn:100,tok:100,label:'Starter'},{mxn:250,tok:275,label:'Pro',popular:true},{mxn:500,tok:600,label:'Studio'}].map(p=>(
        <div key={p.mxn} className={`relative flex items-center justify-between py-3 px-4 rounded-xl border transition-all cursor-pointer ${p.popular?'bg-[#6366F1]/10 border-[#6366F1]/40 hover:border-[#6366F1]':'bg-[#1A1A2E] border-[#2A2A4A] hover:border-[#444466]'}`}>
          {p.popular&&<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-[#6366F1] text-white px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>}
          <div><p className="text-white font-bold">{p.label}</p><p className="text-[#666688] text-xs">{p.tok} tokens{p.tok>p.mxn?` · +${p.tok-p.mxn} extra`:''}</p></div>
          <div className="text-right"><p className={`font-black text-lg ${p.popular?'text-[#A5B4FC]':'text-white'}`}>${p.mxn}</p><p className="text-[#444466] text-xs">MXN</p></div>
        </div>
      ))}
    </div>
    <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:brightness-110 text-white font-bold tracking-wide transition-all hover:scale-[1.02] shadow-lg shadow-[#6366F1]/25">
      <ShoppingCart className="w-4 h-4"/>Comprar con Stripe<ArrowUpRight className="w-4 h-4 opacity-70"/>
    </a>
    <p className="text-[#333355] text-xs text-center">Pago seguro · Sandbox · Tokens se acreditan en segundos</p>
  </div>
);

const ConsumoTable=()=>{
  const cats=[...new Set(ACCIONES.map(a=>a.cat))];
  return(
    <div className="rounded-2xl bg-[#0A0A12] border border-[#1A1A2E] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1A1A2E] flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#6366F1]"/><h3 className="text-white font-bold">Tabla de Consumo por Acción</h3>
      </div>
      <div className="divide-y divide-[#0A0A0F]">
        {cats.map(cat=>(
          <div key={cat}>
            <div className="px-6 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CAT_BADGE[cat]}`}>{cat}</span></div>
            {ACCIONES.filter(a=>a.cat===cat).map((ac,i)=>(
              <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-[#0F0F1E] transition-colors">
                <span className="text-[#CCCCDD] text-sm">{ac.label}</span>
                <span className={`font-bold text-sm font-mono flex-shrink-0 ml-4 ${(ac as any).flat?'text-cyan-400':ac.free||ac.tokens===0?'text-emerald-400':'text-[#A5B4FC]'}`}>
                  {(ac as any).flat||(ac.free||ac.tokens===0?'Gratis':`${ac.tokens} tok`)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-[#1A1A2E] bg-[#06060E]">
        <p className="text-[#333355] text-xs text-center">$100 MXN = 100 tokens · Sin expiración · Bienvenida: 50 tokens gratis</p>
      </div>
    </div>
  );
};

const PaymentBanner=({status}:{status:'success'|'cancelled'|null})=>{
  if(!status)return null;
  return(
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${status==='success'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {status==='success'?<CheckCircle className="w-5 h-5 flex-shrink-0"/>:<XCircle className="w-5 h-5 flex-shrink-0"/>}
      <p className="text-sm">{status==='success'?'¡Pago completado! Los tokens se acreditarán en segundos.':'Pago cancelado. Puedes intentarlo nuevamente.'}</p>
    </div>
  );
};

export const PagosPage:React.FC=()=>{
  const location=useLocation();
  const navigate=useNavigate();
  const {user}=useAuth();
  const {balance,loadingTokens,transactions,refreshBalance}=useTokens();
  const params=new URLSearchParams(location.search);
  const payStatus=params.get('success')==='true'?'success':params.get('cancelled')==='true'?'cancelled':null;

  useEffect(()=>{
    if(payStatus==='success'){
      setTimeout(()=>refreshBalance(),3000);
      setTimeout(()=>refreshBalance(),8000);
    }
  },[payStatus]);

  return(
    <div className="min-h-screen bg-[#04040A] text-white">
      <NavHeader/>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <PaymentBanner status={payStatus}/>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight">Tokens <span className="text-[#6366F1]">APUCMX</span></h1>
          <p className="text-[#666688]">Créditos para IA · Sin suscripción, pagas solo lo que usas</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard balance={balance} loadingTokens={loadingTokens} onRefresh={refreshBalance}/>
            <ConsumoTable/>
            {user?(
              <div className="rounded-2xl bg-[#0A0A12] border border-[#1A1A2E] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1A1A2E] flex items-center gap-2"><Clock className="w-4 h-4 text-[#6366F1]"/><h3 className="text-white font-bold">Historial de Movimientos</h3></div>
                {loadingTokens?(<div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin"/></div>)
                :transactions.length===0?(<p className="text-[#444466] text-sm text-center py-10">No hay movimientos aún.</p>)
                :(
                  <div className="divide-y divide-[#0A0A0F]">
                    {transactions.map(tx=>(
                      <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#0F0F1A] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.amount>0?'bg-emerald-500/15':'bg-red-500/15'}`}>
                            {tx.amount>0?<ArrowUpRight className="w-4 h-4 text-emerald-400"/>:<ArrowDownLeft className="w-4 h-4 text-red-400"/>}
                          </div>
                          <div><p className="text-white text-sm font-medium">{actionLabel(tx.action)}</p>{tx.description&&<p className="text-[#444466] text-xs">{tx.description}</p>}</div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold ${tx.amount>0?'text-emerald-400':'text-red-400'}`}>{tx.amount>0?'+':''}{tx.amount} tok</p>
                          <p className="text-[#333355] text-xs">{fmt(tx.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ):(
              <div className="rounded-2xl border border-[#1A1A2E] bg-[#0A0A12] py-14 text-center space-y-4">
                <Coins className="w-10 h-10 text-[#333355] mx-auto"/>
                <p className="text-[#666688]">Inicia sesión para ver tu saldo</p>
                <button onClick={()=>window.dispatchEvent(new Event('open-auth-modal'))} className="px-6 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-bold hover:bg-[#4F51D9] transition-colors">Iniciar sesión</button>
              </div>
            )}
          </div>
          <div className="space-y-5">
            <PurchaseCard/>
            <div className="rounded-2xl bg-[#0A0A12] border border-[#1A1A2E] p-5 space-y-3">
              <p className="text-[#666688] text-xs font-bold uppercase tracking-widest">¿Cómo funcionan?</p>
              <ul className="space-y-2.5 text-sm text-[#8888AA]">
                {['Al registrarte: 50 tokens de bienvenida','Los tokens no expiran','Búsqueda del catálogo siempre gratis','$100 MXN mínimo por recarga = 100 tokens','Vendedores: $100 MXN/mes tarifa fija'].map((t,i)=>(
                  <li key={i} className="flex items-start gap-2"><span className="text-[#6366F1] mt-0.5">▸</span>{t}</li>
                ))}
              </ul>
              <div className="pt-3 border-t border-[#1A1A2E]">
                <Link to="/insumos" className="text-[#6366F1] text-xs hover:underline">Ver catálogo →</Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[#111120] text-xs text-center">APUCMX V1 · México 2026 · Precios estimados de referencia.</p>
      </div>
    </div>
  );
};
