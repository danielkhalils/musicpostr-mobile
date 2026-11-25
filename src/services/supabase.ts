import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey);

const isWebSSR = Platform.OS === 'web' && typeof window === 'undefined';

if (!isSupabaseConfigured && !isWebSSR) {
  console.warn(
    '[Supabase] Variáveis EXPO_PUBLIC_SUPABASE_URL e/ou EXPO_PUBLIC_SUPABASE_ANON_KEY não configuradas no arquivo .env. O app será iniciado sem conexão com o Supabase.'
  );
}

const supabaseUrl = isSupabaseConfigured ? envSupabaseUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? envSupabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(isWebSSR ? {} : { storage: AsyncStorage }),
    autoRefreshToken: isSupabaseConfigured && !isWebSSR,
    persistSession: isSupabaseConfigured && !isWebSSR,
    detectSessionInUrl: Platform.OS === 'web' && !isWebSSR,
  },
});

if (isSupabaseConfigured && !isWebSSR) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}