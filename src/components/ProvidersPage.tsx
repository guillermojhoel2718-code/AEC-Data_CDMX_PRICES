import React from 'react';
import { AppHeader } from './Common';
import { motion } from 'motion/react';

export const ProvidersPage = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Próximamente</h1>
        <p className="text-lg text-slate-400 max-w-md">Esta sección está en planeación. Estará disponible en futuras actualizaciones de APUCMX.</p>
      </main>
    </motion.div>
  );
};

