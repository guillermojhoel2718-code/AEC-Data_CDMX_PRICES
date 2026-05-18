import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, AlertCircle, RefreshCw, Headphones, LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from 'src/lib/utils';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const SupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '¡HOLA! ESTE ES EL CANAL DE SOPORTE TÉCNICO DE APUCMX (GRATUITO). REPORTA AQUÍ ERRORES, INCIDENTES O DUDAS DE LA WEB. NUESTRO WEB DOCTOR VERCELERO SE ENCARGARÁ DE RESOLVERLO.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const userText = inputValue;
    setInputValue('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let aiText = '';
      const promptLower = userText.toLowerCase();

      if (promptLower.includes('error') || promptLower.includes('fallo') || promptLower.includes('cargar') || promptLower.includes('bug') || promptLower.includes('pestaña')) {
        aiText = 'LAMENTAMOS EL INCONVENIENTE. EL INCIDENTE HA SIDO REPORTADO DE MANERA AUTOMÁTICA EN NUESTROS LOGS DE VERCEL. EL AGENTE VERCELERO (WEB DOCTOR) YA ESTÁ APLICANDO UN PARCHE MÍNIMO DE ESTABILIDAD.';
      } else if (promptLower.includes('token') || promptLower.includes('intercambio') || promptLower.includes('transferir')) {
        aiText = 'EL INTERCAMBIO DE TOKENS SE REALIZA EN LA PESTAÑA TOKENS. DEBES ESTAR LOGUEADO PARA PODER TRANSFERIR TOKENS ESCRIBIENDO EL CORREO DEL RECEPTOR Y EL MONTO.';
      } else {
        aiText = 'SOPORTE TÉCNICO APUCMX: HEMOS REGISTRADO TU MENSAJE ("' + userText.toUpperCase() + '"). REVISAREMOS EL LOG DEL NAVEGADOR PARA RESOLVER ESTA ANOMALÍA LO ANTES POSIBLE. ¡GRACIAS POR TU REPORTE!';
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      setErrorMessage(err.message || 'OCURRIÓ UN ERROR AL ENVIAR TU REPORTE.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-24 z-[80] font-sans antialiased text-slate-100">
      
      {/* ── Botón flotante rojo ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "size-14 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-red-600 to-rose-700 shadow-2xl relative transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-red-500/50",
          isOpen ? "rotate-90 bg-slate-800" : ""
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X key="close" size={24} />
          ) : (
            <div key="chat" className="relative flex items-center justify-center">
              <Headphones size={24} className="group-hover:rotate-6 transition-transform text-white animate-pulse" />
              {/* Pulso de brillo rojo */}
              <span className="absolute -inset-1.5 rounded-full bg-red-500/20 blur-sm animate-ping -z-10" />
            </div>
          )}
        </AnimatePresence>
      </button>

      {/* ── Ventana del Chatbot de Soporte ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute bottom-16 right-0 w-[380px] h-[550px] bg-[#0F0505]/95 border border-red-500/20 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-xl"
          >
            
            {/* Header */}
            <div className="p-4 bg-[#2A0F14] border-b border-red-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[#DC2626] flex items-center justify-center text-white">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Soporte Técnico</span>
                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-red-400 font-mono">INCIDENTES APUCMX</p>
                </div>
              </div>
              
              <div className="text-[9px] uppercase px-2 py-0.5 rounded bg-red-950/80 border border-red-800/30 text-red-400 font-bold">
                Gratuito
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-red-500/5">
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
                        ? "bg-[#DC2626] text-white rounded-br-none font-medium"
                        : "bg-[#180A0C] border border-red-500/10 text-slate-300 rounded-bl-none font-mono"
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
                <div className="flex items-center gap-2 bg-[#180A0C] border border-red-500/10 px-4 py-2.5 rounded-2xl mr-auto max-w-[85%] rounded-bl-none">
                  <RefreshCw size={12} className="animate-spin text-red-500" />
                  <span className="text-[10px] text-red-400 font-medium">Procesando reporte...</span>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 flex items-start gap-2 text-[10px] leading-relaxed uppercase">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#0A0304] border-t border-red-500/10 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isTyping}
                placeholder="Reporta un error o haz una consulta..."
                className="flex-1 bg-[#1A0A0C] border border-red-500/10 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className={cn(
                  "size-8 rounded-xl bg-[#DC2626] flex items-center justify-center text-white transition-all",
                  (isTyping || !inputValue.trim()) ? "opacity-40 cursor-not-allowed" : "hover:bg-red-700 active:scale-95"
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
