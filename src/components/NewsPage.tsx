import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, TrendingUp, Calendar, ExternalLink, ArrowRight, ShieldCheck, Info, Globe, X, Share2, Bookmark } from 'lucide-react';
import { AppHeader, BlockchainBadge } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const NewsPage = () => {
  const [selectedNews, setSelectedNews] = useState<any>(null);

  const NEWS_ITEMS = [
    { id: 1, date: '2024-05-20', title: 'Aumento en el precio del acero estructural en México', category: 'Precios', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80', desc: 'Debido a las nuevas políticas arancelarias, se espera un incremento del 12% en el precio de la tonelada de acero.', fullContent: 'El sector de la construcción en México se prepara para un ajuste significativo en sus costos operativos tras el anuncio de nuevos aranceles a la importación de acero estructural. Según la Cámara Nacional de la Industria del Hierro y del Acero (CANACERO), este incremento impactará directamente en el costo final de naves industriales y edificios de gran altura.\n\nExpertos sugieren que las empresas constructoras deberán revisar sus contratos vigentes y considerar cláusulas de ajuste por inflación de insumos para mitigar el impacto financiero. Se espera que el pico de precios se alcance durante el tercer trimestre del año.' },
    { id: 2, date: '2024-05-18', title: 'Nuevas normativas de construcción sustentable en CDMX', category: 'Normativa', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', desc: 'El gobierno de la Ciudad de México ha publicado los nuevos lineamientos para edificaciones de bajo impacto ambiental.', fullContent: 'La Secretaría del Medio Ambiente (SEDEMA) ha actualizado el Reglamento de Construcciones para la CDMX, introduciendo criterios obligatorios de eficiencia energética y gestión de residuos para todas las nuevas obras mayores a 2,500 metros cuadrados.\n\nEstas medidas buscan reducir la huella de carbono de la capital en un 20% para el año 2030. Los desarrolladores que excedan los estándares mínimos podrán acceder a beneficios fiscales y certificaciones de "Edificio Verde" emitidas por el gobierno local.' },
    { id: 3, date: '2024-05-15', title: 'Impacto de la inflación en los costos de obra pública', category: 'Economía', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80', desc: 'Analistas prevén que el costo por metro cuadrado de construcción aumente un 8.5% al cierre del primer semestre.', fullContent: 'La inflación persistente en los precios de los energéticos y el transporte ha generado una presión sin precedentes en los presupuestos de obra pública a nivel nacional. El Índice Nacional de Precios al Productor (INPP) para la construcción ha mostrado una tendencia al alta durante cinco meses consecutivos.\n\nEsto ha llevado a la Secretaría de Infraestructura, Comunicaciones y Transportes (SICT) a reevaluar el calendario de ejecución de varios proyectos estratégicos para asegurar su viabilidad financiera sin comprometer la calidad de las obras.' },
    { id: 4, date: '2024-05-12', title: 'Avances en el Tren Maya: Nuevas licitaciones abiertas', category: 'Licitaciones', img: 'https://images.unsplash.com/photo-1562664377-709f2c337eb2?auto=format&fit=crop&w=800&q=80', desc: 'Se han publicado las bases para la construcción de las nuevas estaciones en el tramo 5 sur.', fullContent: 'El Fondo Nacional de Fomento al Turismo (FONATUR) ha lanzado la convocatoria para la licitación de las estaciones de Playa del Carmen y Tulum. Estas estaciones contarán con diseños arquitectónicos que integran elementos de la cultura maya con tecnología de punta en movilidad.\n\nSe invita a consorcios nacionales e internacionales a presentar sus propuestas técnicas y económicas. El fallo de la licitación se dará a conocer el próximo mes, marcando un hito importante en la conectividad del sureste mexicano.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen"
    >
      <AppHeader />
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Noticias de <span className="text-primary">Construcción</span></h1>
              <p className="text-slate-400 font-medium">Mantente al día con las noticias que afectan los precios y la industria en México.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
                <Globe size={18} className="text-primary" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">México</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {NEWS_ITEMS.map(news => (
                <div 
                  key={news.id} 
                  onClick={() => setSelectedNews(news)}
                  className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-48 bg-slate-800 shrink-0">
                      <img 
                        src={news.img} 
                        alt={news.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 tracking-widest uppercase">{news.category}</span>
                          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono">
                            <Calendar size={10} />
                            <span>{news.date}</span>
                          </div>
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2 group-hover:text-primary transition-colors">{news.title}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{news.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-primary text-xs font-bold">
                        <span>Leer más</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="space-y-8">
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Indicadores Económicos
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Inflación Anual', value: '4.72%', trend: 'up' },
                    { label: 'Tasa de Interés (Banxico)', value: '11.00%', trend: 'stable' },
                    { label: 'Dólar (USD/MXN)', value: '17.15', trend: 'down' },
                    { label: 'Salario Mínimo 2024', value: '$248.93', trend: 'up' }
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm text-slate-400">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck size={80} />
                </div>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  Alerta de Precios
                </h4>
                <p className="text-slate-400 text-xs mb-4">Se ha detectado una volatilidad inusual en los precios del cemento en la región Norte. Te recomendamos validar tus matrices antes de concursar.</p>
                <Link to="/explorer" className="text-primary text-xs font-bold hover:underline">Ver Explorador</Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedNews(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-slate-800">
                <img 
                  src={selectedNews.img} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                <button 
                  onClick={() => setSelectedNews(null)} 
                  className="absolute top-6 right-6 size-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-8">
                  <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                    {selectedNews.category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                    {selectedNews.title}
                  </h2>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Publicado el {selectedNews.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="hover:text-primary transition-colors flex items-center gap-1">
                      <Share2 size={14} />
                      Compartir
                    </button>
                    <button className="hover:text-primary transition-colors flex items-center gap-1">
                      <Bookmark size={14} />
                      Guardar
                    </button>
                  </div>
                </div>

                <div className="text-slate-300 leading-relaxed space-y-4 text-sm md:text-base">
                  {selectedNews.fullContent.split('\n\n').map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    onClick={() => setSelectedNews(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cerrar Lectura
                  </button>
                  <button className="flex-1 bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <ExternalLink size={16} />
                    Fuente Original
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BlockchainBadge />
    </motion.div>
  );
};
