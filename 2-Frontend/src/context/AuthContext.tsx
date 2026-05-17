import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, ProfileRow, MembershipTier } from 'src/lib/supabase';

export type { MembershipTier };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  membership: MembershipTier;
  apucCredits: number;
  cediaReputation: number;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateMembership: (tier: MembershipTier) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  occupation: string;
  region: string;
  accountType: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as ProfileRow);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Obtener sesión activa al montar (ej: recarga de página)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setLoading(false);
    });

    // Suscribirse a cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.includes('Invalid login credentials')
        ? 'Correo o contraseña incorrectos'
        : error.message;
      return { error: msg };
    }
    return { error: null };
  };

  const signUp = async (params: SignUpParams): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          occupation: params.occupation,
          region: params.region,
          account_type: params.accountType,
        },
      },
    });

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Este correo ya está registrado'
        : error.message;
      return { error: msg };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateMembership = async (tier: MembershipTier): Promise<{ error: string | null }> => {
    if (!user) return { error: 'No hay sesión activa' };
    
    const { error } = await supabase
      .from('profiles')
      .update({ membership: tier })
      .eq('id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, membership: tier } : null);
    }
    
    return { error: error?.message ?? null };
  };

  const membership: MembershipTier = (profile?.membership ?? 'gratis') as MembershipTier;
  const apucCredits: number = profile?.apuc_credits ?? 0;
  const cediaReputation: number = profile?.cedia_reputation ?? 0;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      membership,
      apucCredits,
      cediaReputation,
      signIn,
      signUp,
      signOut,
      updateMembership,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
