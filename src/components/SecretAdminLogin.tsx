import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const SecretAdminLogin = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loginAsAdmin = async () => {
      // In a real app, this might use a special token or edge function bypass
      // For this demo/MVP, we'll try to log in with the admin credentials directly
      // Or just set the auth state if we have a mock bypass
      
      try {
        // We attempt to sign in the master user
        const { error } = await signIn('admin@apucmx.com', 'admin123456');
        
        if (error) {
          console.error("Auto-login failed:", error);
          // If it fails (e.g. user doesn't exist yet), we still redirect to home
          navigate('/');
        } else {
          // Success, redirect to explorer
          navigate('/explorer');
        }
      } catch (err) {
        navigate('/');
      }
    };

    loginAsAdmin();
  }, [signIn, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="size-20 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/50 shadow-[0_0_50px_rgba(240,90,40,0.3)]">
          <Loader2 size={40} className="text-primary animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">
            Iniciando Protocolo <span className="text-primary">KukleStro_17</span>
          </h1>
          <p className="text-sm font-mono text-slate-500">Bypassing standard authentication...</p>
        </div>
      </div>
    </div>
  );
};
