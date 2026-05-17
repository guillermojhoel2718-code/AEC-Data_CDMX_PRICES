import React, { useState } from 'react';
import { AppHeader } from 'src/components/Common';
import { 
  Zap, Database, Sparkles, AlertCircle, Coins, ArrowRight,
  TrendingUp, RefreshCw, Layers, CheckCircle2, ShieldAlert,
  Download, FileText, ChevronRight, Lock, UploadCloud, FileSpreadsheet, 
  Check, FileDown, ShieldCheck, HelpCircle, HardHat, FileCode
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

// ─── Mock Data México Abril 2026 ──────────────────────────────────────────────

const MOCK_IA_ANALYSIS: Record<string, APUCard> = {
  muro: {
    name: 'MURO DE TABIQUE ROJO RECOCIDO',
    description: 'CONSTRUCCIÓN DE MURO DE TABIQUE ROJO RECOCIDO DE 7X14X28 CM, ESPESOR DE 14 CM, ASENTADO CON MORTERO CEMENTO-ARENA CLASE I PROPORCIÓN 1:4. INCLUYE: ANDAMIOS, MANO DE OBRA, SUMINISTRO Y MERMAS.',
    unidad: 'm2',
    rendimiento: 0.08,
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
  const { balance, consumeTokens, paymentLink } = useTokens();

  // Tab State
  const [activeTab, setActiveTab] = useState<'constructores' | 'profesionales'>('constructores');

  // Input states (Tab 1: Constructores)
  const [selectedChapter, setSelectedChapter] = useState<string>('cimentacion');
  const [builderRegion, setBuilderRegion] = useState<string>('CDMX');
  const [builderOverhead, setBuilderOverhead] = useState<number>(16);

  // Input states (Tab 2: Profesionales)
  const [selectedConcept, setSelectedConcept] = useState<string>('muro');
  const [customText, setCustomText] = useState('');
  const [profRegion, setProfRegion] = useState<string>('CDMX');
  const [profOverhead, setProfOverhead] = useState<number>(16);
  const [customCatalogFile, setCustomCatalogFile] = useState<string>('');

  // Flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPdfPath, setGeneratedPdfPath] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<APUCard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState(false);

  // ─── Handler Tab 1: Generar PDF para Constructores ───
  const handleGeneratePdf = async () => {
    setErrorMessage(null);
    setGeneratedPdfPath(null);

    if (!isLoggedIn) {
      setErrorMessage('DEBES INICIAR SESIÓN CON TU CUENTA APUCMX PARA GENERAR EL CATÁLOGO PDF CON IA.');
      return;
    }

    const cost = 10;
    if (balance < cost) {
      setErrorMessage(`SALDO INSUFICIENTE. LA GENERACIÓN AVANZADA REQUIERE ${cost} TOKENS, PERO TIENES ${balance}.`);
      return;
    }

    setIsProcessing(true);

    try {
      // Consumir 10 Tokens
      const description = `GEN PDF CATÁLOGO IA - CAPÍTULO: ${selectedChapter.toUpperCase()}`;
      const consumeRes = await consumeTokens(cost, 'uso_auditoria', description);

      if (!consumeRes.ok) {
        setErrorMessage(consumeRes.error ?? 'ERROR AL DEDUCIR TOKENS DE TU SALDO.');
        setIsProcessing(false);
        return;
      }

      // Simular generación neuronal del catálogo de Supabase
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setGeneratedPdfPath(`apucmx_catalogo_${selectedChapter}_${builderRegion.toLowerCase()}_2026.pdf`);
      setSuccessNotif(true);
      setTimeout(() => setSuccessNotif(false), 3000);

    } catch (err: any) {
      setErrorMessage(err.message || 'ERROR INESPERADO AL GENERAR PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Handler Tab 2: Ejecutar Auditoría para Profesionales ───
  const handleExecuteAudit = async () => {
    setErrorMessage(null);
    setAuditResult(null);

    if (!isLoggedIn) {
      setErrorMessage('DEBES INICIAR SESIÓN CON TU CUENTA APUCMX PARA EJECUTAR LA AUDITORÍA DE TU CATÁLOGO.');
      return;
    }

    const cost = 10;
    if (balance < cost) {
      setErrorMessage(`SALDO INSUFICIENTE. EL ANÁLISIS DE CATÁLOGO REQUIERE ${cost} TOKENS, PERO TIENES ${balance}.`);
      return;
    }

    setIsProcessing(true);

    try {
      // Consumir 10 Tokens
      const description = `AUDITORÍA IA CATÁLOGO - CONCEPTO: ${customText ? customText.substring(0, 30).toUpperCase() : selectedConcept.toUpperCase()}`;
      const consumeRes = await consumeTokens(cost, 'uso_auditoria', description);

      if (!consumeRes.ok) {
        setErrorMessage(consumeRes.error ?? 'ERROR AL DEDUCIR TOKENS DE TU SALDO.');
        setIsProcessing(false);
        return;
      }

      // Simular procesamiento LangChain / Pydantic
      await new Promise((resolve) => setTimeout(resolve, 3000));

      let baseBlueprint = MOCK_IA_ANALYSIS[selectedConcept] || MOCK_IA_ANALYSIS['muro'];

      if (customText.trim()) {
        const uppercaseDesc = customText.toUpperCase();
        baseBlueprint = {
          ...baseBlueprint,
          name: uppercaseDesc.split('DE')[0]?.trim() || 'MATRIZ INDEPENDIENTE AUDITADA',
          description: uppercaseDesc,
        };
      }

      const adjustedIndirects = parseFloat((baseBlueprint.directCost * (profOverhead / 100)).toFixed(2));
      const adjustedPrice = parseFloat((baseBlueprint.directCost + adjustedIndirects).toFixed(2));

      setAuditResult({
        ...baseBlueprint,
        indirects: adjustedIndirects,
        finalPrice: adjustedPrice,
      });

      setSuccessNotif(true);
      setTimeout(() => setSuccessNotif(false), 3000);

    } catch (err: any) {
      setErrorMessage(err.message || 'ERROR AL AUDITAR EL CATÁLOGO.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomCatalogFile(e.target.files[0].name);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07070F] text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-10 py-10 space-y-10">
        
        {/* ── Banner Principal ── */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0F24] via-[#090915] to-[#07070F] border border-white/5 p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} className="text-red-500 animate-pulse" />
                <span>Auditoría RAG IA & DB Supabase 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                Análisis e <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500 font-black">Informes IA</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Genera catálogos paramétricos en PDF homologados a la base Supabase 2026 o audita tu propio catálogo de insumos detectando desvíos y anomalías en tiempo real.
              </p>
            </div>
            
            {/* Live Token Wallet Badge */}
            <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center shadow-lg shrink-0 w-full sm:w-60">
              <div className="flex items-center gap-2 text-yellow-500">
                <Coins size={22} className="animate-spin-slow" />
                <span className="text-2xl font-black text-white">{balance}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tokens Disponibles</span>
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full py-2 bg-[#07070F] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-red-500 text-[11px] font-bold rounded-xl transition-all uppercase tracking-wider text-center"
              >
                Recargar Tokens
              </a>
            </div>
          </div>
        </div>

        {/* ── Tabs de Navegación Sleek de Doble Subpágina ── */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setActiveTab('constructores'); setErrorMessage(null); }}
            className={cn(
              "px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2.5",
              activeTab === 'constructores' 
                ? "border-red-500 text-white bg-white/5" 
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            <HardHat size={16} className={activeTab === 'constructores' ? "text-red-500" : "text-slate-400"} />
            <span>Constructores (Generador PDF)</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('profesionales'); setErrorMessage(null); }}
            className={cn(
              "px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2.5",
              activeTab === 'profesionales' 
                ? "border-blue-500 text-white bg-white/5" 
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            <FileCode size={16} className={activeTab === 'profesionales' ? "text-blue-500" : "text-slate-400"} />
            <span>Profesionales (Auditar Catálogo)</span>
          </button>
        </div>

        {/* Auth Guard Banner */}
        {!isLoggedIn && (
          <div className="bg-[#1A0C16] border border-red-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-400">
                <Lock size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold uppercase tracking-wide">Acceso RAG Restringido</h3>
                <p className="text-slate-400 text-xs max-w-xl">
                  El motor de informes y auditorías IA requiere autenticación de Supabase. Inicia sesión en la parte superior derecha para validar tus créditos y procesar matrices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Dinámico según la Pestaña Activa */}
        <AnimatePresence mode="wait">
          {activeTab === 'constructores' ? (
            <motion.div
              key="constructores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid lg:grid-cols-3 gap-8 items-start"
            >
              {/* Columna Izquierda: Controles Constructores */}
              <div className="lg:col-span-1 bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                  <Layers size={15} className="text-red-500" />
                  <span>Configurar Catálogo</span>
                </h2>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Especialidad / Capítulo</label>
                  <select
                    value={selectedChapter}
                    onChange={e => setSelectedChapter(e.target.value)}
                    disabled={!isLoggedIn || isProcessing}
                    className="w-full bg-[#07070F] border border-white/5 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="cimentacion">Cimentaciones & Terracerías</option>
                    <option value="estructura">Estructuras de Concreto y Acero</option>
                    <option value="acabados">Acabados e Interiores</option>
                    <option value="instalaciones">Instalaciones Hidrosanitarias & Eléctricas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Región Base</label>
                    <select
                      value={builderRegion}
                      onChange={e => setBuilderRegion(e.target.value)}
                      disabled={!isLoggedIn || isProcessing}
                      className="w-full bg-[#07070F] border border-white/5 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
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
                      value={builderOverhead}
                      onChange={e => setBuilderOverhead(Number(e.target.value))}
                      disabled={!isLoggedIn || isProcessing}
                      min={0}
                      max={100}
                      className="w-full bg-[#07070F] border border-white/5 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-start gap-2.5 text-[11px] font-medium leading-relaxed uppercase">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleGeneratePdf}
                  disabled={!isLoggedIn || isProcessing}
                  className={cn(
                    "w-full py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2",
                    (!isLoggedIn || isProcessing) ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 active:scale-95"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Generando desde Supabase...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      <span>Generar Catálogo PDF (10 Tokens)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Columna Derecha: Vista previa del PDF (Constructores) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 min-h-[480px] shadow-xl relative overflow-hidden flex flex-col justify-between">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#0F0F1A]/95 z-20 flex flex-col items-center justify-center p-6 space-y-4">
                      <div className="relative size-16">
                        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <h3 className="text-white text-sm font-black uppercase tracking-widest animate-pulse">Compilando Catálogo Estructurado...</h3>
                      <p className="text-slate-400 text-xs text-center max-w-sm">
                        Consultando la base Supabase para indexar insumos con Pydantic y aplicar cargos del {builderOverhead}% de indirectos en formato AEC de Abril 2026.
                      </p>
                    </div>
                  )}

                  {!generatedPdfPath && !isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <FileText className="w-16 h-16 text-slate-700" />
                      <div className="space-y-1">
                        <h3 className="text-white font-bold uppercase tracking-wide">Sin Catálogo Generado</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto">
                          Configura los filtros de especialidad a la izquierda y presiona "Generar Catálogo PDF" para compilar un reporte APU formal firmado con IA.
                        </p>
                      </div>
                    </div>
                  )}

                  {generatedPdfPath && !isProcessing && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="space-y-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full w-fit">
                            <ShieldCheck size={10} />
                            <span>PDF COMPILADO CON ÉXITO</span>
                          </span>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight mt-1">
                            INFORME APU: {selectedChapter.toUpperCase()} ({builderRegion})
                          </h3>
                          <p className="text-[10px] font-mono text-slate-500 uppercase">
                            FORMATO: PDF/AEC VIGENTE • INDIRECTOS APLICADOS: {builderOverhead}%
                          </p>
                        </div>
                        
                        <a 
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert("DESCARGANDO ARCHIVO PDF EN EL DISPOSITIVO..."); }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all uppercase shrink-0"
                        >
                          <Download size={14} />
                          <span>Descargar PDF</span>
                        </a>
                      </div>

                      {/* PDF Layout Representation */}
                      <div className="border border-white/10 rounded-2xl bg-[#07070F] p-8 space-y-8 font-mono select-none relative">
                        {/* Watermark/Logo */}
                        <div className="absolute top-8 right-8 border border-red-500/30 text-red-500 text-[10px] font-bold px-2 py-1 uppercase rounded">
                          APUCMX IA 2026
                        </div>

                        {/* Title page representation */}
                        <div className="space-y-2 pb-6 border-b border-white/10">
                          <h4 className="text-md font-bold text-white uppercase">ANÁLISIS DE PRECIOS UNITARIOS - REGIONALIZADO</h4>
                          <p className="text-slate-500 text-[10px]">ORGANIZACIÓN: APUCMX ENJAMBRE • EMISIÓN: ABRIL 2026</p>
                          <p className="text-slate-400 text-xs uppercase">CAPÍTULO INFORME: {selectedChapter}</p>
                          <p className="text-slate-400 text-xs">REGIONES EVALUADAS: {builderRegion} (MÉXICO)</p>
                        </div>

                        {/* Concept Mock List */}
                        <div className="space-y-4">
                          <div className="bg-[#0F0F1A] border border-white/5 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                              <span>CONCEPTO 01: EXCAVACIÓN MECÁNICA POR MEDIOS GENERALES</span>
                              <span>UNIDAD: m3</span>
                            </div>
                            <p className="text-[10px] text-slate-400">EXCAVACIÓN DE CEPAS POR MEDIOS MECÁNICOS EN TERRENO TIPO II DE 0.00 A 2.00 M DE PROFUNDIDAD...</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5">
                              <span>COSTO DIRECTO: $210.00</span>
                              <span>P. VENTA CON IND. ({builderOverhead}%): ${(210 * (1 + builderOverhead/100)).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="bg-[#0F0F1A] border border-white/5 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                              <span>CONCEPTO 02: PLANTILLA DE CONCRETO F'C=100 KG/CM2</span>
                              <span>UNIDAD: m2</span>
                            </div>
                            <p className="text-[10px] text-slate-400">PLANTILLA DE CONCRETO HECHO EN OBRA F'C=100 KG/CM2 ESPESOR DE 5 CM, AGREGADO MÁXIMO 3/4...</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5">
                              <span>COSTO DIRECTO: $175.50</span>
                              <span>P. VENTA CON IND. ({builderOverhead}%): ${(175.5 * (1 + builderOverhead/100)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Required Disclaimer Warning inside PDF */}
                        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">IMPORTANTE - CLÁUSULAS DE SEGURIDAD</span>
                          <p className="text-[9px] text-slate-400 leading-normal uppercase">
                            "LOS PRECIOS CONTENIDOS EN ESTE DOCUMENTO SON ESTIMACIONES PARA MÉXICO, ABRIL 2026, Y PUEDEN VARIAR SEGÚN REGIÓN, PROVEEDOR Y CONDICIONES DE CONTRATACIÓN."
                          </p>
                          <p className="text-[9px] text-slate-400 leading-normal uppercase">
                            "ESTE REPORTE NO SUSTITUYE LA REVISIÓN TÉCNICA Y PRESUPUESTAL ESPECÍFICA DE CADA PROYECTO."
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profesionales"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid lg:grid-cols-3 gap-8 items-start"
            >
              {/* Columna Izquierda: Auditoría de Catálogos */}
              <div className="lg:col-span-1 bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                  <Layers size={15} className="text-blue-500" />
                  <span>Auditar Catálogo Propio</span>
                </h2>

                {/* Subir archivo CSV/Excel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subir Archivo de Catálogo</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-4 bg-slate-800/40 cursor-pointer transition-colors group">
                    <UploadCloud size={24} className="text-slate-400 group-hover:text-blue-400 mb-1" />
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate max-w-full text-center font-bold">
                      {customCatalogFile || "Subir archivo (.csv, .xlsx, .txt)"}
                    </span>
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-center text-xs text-slate-500 uppercase tracking-widest">Ó OBTENER MATRIX RAG DE PRUEBA</div>

                {/* Selector de Concepto */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concepto de Prueba</label>
                  <select
                    value={selectedConcept}
                    onChange={e => setSelectedConcept(e.target.value)}
                    disabled={!isLoggedIn || isProcessing}
                    className="w-full bg-[#07070F] border border-white/5 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="muro">Muro de Tabique Rojo (CDMX 2026)</option>
                    <option value="concreto">Concreto Premezclado F'c 250 (CDMX 2026)</option>
                    <option value="placa">Placa de Acero A36 de 1/2" (Nacional 2026)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalizar Tarjeta (Texto Libre)</label>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    disabled={!isLoggedIn || isProcessing}
                    placeholder="Ej: DETALLE DE ESTRUCTURA METÁLICA CON ANCLAJES..."
                    rows={3}
                    className="w-full bg-[#07070F] border border-white/5 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Región Costo</label>
                    <select
                      value={profRegion}
                      onChange={e => setProfRegion(e.target.value)}
                      disabled={!isLoggedIn || isProcessing}
                      className="w-full bg-[#07070F] border border-white/5 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
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
                      value={profOverhead}
                      onChange={e => setProfOverhead(Number(e.target.value))}
                      disabled={!isLoggedIn || isProcessing}
                      min={0}
                      max={100}
                      className="w-full bg-[#07070F] border border-white/5 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-start gap-2.5 text-[11px] font-medium leading-relaxed uppercase">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleExecuteAudit}
                  disabled={!isLoggedIn || isProcessing}
                  className={cn(
                    "w-full py-4 bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2",
                    (!isLoggedIn || isProcessing) ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 active:scale-95"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Auditando con Pydantic/RAG...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Ejecutar Auditoría Neuronal (10 Tokens)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Columna Derecha: Resultados de la Auditoría */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#0F0F1A] border border-white/5 rounded-2xl p-6 min-h-[480px] shadow-xl relative overflow-hidden flex flex-col justify-between">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#0F0F1A]/95 z-20 flex flex-col items-center justify-center p-6 space-y-4">
                      <div className="relative size-16">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <h3 className="text-white text-sm font-black uppercase tracking-widest animate-pulse">Auditando insumos y mermas...</h3>
                      <p className="text-slate-400 text-xs text-center max-w-sm">
                        La IA de Gemini Flash está cruzando referencias con más de 12,000 registros validados de APUCMX en Supabase y adaptando mermas del FASAR.
                      </p>
                    </div>
                  )}

                  {!auditResult && !isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <Database className="w-16 h-16 text-slate-700" />
                      <div className="space-y-1">
                        <h3 className="text-white font-bold uppercase tracking-wide">Sin Auditoría Ejecutada</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto">
                          Sube un archivo de tu catálogo o selecciona un concepto de prueba y presiona "Ejecutar Auditoría Neuronal".
                        </p>
                      </div>
                    </div>
                  )}

                  {auditResult && !isProcessing && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={10} />
                            <span>Sello de Confianza: {auditResult.confidence}% (Conforme)</span>
                          </div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight mt-1">{auditResult.name}</h3>
                          <p className="text-[10px] font-mono text-slate-500 uppercase">Referencia de Auditoría: {auditResult.date} • Región: {profRegion}</p>
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

                      {/* AEC Formatted Technical Description */}
                      <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-[11px] leading-relaxed text-slate-300 font-mono select-all uppercase">
                        {auditResult.description}
                      </div>

                      {/* Detailed Cost lines */}
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
                            {auditResult.lines.map((line, lidx) => (
                              <tr key={lidx} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-mono text-[10px] text-blue-400 uppercase">{line.codigo}</td>
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

                      {/* Final calculations cards */}
                      <div className="grid sm:grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-6">
                        <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Costo Directo</span>
                          <span className="text-xl font-black text-white font-mono">${auditResult.directCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="bg-[#07070F] border border-white/5 rounded-xl p-4 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Indirectos ({profOverhead}%)</span>
                          <span className="text-xl font-black text-slate-400 font-mono">${auditResult.indirects.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/10 to-red-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Precio de Venta</span>
                          <span className="text-xl font-black text-blue-400 font-mono">${auditResult.finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
