import React, { useState, useEffect } from 'react';
import { AppHeader, MembershipTier } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  MessageSquare, Users, TrendingUp, 
  Lock, Star, Search, Filter, 
  MoreHorizontal, ThumbsUp, MessageCircle, 
  Share2, ShieldCheck, User, Plus, X, 
  Link as LinkIcon, Check
} from 'lucide-react';

export const ForumPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [membership, setMembership] = useState<MembershipTier>((localStorage.getItem('membership') as MembershipTier) || 'gratis');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setMembership((localStorage.getItem('membership') as MembershipTier) || 'gratis');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleShare = (postId: number) => {
    const shareUrl = `${window.location.origin}/forum/post/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  if (membership === 'gratis') {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-slate-900 border border-primary/20 rounded-2xl p-10 shadow-2xl">
            <div className="bg-primary/20 p-6 rounded-full border border-primary/30 mb-6 inline-flex">
              <MessageSquare size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Foro de Expertos</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              El foro de conversaciones y el tablón de anuncios están restringidos a usuarios con membresía activa. Únete a la comunidad de expertos en costos.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new Event('open-membership-modal'))}
              className="w-full bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all"
            >
              Obtener Membresía
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Foro de <span className="text-primary">Expertos</span></h1>
                <p className="text-slate-400 font-medium">Conversaciones sobre costos, materiales y tendencias de construcción.</p>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-new-post-modal'))}
                className="bg-primary hover:brightness-110 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Plus size={18} />
                Nueva Publicación
              </button>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 flex-1 flex items-center gap-3">
                <Search size={18} className="text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Buscar en el foro..."
                  className="bg-transparent border-none outline-none text-white text-sm w-full"
                />
              </div>
              <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Filter size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {[
                {
                  id: 1,
                  user: 'Arq. Roberto Méndez',
                  role: 'Validador Senior',
                  time: 'Hace 2 horas',
                  title: 'Alza en el precio del acero estructural en la región Norte',
                  content: 'He notado un incremento del 15% en los perfiles estructurales durante la última semana. ¿Alguien más ha tenido problemas con sus presupuestos actuales?',
                  likes: 24,
                  comments: 12,
                  tags: ['Materiales', 'Precios'],
                  replies: [
                    { user: 'Ing. Juan Perez', content: 'En Monterrey el kilo subió casi 3 pesos desde el lunes.', time: 'Hace 1 hora' },
                    { user: 'Dra. Ana G.', content: 'Es por la fluctuación del dólar y la demanda en proyectos industriales.', time: 'Hace 30 min' }
                  ]
                },
                {
                  id: 2,
                  user: 'Ing. Laura Silva',
                  role: 'Miembro Gold',
                  time: 'Hace 5 horas',
                  title: 'Duda sobre rendimientos en excavación manual tipo C',
                  content: '¿Qué rendimiento promedio están considerando para excavación en terreno tipo C a una profundidad de 2.00m? Mis cuadrillas están reportando 0.8 m3/jor.',
                  likes: 15,
                  comments: 32,
                  tags: ['Rendimientos', 'Mano de Obra'],
                  replies: [
                    { user: 'Arq. Luis M.', content: '0.8 es bajo, usualmente andamos en 1.2 m3/jor para tipo C.', time: 'Hace 4 horas' }
                  ]
                },
                {
                  id: 3,
                  user: 'Constructora Alfa',
                  role: 'Empresarial',
                  time: 'Hace 1 día',
                  title: 'Nuevas normativas de seguridad en CDMX 2024',
                  content: 'Comparto el enlace a las nuevas disposiciones oficiales que afectarán los costos indirectos de seguridad en obra a partir del próximo mes.',
                  likes: 45,
                  comments: 8,
                  tags: ['Normativas', 'Indirectos'],
                  replies: []
                }
              ].map((post, idx) => (
                <div key={idx} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {post.user}
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/5 uppercase font-black">
                            {post.role}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">{post.time}</p>
                      </div>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedPost(post)}>{post.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{post.content}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                        <ThumbsUp size={18} />
                        <span className="text-xs font-bold">{post.likes}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
                      >
                        <MessageCircle size={18} />
                        <span className="text-xs font-bold">{post.comments}</span>
                      </button>
                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20 font-bold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <TrendingUp size={18} className="text-primary" />
                Temas en Tendencia
              </h4>
              <div className="space-y-4">
                {[
                  { tag: 'Concreto', posts: 124 },
                  { tag: 'Salarios Mínimos', posts: 89 },
                  { tag: 'Indirectos', posts: 56 },
                  { tag: 'Software APU', posts: 42 },
                  { tag: 'Blockchain', posts: 38 }
                ].map(topic => (
                  <div key={topic.tag} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">#{topic.tag}</span>
                    <span className="text-[10px] font-mono text-slate-600">{topic.posts} posts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <ShieldCheck size={18} className="text-primary" />
                Top Validadores
              </h4>
              <div className="space-y-4">
                {[
                  { name: 'Ing. Carlos Ruiz', points: 2450 },
                  { name: 'Arq. Elena Solis', points: 1980 },
                  { name: 'Construcciones MX', points: 1560 }
                ].map((user, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="size-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{user.points} puntos APUC</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
              <Star size={32} className="text-primary mx-auto mb-4" />
              <h4 className="text-white font-bold mb-2">Anuncios de la Comunidad</h4>
              <p className="text-xs text-slate-400 mb-6">Publica tus servicios o busca alianzas estratégicas en el tablón oficial.</p>
              <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all">
                Ver Tablón
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 bg-background-dark/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
              <h3 className="text-white font-black uppercase tracking-tight">Detalle de Publicación</h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Main Post */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{selectedPost.user}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedPost.time} • {selectedPost.role}</p>
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-white leading-tight">{selectedPost.title}</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{selectedPost.content}</p>
                
                <div className="flex items-center gap-6 py-4 border-y border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ThumbsUp size={20} />
                    <span className="font-bold">{selectedPost.likes}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MessageCircle size={20} />
                    <span className="font-bold">{selectedPost.comments}</span>
                  </div>
                  <button 
                    onClick={() => handleShare(selectedPost.id)}
                    className="flex items-center gap-2 text-primary hover:underline font-bold text-sm"
                  >
                    <LinkIcon size={16} />
                    Copiar Enlace
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-6">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" />
                  Comentarios ({selectedPost.replies.length})
                </h4>
                
                <div className="space-y-4">
                  {selectedPost.replies.map((reply: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{reply.user}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{reply.time}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{reply.content}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <input 
                      type="text" 
                      placeholder="Escribe un comentario..."
                      className="bg-transparent border-none outline-none text-white text-sm flex-1"
                    />
                    <button className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest">
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-2xl"
          >
            <Check size={20} />
            Enlace copiado al portapapeles
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
