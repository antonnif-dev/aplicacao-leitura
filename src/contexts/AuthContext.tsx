import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextDefinition';
import type { AuthContextType } from './AuthContextDefinition'; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; 
};