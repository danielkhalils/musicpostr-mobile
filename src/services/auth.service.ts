import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

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

export function getAuthRedirectUrl(path = 'auth/callback'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }
  return Linking.createURL(path);
}

function parseParamsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  const extract = (segment: string) => {
    if (!segment) return;
    for (const pair of segment.split('&')) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const key = decodeURIComponent(pair.slice(0, eqIdx));
      const value = decodeURIComponent(pair.slice(eqIdx + 1).replace(/\+/g, ' '));
      if (key) params[key] = value;
    }
  };

  if (queryIndex !== -1) {
    const queryEnd = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length;
    extract(url.slice(queryIndex + 1, queryEnd));
  }
  if (hashIndex !== -1) {
    extract(url.slice(hashIndex + 1));
  }

  return params;
}

async function ensureOAuthUserProfile(provider: 'google') {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const meta = user.user_metadata || {};
    const email = user.email || '';
    const fullName =
      meta.full_name || meta.name || email.split('@')[0] || 'Melômano';
    const baseUsername = (
      meta.username ||
      meta.preferred_username ||
      email.split('@')[0] ||
      `user_${user.id.slice(0, 6)}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const avatarUrl =
      meta.avatar_url || meta.picture || DEFAULT_AVATAR_URL;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('profiles')
        .update({
          is_linked_google: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } else {
      const candidateUsername = baseUsername.length >= 3 ? baseUsername : `user_${user.id.slice(0, 6)}`;
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: user.id,
        username: candidateUsername,
        full_name: fullName,
        email,
        avatar_url: avatarUrl,
        auth_provider: provider,
        is_linked_google: true,
      });
      if (insertErr) {
        // Fallback caso username já exista
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            username: `${candidateUsername}_${user.id.slice(0, 4)}`,
            full_name: fullName,
            email,
            avatar_url: avatarUrl,
            auth_provider: provider,
            is_linked_google: true,
          },
          { onConflict: 'id' }
        );
      }
    }
  } catch {
    // non-blocking
  }
}

export async function isOAuthProviderEnabled(
  provider: 'google'
): Promise<boolean | null> {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!baseUrl || !anonKey) return null;

  try {
    const res = await fetch(`${baseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
      },
    });
    if (!res.ok) return null;
    const settings = await res.json();
    const external = settings?.external;
    if (external && typeof external[provider] === 'boolean') {
      return external[provider];
    }
    return null;
  } catch {
    return null;
  }
}

export async function signInWithOAuthProvider(
  provider: 'google'
): Promise<{ success: boolean; canceled?: boolean; error?: string }> {
  ensureSupabaseConfigured();

  const providerLabel = 'Google';
  const redirectTo = getAuthRedirectUrl('auth/callback');

  try {
    const enabled = await isOAuthProviderEnabled(provider);
    if (enabled === false) {
      return {
        success: false,
        error: formatOAuthError(providerLabel, 'Unsupported provider: provider is not enabled'),
      };
    }

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams:
            provider === 'google'
              ? { access_type: 'offline', prompt: 'select_account' }
              : undefined,
        },
      });

      if (error) {
        return { success: false, error: formatOAuthError(providerLabel, error.message) };
      }
      return { success: true };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams:
          provider === 'google'
            ? { access_type: 'offline', prompt: 'select_account' }
            : undefined,
      },
    });

    if (error) {
      return { success: false, error: formatOAuthError(providerLabel, error.message) };
    }

    if (!data?.url) {
      return {
        success: false,
        error: `Provedor ${providerLabel} não está configurado no Supabase.`,
      };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, canceled: true };
    }

    if (result.type !== 'success' || !result.url) {
      return {
        success: false,
        error: `Não foi possível concluir a autenticação com ${providerLabel}.`,
      };
    }

    const params = parseParamsFromUrl(result.url);

    if (params.error || params.error_description) {
      return {
        success: false,
        error: formatOAuthError(
          providerLabel,
          params.error_description || params.error
        ),
      };
    }

    if (params.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        params.code
      );
      if (exchangeError) {
        return {
          success: false,
          error: formatOAuthError(providerLabel, exchangeError.message),
        };
      }
      await ensureOAuthUserProfile(provider);
      return { success: true };
    }

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) {
        return {
          success: false,
          error: formatOAuthError(providerLabel, sessionError.message),
        };
      }
      await ensureOAuthUserProfile(provider);
      return { success: true };
    }

    return {
      success: false,
      error: `Retorno inválido do ${providerLabel}. Verifique se a URL de redirecionamento (${redirectTo}) está autorizada no painel do Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: formatOAuthError(providerLabel, err?.message || 'Erro inesperado.'),
    };
  }
}

function formatOAuthError(providerLabel: string, rawMessage: string): string {
  const lower = (rawMessage || '').toLowerCase();
  if (lower.includes('unsupported provider') || lower.includes('provider is not enabled')) {
    return `O login com ${providerLabel} precisa estar habilitado no painel do Supabase (Authentication → Providers → ${providerLabel}).`;
  }
  if (lower.includes('redirect') || lower.includes('url')) {
    return `URL de redirecionamento não autorizada para ${providerLabel}. Adicione "musicpostr://auth/callback" em Authentication → URL Configuration no Supabase.`;
  }
  return `Não foi possível autenticar com ${providerLabel}: ${rawMessage}`;
}

// Envia e-mail de recuperação de senha (link + código OTP)
export async function sendPasswordResetEmail(email: string): Promise<void> {
  ensureSupabaseConfigured();
  const redirectTo = getAuthRedirectUrl('forgot-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) throw error;
}

// Verifica o código de recuperação enviado por e-mail
export async function verifyPasswordRecoveryOtp(
  email: string,
  token: string
): Promise<void> {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'recovery',
  });
  if (error) throw error;
}

// Atualiza a senha do usuário após verificação de recuperação
export async function updateAccountPassword(newPassword: string): Promise<void> {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

// Envia link mágico / código OTP por e-mail para recuperar acesso sem senha
export async function sendMagicLinkRecovery(email: string): Promise<void> {
  ensureSupabaseConfigured();
  const redirectTo = getAuthRedirectUrl('auth/callback');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
}

// Verifica código OTP de acesso por e-mail
export async function verifyMagicLinkOtp(
  email: string,
  token: string
): Promise<void> {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error) throw error;
}

// Realiza o cadastro do usuário
export async function signUp({ email, password, username, fullName }: AuthCredentials) {
  ensureSupabaseConfigured();
  const resolvedUsername = username || email.split('@')[0];
  const resolvedFullName = fullName || 'Melômano';

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
