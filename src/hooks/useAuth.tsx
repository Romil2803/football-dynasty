import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem('fd_guest') === '1');

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    localStorage.removeItem('fd_guest'); setIsGuest(false);
    return {};
  };
  const signUp: AuthCtx['signUp'] = async (email, password, displayName) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl, data: { display_name: displayName } } });
    if (error) return { error: error.message };
    return {};
  };
  const signOut = async () => { await supabase.auth.signOut(); localStorage.removeItem('fd_guest'); setIsGuest(false); };
  const continueAsGuest = () => { localStorage.setItem('fd_guest', '1'); setIsGuest(true); };

  return <Ctx.Provider value={{ user: session?.user ?? null, session, loading, isGuest, signIn, signUp, signOut, continueAsGuest }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
