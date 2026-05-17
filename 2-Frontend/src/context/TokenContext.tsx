/**
 * TokenContext.tsx
 * ================
 * Gestiona el saldo de tokens APUCMX del usuario autenticado.
 */

import React, {
  createContext, useContext, useEffect, useState, ReactNode, useCallback,
} from 'react';
import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/context/AuthContext';

export interface TokenTransaction {
  id: string;
  amount: number;
  action: string;
  description: string | null;
  created_at: string;
}

interface TokenContextType {
  balance: number;
  loadingTokens: boolean;
  transactions: TokenTransaction[];
  consumeTokens: (amount: number, action: string, description?: string) => Promise<{ ok: boolean; error?: string }>;
  refreshBalance: () => Promise<void>;
  paymentLink: string;
}

const PAYMENT_LINK = 'https://buy.stripe.com/test_bJe8wPbZn068dqFaXl4sE01';

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance]             = useState(0);
  const [transactions, setTransactions]   = useState<TokenTransaction[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) { setBalance(0); setTransactions([]); return; }
    setLoadingTokens(true);
    try {
      const { data: bal } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      setBalance(bal?.balance ?? 0);

      const { data: txs } = await supabase
        .from('token_transactions')
        .select('id, amount, action, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions((txs ?? []) as TokenTransaction[]);
    } catch (err) {
      console.error('[TokenContext] Error:', err);
    } finally {
      setLoadingTokens(false);
    }
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`token_balance_${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'token_balances', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new && typeof (payload.new as any).balance === 'number') {
            setBalance((payload.new as any).balance);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const consumeTokens = async (amount: number, action: string, description?: string) => {
    if (!user) return { ok: false, error: 'No hay sesión activa' };
    if (balance < amount) return { ok: false, error: `Saldo insuficiente (${balance} tokens)` };
    try {
      const { data, error } = await supabase.rpc('spend_tokens', {
        p_user_id: user.id, p_amount: amount, p_action: action, p_description: description ?? null,
      });
      if (error) return { ok: false, error: error.message };
      const result = data as { ok: boolean; error?: string; balance?: number };
      if (result.ok && result.balance !== undefined) setBalance(result.balance);
      if (!result.ok) return { ok: false, error: result.error ?? 'Error' };
      await fetchBalance();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ?? 'Error de red' };
    }
  };

  return (
    <TokenContext.Provider value={{
      balance, loadingTokens, transactions, consumeTokens,
      refreshBalance: fetchBalance, paymentLink: PAYMENT_LINK,
    }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useTokens must be used within a TokenProvider');
  return ctx;
};
