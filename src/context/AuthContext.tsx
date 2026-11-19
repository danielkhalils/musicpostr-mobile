import { supabase } from '@/services/supabase';
import { UserProfileData, updateProfile as updateProfileInDb } from '@/services/profile.service';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserProfile = UserProfileData;

interface AuthContextData {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfileData>) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextData>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfileData: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os dados extras da tabela profiles no Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch {
      // Falha silenciosa ou tratamento de rede
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Busca a sessão atual assim que o app abre
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // 2. Ouve alterações na autenticação (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfileData>) => {
    if (!session?.user) return { success: false, error: 'Usuário não autenticado' };
    const res = await updateProfileInDb(session.user.id, updates);
    if (res.success && res.data) {
      setProfile(res.data);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signOut: handleSignOut,
        refreshProfile,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);