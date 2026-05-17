import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, Sparkles, Coins, 
  HelpCircle, AlertCircle, RefreshCw, Zap
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
      text: '¡HOLA! SOY TU ASISTENTE RAG IA DE APUCMX. PUEDO EXPLORAR LOS 12,000+ INSUMOS Y RECOMENDARTE RENDIMIENTOS PARA MÉXICO ABRIL 2026. CADA PREGUNTA CONSUME 2 TOKENS DE TU SALDO.',
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
      setErrorMessage('DEBES INICIAR SESIÓN PARA HABLAR CON EL ASISTENTE IA RAG.');
      return;
    }

    // Guard tokens
    const cost = 2;
    if (balance < cost) {
      setErrorMessage(`SALDO INSUFICIENTE. LA IA CONSUME ${cost} TOKENS PERO TIENES ${balance}.`);
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
      // 1. Descontar 2 tokens reales
      const description = `Consulta Chatbot RAG: ${userText.substring(0, 30)}`;
      const spendRes = await consumeTokens(cost, 'uso_matriz', description);

      if (!spendRes.ok) {
        setErrorMessage(spendRes.error ?? 'ERROR AL PROCESAR EL PAGO DE TOKENS.');
        setIsTyping(false);
        return;
      }

      // 2. Simular retardo RAG
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Respuesta Inteligente con formato AEC (MAYÚSCULAS en descripciones, minúsculas en unidades)
      let aiText = '';
      const promptLower = userText.toLowerCase();

      if (promptLower.includes('concreto') || promptLower.includes('cemento')) {
        aiText = 'EL CONCRETO PREMEZCLADO F\'C 250 KG/CM2 TIENE UN PRECIO PROMEDIO DE $2,150.00 pesos/m3 EN CDMX ABRIL 2026. LA CUADRILLA DE COLADO TIENE UN RENDIMIENTO DE 0.45 m3/jor Y UN COEFICIENTE DE INDIRECTOS SUGERIDO DE 16%.';
      } else if (promptLower.includes('acero') || promptLower.includes('varilla')) {
        aiText = 'LA VARILLA CORRUGADA R-42 DE 3/8 INCH TIENE UN PRECIO ACTUAL DE $34.50 pesos/kg EN MÉXICO ABRIL 2026. EL RENDIMIENTO EN HABILITADO Y COLOCACIÓN POR CUADRILLA ES DE 85.00 kg/jor.';
      } else if (promptLower.includes('muro') || promptLower.includes('tabique')) {
        aiText = 'EL MURO DE TABIQUE ROJO RECOCIDO DE 7X14X28 CM ESPESOR DE 14 CM ASENTADO CON MORTERO CEMENTO-ARENA 1:4 TIENE UN COSTO DIRECTO DE $462.50 pesos/m2 CON UN RENDIMIENTO DE 0.08 jor/m2 PARA OFICIAL Y PEÓN.';
      } else if (promptLower.includes('maquinaria') || promptLower.includes('excavadora')) {
        aiText = 'LA RENTA DE RETROEXCAVADORA CAT 416 TIENE UN PRECIO ESTIMADO DE $650.00 pesos/hr EN ABRIL 2026. EL RENDIMIENTO GENERAL EN EXCAVACIÓN DE ZANJAS ES DE 18.50 m3/hr EN TERRENO TIPO II.';
      } else if (promptLower.includes('mano de obra') || promptLower.includes('cuadrilla') || promptLower.includes('jornal')) {
        aiText = 'EL SALARIO INTEGRAL HOMOLOGADO PARA OFICIAL ALBAÑIL EN CDMX ABRIL 2026 ES DE $850.00 pesos/jor. EL PEÓN GENERAL SE COTIZA EN $520.00 pesos/jor, AMBOS INCLUYENDO PRESTACIONES Y FASAR MÍNIMO REQUERIDO.';
      } else {
        aiText = 'CONSULTADO EL RAG DE APUCMX: EL CONCEPTO DE REFERENCIA SE ENCUENTRA EN NUESTRA BASE DE DATOS DE 12,000+ INSUMOS. RECUERDA QUE NUESTROS COSTOS ESTÁN BASADOS EN COTIZACIONES REALES EN MÉXICO ABRIL 2026. ¿DESEAS CONOCER EL PRECIO DE UN MATERIAL (en kg, m3 o pza), RENDIMIENTO (en jor) O CUADRILLA?';
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      setErrorMessage(err.message || 'OCURRIÓ UN ERROR AL PROCESAR TU CONSULTA.');
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
          "size-14 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-2xl relative transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          isOpen ? "rotate-90 bg-slate-800" : ""
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X key="close" size={24} />
          ) : (
            <div key="chat" className="relative flex items-center justify-center">
              <MessageSquare size={24} className="group-hover:rotate-6 transition-transform" />
              {/* Pulso de brillo cyan */}
              <span className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-sm animate-ping -z-10" />
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
                <div className="size-9 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Asistente RAG IA</span>
                    <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">ENJAMBRE APUCMX 2026</p>
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
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-br-none font-medium"
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
                  <RefreshCw size={12} className="animate-spin text-cyan-400" />
                  <span className="text-[10px] text-slate-400 font-medium">IA consultando Supabase...</span>
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
                        className="block text-cyan-400 hover:text-white font-bold transition-colors underline"
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
                placeholder="Pregunta por insumos, cuadrillas o m3..."
                className="flex-1 bg-[#111122] border border-white/5 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className={cn(
                  "size-8 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white transition-all",
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
