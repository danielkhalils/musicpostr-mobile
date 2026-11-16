import { supabase } from './supabase';

export interface AuthCredentials {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

// Realiza o cadastro do usuário
export async function signUp({ email, password, username, fullName }: AuthCredentials) {
  // 1. Cadastra no Auth do Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Erro ao criar usuário.');

  // 2. Insere os dados públicos na tabela profiles
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    username: username || email.split('@')[0],
    full_name: fullName || 'Melômano',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', // Avatar padrão
  });

  if (profileError) throw profileError;

  return authData;
}

// Realiza o login
export async function signIn({ email, password }: AuthCredentials) {
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