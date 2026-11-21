import { isSupabaseConfigured, supabase } from './supabase';

const SUPABASE_NOT_CONFIGURED_ERROR =
  'Supabase não configurado. Crie o arquivo .env na raiz do projeto com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY e reinicie o servidor Expo com "npx expo start -c".';

function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_NOT_CONFIGURED_ERROR);
  }
}

export interface AuthCredentials {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

// Realiza o cadastro do usuário
export async function signUp({ email, password, username, fullName }: AuthCredentials) {
  ensureSupabaseConfigured();
  const resolvedUsername = username || email.split('@')[0];
  const resolvedFullName = fullName || 'Melômano';

  // 1. Cadastra no Auth do Supabase enviando metadados para a trigger `on_auth_user_created`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: resolvedUsername,
        full_name: resolvedFullName,
        avatar_url: DEFAULT_AVATAR_URL,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Erro ao criar usuário.');

  // 2. Quando há sessão ativa (confirmação de e-mail desativada), sincroniza via upsert.
  // Quando não há sessão (aguardando confirmação de e-mail), a trigger `handle_new_auth_user`
  // (SECURITY DEFINER) já cria o perfil automaticamente sem violar a política RLS.
  if (authData.session) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authData.user.id,
        username: resolvedUsername,
        full_name: resolvedFullName,
        email,
        avatar_url: DEFAULT_AVATAR_URL,
      },
      { onConflict: 'id' }
    );

    if (profileError) throw profileError;
  }

  return authData;
}

// Realiza o login
export async function signIn({ email, password }: AuthCredentials) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Realiza o logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Pega o usuário logado atualmente
export async function getCurrentUserSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}