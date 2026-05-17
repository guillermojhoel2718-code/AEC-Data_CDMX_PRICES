import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
  eta?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title = 'Próximamente',
  description = 'Esta funcionalidad está en desarrollo activo y estará disponible pronto.',
  eta = 'Q3 2026',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[#1A1A2E] border border-[#2A2A4A] flex items-center justify-center">
            <Clock className="w-10 h-10 text-[#6366F1]" />
          </div>
        </div>

        {/* Badge ETA */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A2E] border border-[#6366F1]/30 text-[#6366F1] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
          ETA {eta}
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-[#8888AA] text-sm leading-relaxed">{description}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1A1A2E]" />

        {/* Note */}
        <p className="text-[#444466] text-xs">
          APUCMX V1 · Plataforma de validación de precios unitarios · CDMX 2026
        </p>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#8888AA] hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>
    </div>
  );
};
