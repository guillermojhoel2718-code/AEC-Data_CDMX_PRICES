import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  eta?: string;
}

export const ComingSoonPage: React.FC<Props> = ({ title, description, eta }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      <div className="border-b border-[#1A1A2E] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center hover:bg-[#2A2A4A] transition-colors">
          <ChevronLeft className="w-4 h-4 text-[#8888AA]" />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A2E] flex items-center justify-center">
          <Clock className="w-8 h-8 text-[#6366F1]" />
        </div>
        <div className="text-center max-w-md space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-[#8888AA]">{description}</p>}
          {eta && <p className="text-[#6366F1] text-sm font-mono">ETA: {eta}</p>}
        </div>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-semibold hover:bg-[#4F51D9] transition-colors">
          Volver al inicio
        </button>
      </div>
    </div>
  );
};
