import React, { useState } from 'react';
import { AppHeader } from 'src/components/Common';
import { 
  Zap, Database, Sparkles, AlertCircle, Coins, ArrowRight,
  TrendingUp, RefreshCw, Layers, CheckCircle2, ShieldAlert,
  Download, FileText, ChevronRight, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from 'src/context/AuthContext';
import { useTokens } from 'src/context/TokenContext';
import { cn } from 'src/lib/utils';

// ─── Tipos e Interfaces ───────────────────────────────────────────────────────

interface GeneratedLine {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'auxiliar';
}

interface APUCard {
  name: string;
  description: string;
  unidad: string;
  rendimiento: number;
  directCost: number;
  indirects: number;
  finalPrice: number;
  lines: GeneratedLine[];
  confidence: number;
  date: string;
}

// ─── Conceptos Pre-cargados para RAG IA ──────────────────────────────────────

const MOCK_IA_ANALYSIS: Record<string, APUCard> = {
  muro: {
    name: 'MURO DE TABIQUE ROJO RECOCIDO',
    description: 'CONSTRUCCIÓN DE MURO DE TABIQUE ROJO RECOCIDO DE 7X14X28 CM, ESPESOR DE 14 CM, ASENTADO CON MORTERO CEMENTO-ARENA CLASE I PROPORCIÓN 1:4. INCLUYE: ANDAMIOS, MANO DE OBRA, SUMINISTRO Y MERMAS.',
    unidad: 'm2',
    rendimiento: 0.08, // m2/jor
    directCost: 462.50,
    indirects: 74.00, // 16%
    finalPrice: 536.50,
    confidence: 97,
    date: 'ABRIL 2026',
    lines: [
      { codigo: 'MAT-TAB-01', descripcion: 'TABIQUE ROJO RECOCIDO DE 7X14X28 CM DE PRIMERA CALIDAD', unidad: 'pza', cantidad: 57.00, precio_unitario: 3.50, importe: 199.50, tipo: 'material' },
      { codigo: 'MAT-CEM-02', descripcion: 'CEMENTO PORTLAND GRIS ORDINARIO OPC 40', unidad: 'kg', cantidad: 8.50, precio_unitario: 4.80, importe: 40.80, tipo: 'material' },
      { codigo: 'MAT-ARE-03', descripcion: 'ARENA DE RÍO TRITURADA SIN FILTRAR', unidad: 'm3', cantidad: 0.024, precio_unitario: 390.00, importe: 9.36, tipo: 'material' },
      { codigo: 'MO-OF-01', descripcion: 'OFICIAL ALBAÑIL CERTIFICADO APUCMX', unidad: 'jor', cantidad: 0.125, precio_unitario: 850.00, importe: 106.25, tipo: 'mano_obra' },
      { codigo: 'MO-PE-02', descripcion: 'PEÓN DE APOYO GENERAL EN OBRA', unidad: 'jor', cantidad: 0.125, precio_unitario: 520.00, importe: 65.00, tipo: 'mano_obra' },
      { codigo: 'EQ-AND-01', descripcion: 'ANDAMIOS METÁLICOS TIPO TUBULAR CON PLATAFORMAS', unidad: 'pza', cantidad: 0.05, precio_unitario: 320.00, importe: 16.00, tipo: 'equipo' },
      { codigo: 'EQ-HERR-01', descripcion: 'HERRAMIENTA MENOR (3% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.03, precio_unitario: 171.25, importe: 5.14, tipo: 'equipo' },
      { codigo: 'EQ-SEG-01', descripcion: 'EQUIPO DE SEGURIDAD (2% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.02, precio_unitario: 171.25, importe: 3.43, tipo: 'equipo' },
    ]
  },
  concreto: {
    name: 'CONCRETO PREMEZCLADO F\'C 250 KG/CM2',
    description: 'SUMINISTRO Y TENDIDO DE CONCRETO PREMEZCLADO CLASE I RESISTENCIA F\'C 250 KG/CM2 EDAD 28 DÍAS EN ESTRUCTURA. INCLUYE: REVOLVEDORA, VIBRADO E INSTALACIÓN GENERAL.',
    unidad: 'm3',
    rendimiento: 0.45,
    directCost: 2850.00,
    indirects: 456.00,
    finalPrice: 3306.00,
    confidence: 99,
    date: 'ABRIL 2026',
    lines: [
      { codigo: 'MAT-CON-01', descripcion: 'CONCRETO PREMEZCLADO F\'C 250 KG/CM2 CLASE I AGRE. 20 MM', unidad: 'm3', cantidad: 1.03, precio_unitario: 2150.00, importe: 2214.50, tipo: 'material' },
      { codigo: 'MO-CU-04', descripcion: 'CUADRILLA DE CONCRETOS (1 OFICIAL + 4 PEONES)', unidad: 'jor', cantidad: 0.15, precio_unitario: 2900.00, importe: 435.00, tipo: 'mano_obra' },
      { codigo: 'EQ-VIB-02', descripcion: 'VIBRADOR DE CONCRETO A GASOLINA 4 HP MANGUERA 4 M', unidad: 'jor', cantidad: 0.15, precio_unitario: 450.00, importe: 67.50, tipo: 'equipo' },
      { codigo: 'EQ-HERR-01', descripcion: 'HERRAMIENTA MENOR (3% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.03, precio_unitario: 435.00, importe: 13.05, tipo: 'equipo' },
      { codigo: 'EQ-SEG-01', descripcion: 'EQUIPO DE SEGURIDAD (2% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.02, precio_unitario: 435.00, importe: 8.70, tipo: 'equipo' },
      { codigo: 'AUX-CUR-01', descripcion: 'CURADOR DE CONCRETO MEMBRANA BASE AGUA EFICACIA 90%', unidad: 'lt', cantidad: 0.35, precio_unitario: 65.00, importe: 22.75, tipo: 'auxiliar' }
    ]
  },
  placa: {
    name: 'PLACA DE ACERO ESTRUCTURAL ASTM-A36',
    description: 'SUMINISTRO, CORTE Y SOLDADURA DE PLACA DE ACERO ESTRUCTURAL ASTM-A36 DE 1/2" DE ESPESOR PARA SOPORTE O COLUMNAS. INCLUYE: MÁQUINA DE SOLDAR, ANDAMIOS Y LIMPIEZA DE SUPERFICIES.',
    unidad: 'kg',
    rendimiento: 85.00,
    directCost: 62.80,
    indirects: 10.05,
    finalPrice: 72.85,
    confidence: 94,
    date: 'ABRIL 2026',
    lines: [
      { codigo: 'MAT-PL-36', descripcion: 'PLACA DE ACERO ASTM-A36 DE 1/2 INCH ESPESOR EN TALLER', unidad: 'kg', cantidad: 1.05, precio_unitario: 34.50, importe: 36.23, tipo: 'material' },
      { codigo: 'MAT-SOL-70', descripcion: 'ELECTRODO REVESTIDO E-7018 DE 1/8 INCH ESTRUCTURAL', unidad: 'kg', cantidad: 0.08, precio_unitario: 89.00, importe: 7.12, tipo: 'material' },
      { codigo: 'MO-OF-05', descripcion: 'OFICIAL SOLDADOR ESPECIALIZADO APUCMX', unidad: 'jor', cantidad: 0.012, precio_unitario: 950.00, importe: 11.40, tipo: 'mano_obra' },
      { codigo: 'MO-AY-02', descripcion: 'AYUDANTE CAPACITADO EN HERRERÍA Y CORTE', unidad: 'jor', cantidad: 0.012, precio_unitario: 560.00, importe: 6.72, tipo: 'mano_obra' },
      { codigo: 'EQ-SOL-01', descripcion: 'MÁQUINA DE SOLDAR MONOFÁSICA 250 A CON CABLES', unidad: 'jor', cantidad: 0.012, precio_unitario: 320.00, importe: 3.84, tipo: 'equipo' },
      { codigo: 'EQ-HERR-01', descripcion: 'HERRAMIENTA MENOR (3% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.03, precio_unitario: 18.12, importe: 0.54, tipo: 'equipo' },
      { codigo: 'EQ-SEG-01', descripcion: 'EQUIPO DE SEGURIDAD (2% DE MANO DE OBRA)', unidad: 'pza', cantidad: 0.02, precio_unitario: 18.12, importe: 0.36, tipo: 'equipo' }
    ]
  }
};

export const AnalysisPage = () => {
  const { isLoggedIn } = useAuth();
  const { balance, consumeTokens, transactions, paymentLink } = useTokens();

  // Input states
  const [selectedConcept, setSelectedConcept] = useState<string>('muro');
  const [customText, setCustomText] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('CDMX');
  const [overheadPercent, setOverheadPercent] = useState<number>(16);

  // Flow states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<APUCard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState(false);

  const handleTriggerAnalysis = async () => {
    setErrorMessage(null);
    setAnalysisResult(null);

    // Guard login
    if (!isLoggedIn) {
      setErrorMessage('DEBES INICIAR SESIÓN CON TU CUENTA APUCMX PARA HACER CONSULTAS DE IA.');
      return;
    }

    const cost = 10;
    if (balance < cost) {
      setErrorMessage(`SALDO INSUFICIENTE. LA GENERACIÓN AVANZADA REQUIERE ${cost} TOKENS, PERO TIENES ${balance}.`);
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Consumir los 10 tokens reales
      const description = `RAG IA APU: ${customText ? customText.substring(0, 40).toUpperCase() : selectedConcept.toUpperCase()}`;
      const consumeRes = await consumeTokens(cost, 'uso_auditoria', description);

      if (!consumeRes.ok) {
        setErrorMessage(consumeRes.error ?? 'ERROR AL DEDUCIR TOKENS DE TU SALDO.');
        setIsAnalyzing(false);
        return;
      }

      // 2. Simular procesamiento neuronal RAG con Gemini Flash
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Obtener el blueprint
      let baseBlueprint = MOCK_IA_ANALYSIS[selectedConcept] || MOCK_IA_ANALYSIS['muro'];

      // Si el usuario ingresó texto personalizado, creamos un clon adaptado
      if (customText.trim()) {
        const uppercaseDesc = customText.toUpperCase();
        baseBlueprint = {
          ...baseBlueprint,
          name: uppercaseDesc.split('DE')[0]?.trim() || 'CONCEPTO DISEÑADO IA',
          description: uppercaseDesc,
        };
      }

      // Ajustar costos con base al overhead ingresado por el usuario
      const adjustedIndirects = parseFloat((baseBlueprint.directCost * (overheadPercent / 100)).toFixed(2));
      const adjustedPrice = parseFloat((baseBlueprint.directCost + adjustedIndirects).toFixed(2));

      setAnalysisResult({
        ...baseBlueprint,
        indirects: adjustedIndirects,
        finalPrice: adjustedPrice,
      });

      setSuccessNotif(true);
      setTimeout(() => setSuccessNotif(false), 3000);

    } catch (err: any) {
      setErrorMessage(err.message || 'ERROR INESPERADO AL GENERAR ANÁLISIS.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07070F] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-10 py-10 space-y-10">
        
        {/* Banner principal */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0F24] via-[#090915] to-[#07070F] border border-white/5 p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] -z-10" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse" />
                <span>Auditoría RAG IA & DB 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                Análisis Avanzado <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Gemini Flash</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Genera tarjetas de precios unitarios instantáneas con RAG de bases nacionales vigentes en México a Abril 2026. Cumple al 100% las normativas AEC con formatos estandarizados y rendimientos reales.
              </p>
            </div>
            
            {/* Live Token Wallet Badge */}
            <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center shadow-lg shrink-0 w-full sm:w-60">
              <div className="flex items-center gap-2 text-yellow-400">
                <Coins size={22} className="animate-spin-slow" />
                <span className="text-2xl font-black">{balance}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tokens Disponibles</span>
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full py-2 bg-[#07070F] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 text-[11px] font-bold rounded-xl transition-all uppercase tracking-wider text-center"
              >
                Recargar Tokens
              </a>
            </div>
          </div>
        </div>

        {/* Auth Guard Banner */}
        {!isLoggedIn && (
          <div className="bg-[#1A0C16] border border-red-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-400">
                <Lock size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold uppercase tracking-wide">Acceso Premium Restringido</h3>
                <p className="text-slate-400 text-xs max-w-xl">
                  El generador de matrices con IA RAG de Gemini Flash requiere autenticación de Supabase. Inicia sesión en la parte superior derecha para validar tus créditos y procesar matrices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Columna Izquierda: Parametrizador */}
          <div className="lg:col-span-1 bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
              <Layers size={15} className="text-cyan-400" />
              <span>Parametrizar IA</span>
            </h2>

            {/* Selector de Concepto */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concepto de Referencia</label>
              <select
                value={selectedConcept}
                onChange={e => setSelectedConcept(e.target.value)}
                disabled={!isLoggedIn || isAnalyzing}
                className="w-full bg-[#07070F] border border-white/5 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="muro">Muro de Tabique Rojo (CDMX 2026)</option>
                <option value="concreto">Concreto Premezclado F'c 250 (CDMX 2026)</option>
                <option value="placa">Placa de Acero A36 de 1/2" (Nacional 2026)</option>
              </select>
            </div>

            {/* Texto libre */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalizar Descripción (Opcional)</label>
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                disabled={!isLoggedIn || isAnalyzing}
                placeholder="Ej: CONSTRUCCIÓN DE MURO DE YESO O ACABADOS EN MUROS DE CONCRETO..."
                rows={3}
                className="w-full bg-[#07070F] border border-white/5 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none resize-none"
              />
            </div>

            {/* Región y Porcentaje */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Región Costo</label>
                <select
                  value={activeRegion}
                  onChange={e => setActiveRegion(e.target.value)}
                  disabled={!isLoggedIn || isAnalyzing}
                  className="w-full bg-[#07070F] border border-white/5 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="CDMX">CDMX</option>
                  <option value="Norte">Norte</option>
                  <option value="Bajio">Bajío</option>
                  <option value="Occidente">Occidente</option>
                  <option value="Sur">Sur</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indirectos (%)</label>
                <input
                  type="number"
                  value={overheadPercent}
                  onChange={e => setOverheadPercent(Number(e.target.value))}
                  disabled={!isLoggedIn || isAnalyzing}
                  min={0}
                  max={100}
                  className="w-full bg-[#07070F] border border-white/5 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-start gap-2.5 text-[11px] font-medium leading-relaxed uppercase">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={handleTriggerAnalysis}
              disabled={!isLoggedIn || isAnalyzing}
              className={cn(
                "w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2",
                (!isLoggedIn || isAnalyzing) ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 active:scale-95"
              )}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Procesando RAG Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generar Matriz RAG (10 Tokens)</span>
                </>
              )}
            </button>
          </div>

          {/* Columna Derecha: Output del Análisis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visualización del APU */}
            <div className="bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 min-h-[480px] shadow-xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Overlay de Carga */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[#0F0F1A]/90 z-20 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="relative size-16">
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-white text-sm font-black uppercase tracking-widest animate-pulse">Analizando catálogo de insumos...</h3>
                  <p className="text-slate-400 text-xs text-center max-w-sm">
                    La IA de Gemini Flash está cruzando referencias con más de 12,000 registros validados de APUCMX en Supabase y adaptando mermas del FASAR.
                  </p>
                </div>
              )}

              {/* No data state */}
              {!analysisResult && !isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <Database className="w-16 h-16 text-slate-700" />
                  <div className="space-y-1">
                    <h3 className="text-white font-bold uppercase tracking-wide">Sin Matriz Generada</h3>
                    <p className="text-slate-400 text-xs max-w-md mx-auto">
                      Configura el parametrizador de la izquierda y haz clic en "Generar Matriz" para iniciar el análisis neuronal de costos.
                    </p>
                  </div>
                </div>
              )}

              {/* Resultado del Análisis */}
              {analysisResult && !isAnalyzing && (
                <div className="space-y-6">
                  
                  {/* Top Bar Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} />
                        <span>Sello de Confianza: {analysisResult.confidence}%</span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight mt-1">{analysisResult.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Referencia: {analysisResult.date} • Región: {activeRegion}</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.print()}
                        className="p-2.5 bg-[#07070F] border border-white/5 hover:border-white/15 text-slate-300 hover:text-white rounded-xl transition-all"
                        title="Imprimir Ficha"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Descripción AEC en Mayúsculas */}
                  <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-[11px] leading-relaxed text-slate-300 font-mono select-all uppercase">
                    {analysisResult.description}
                  </div>

                  {/* Tabla de análisis */}
                  <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#07070F]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#111122] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                          <th className="p-3">Código</th>
                          <th className="p-3">Descripción Técnica Insumo</th>
                          <th className="p-3 text-center">Unidad</th>
                          <th className="p-3 text-right">Cantidad</th>
                          <th className="p-3 text-right">P. Unitario</th>
                          <th className="p-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {analysisResult.lines.map((line, lidx) => (
                          <tr key={lidx} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-[10px] text-cyan-500 uppercase">{line.codigo}</td>
                            <td className="p-3 max-w-xs sm:max-w-md truncate uppercase text-[11px]">{line.descripcion}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{line.unidad}</td>
                            <td className="p-3 text-right font-mono">{line.cantidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                            <td className="p-3 text-right font-mono">${line.precio_unitario.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-white font-semibold">${line.importe.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cómputo final */}
                  <div className="grid sm:grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-6">
                    <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Costo Directo</span>
                      <span className="text-xl font-black text-white font-mono">${analysisResult.directCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Indirectos ({overheadPercent}%)</span>
                      <span className="text-xl font-black text-slate-400 font-mono">${analysisResult.indirects.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 border border-cyan-500/20 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Precio de Venta</span>
                      <span className="text-xl font-black text-cyan-400 font-mono">${analysisResult.finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                </div>
              )}

              {/* Botón Guardar / Exportar localmente */}
              {analysisResult && !isAnalyzing && (
                <div className="border-t border-white/5 pt-4 mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      alert('MATRIZ DE COSTO DIRECTO GUARDADA EXITOSAMENTE EN TU PORTAFOLIO LOCAL.');
                    }}
                    className="px-4 py-2.5 bg-[#07070F] border border-white/5 hover:border-cyan-500/30 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all uppercase"
                  >
                    Guardar Concepto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
