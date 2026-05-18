import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, HelpCircle, AlertCircle, RefreshCw, Headphones, Coins, Database, Sparkles, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from 'src/context/AuthContext';
import { useTokens } from 'src/context/TokenContext';
import { cn } from 'src/lib/utils';

// ─── Tipos de Mensajes ────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const AssistantChatbot = () => {
  const { isLoggedIn } = useAuth();
  const { balance, consumeTokens, paymentLink } = useTokens();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '¡HOLA! BIENVENIDO AL ASISTENTE DE BASE DE DATOS CON IA DE APUCMX. PUEDO BUSCAR CONCEPTOS, INSUMOS Y PRECIOS DIRECTO EN SUPABASE. CADA CONSULTA CONSUME EXACTAMENTE 1 TOKEN.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setErrorMessage(null);

    // Guard login
    if (!isLoggedIn) {
      setErrorMessage('DEBES INICIAR SESIÓN PARA USAR EL ASISTENTE CON IA.');
      return;
    }

    // Guard tokens
    const cost = 1;
    if (balance < cost) {
      setErrorMessage(`SALDO INSUFICIENTE. LA CONSULTA IA CONSUME ${cost} TOKEN PERO TIENES ${balance}.`);
      return;
    }

    const userText = inputValue;
    setInputValue('');

    // Agregar mensaje de usuario
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 1. Descontar 1 token real
      const description = `Consulta IA BD: ${userText.substring(0, 30)}`;
      const spendRes = await consumeTokens(cost, 'uso_matriz', description);

      if (!spendRes.ok) {
        setErrorMessage(spendRes.error ?? 'ERROR AL PROCESAR EL COBRO DE TOKEN.');
        setIsTyping(false);
        return;
      }

      // 2. Simular retardo de soporte
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Respuesta Inteligente de Soporte con formato AEC
      let aiText = '';
      const promptLower = userText.toLowerCase();

      if (promptLower.includes('tokens') || promptLower.includes('saldo') || promptLower.includes('recarga') || promptLower.includes('pago')) {
        aiText = 'PARA RECARGAR TU SALDO DE TOKENS, VE A LA SECCIÓN DE TOKENS EN EL MENÚ SUPERIOR. LOS PAGOS SE PROCESAN DE FORMA SEGURA CON STRIPE Y SE ACTUALIZAN AL INSTANTE.';
      } else if (promptLower.includes('provedor') || promptLower.includes('empresa') || promptLower.includes('logo') || promptLower.includes('pdf')) {
        aiText = 'EL REGISTRO DE EMPRESA Y SUBIDA DE LOGO O CATÁLOGO EN PDF SE REALIZA DESDE LA SECCIÓN DE PROVEEDORES. TIENE UN COSTO DE 100 MXN MENSUALES. LOS CATÁLOGOS SE PROCESAN CON INTELIGENCIA ARTIFICIAL.';
      } else if (promptLower.includes('analisis') || promptLower.includes('ia') || promptLower.includes('auditar') || promptLower.includes('presupuesto')) {
        aiText = 'NUESTRA HERRAMIENTA DE ANÁLISIS IA ESTÁ DIVIDIDA EN: "CONSTRUCTORES" PARA GENERAR PRESUPUESTOS EN PDF CON NUEBRA BASE DE DATOS SUPABASE, Y "PROFESIONALES" PARA SUBIR Y AUDITAR TUS PROPIOS ARCHIVOS.';
      } else if (promptLower.includes('error') || promptLower.includes('fallo') || promptLower.includes('cargar') || promptLower.includes('bug')) {
        aiText = 'HEMOS REGISTRADO TU INCIDENTE EN EL LOG DEL SISTEMA. NUESTROS DESARROLLADORES DE APUCMX ESTÁN REVISANDO LA SESIÓN PARA CORREGIR CUALQUIER ANOMALÍA EN EL SERVIDOR. GRACIAS POR REPORTARLO.';
      } else {
        aiText = 'ASISTENTE DE BASE DE DATOS IA: HEMOS RECIBIDO TU CONSULTA ACERCA DE "' + userText.toUpperCase() + '". SI TIENES DUDAS SOBRE LAS PESTAÑAS, LA BASE DE DATOS O MÓDULOS DE LA APLICACIÓN, ESTAMOS A TU DISPOSICIÓN.';
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      setErrorMessage(err.message || 'OCURRIÓ UN ERROR AL PROCESAR TU CONSULTA DE SOPORTE.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80] font-sans antialiased text-slate-100">
      
      {/* ── Botón flotante ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "size-14 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-blue-600 to-red-600 shadow-2xl relative transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          isOpen ? "rotate-90 bg-slate-800" : ""
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X key="close" size={24} />
          ) : (
            <div key="chat" className="relative flex items-center justify-center">
              <Sparkles size={24} className="group-hover:rotate-6 transition-transform text-white animate-pulse" />
              {/* Pulso de brillo azul */}
              <span className="absolute -inset-1.5 rounded-full bg-blue-500/20 blur-sm animate-ping -z-10" />
            </div>
          )}
        </AnimatePresence>
      </button>

      {/* ── Ventana del Chatbot ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute bottom-16 right-0 w-[380px] h-[550px] bg-[#0F0F1E]/95 border border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-xl"
          >
            
            {/* Header */}
            <div className="p-4 bg-[#14142B] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center text-white">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Asistente de BD con IA</span>
                    <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">APUCMX SYSTEM 2026</p>
                </div>
              </div>

              {/* Wallet Live Badge */}
              <div className="flex items-center gap-1.5 bg-[#07070F] border border-white/5 px-2.5 py-1 rounded-xl text-yellow-400">
                <Coins size={12} className="animate-spin-slow" />
                <span className="text-[11px] font-black font-mono">{balance}</span>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-1",
                    m.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed",
                      m.sender === 'user'
                        ? "bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-br-none font-medium"
                        : "bg-[#07070F] border border-white/5 text-slate-300 rounded-bl-none font-mono"
                    )}
                  >
                    {m.text}
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {m.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 bg-[#07070F] border border-white/5 px-4 py-2.5 rounded-2xl mr-auto max-w-[85%] rounded-bl-none">
                  <RefreshCw size={12} className="animate-spin text-blue-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Procesando tu solicitud...</span>
                </div>
              )}

              {/* Error Panel */}
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 flex items-start gap-2 text-[10px] leading-relaxed uppercase">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{errorMessage}</span>
                    {errorMessage.includes('SALDO') && (
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-blue-400 hover:text-white font-bold transition-colors underline"
                      >
                        RECARGAR SALDO CON STRIPE
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#07070F] border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isTyping}
                placeholder="Escribe tu consulta de soporte aquí..."
                className="flex-1 bg-[#111122] border border-white/5 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className={cn(
                  "size-8 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center text-white transition-all",
                  (isTyping || !inputValue.trim()) ? "opacity-40 cursor-not-allowed" : "hover:brightness-110 active:scale-95"
                )}
              >
                <Send size={14} />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
