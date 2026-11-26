import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import {
  completeOAuthCallbackUrl,
  ensureOAuthUserProfile,
  getLastCapturedOAuthUrl,
  hasOAuthPayloadInUrl,
} from '@/services/auth.service';
import { supabase } from '@/services/supabase';
import * as Linking from 'expo-linking';
import { router, useGlobalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const { colors } = useAppTheme();
  const { isLoading, session, user } = useAuth();
  const linkingUrl = Linking.useLinkingURL();
  const globalParams = useGlobalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLoading && session && user) {
      router.replace('/(tabs)' as any);
    }
  }, [isLoading, session, user]);

  useEffect(() => {
    if (isLoading) return;
    if (session && user) return;

    let active = true;

    const buildSyntheticUrlFromParams = (): string | null => {
      if (globalParams?.access_token && globalParams?.refresh_token) {
        return `musicpostr://auth/callback#access_token=${encodeURIComponent(
          String(globalParams.access_token)
        )}&refresh_token=${encodeURIComponent(String(globalParams.refresh_token))}`;
      }
      if (globalParams?.code) {
        return `musicpostr://auth/callback?code=${encodeURIComponent(
          String(globalParams.code)
        )}`;
      }
      return null;
    };

    const resolveCandidateUrl = async (): Promise<string | null> => {
      const candidates = [
        getLastCapturedOAuthUrl(),
        Linking.getLinkingURL(),
        linkingUrl,
        buildSyntheticUrlFromParams(),
        await Linking.getInitialURL(),
      ];

      for (const candidate of candidates) {
        if (candidate && hasOAuthPayloadInUrl(candidate)) {
          return candidate;
        }
      }
      return null;
    };

    const finishAuth = async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        if (!active) return;

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession?.user) {
          await ensureOAuthUserProfile('google');
          if (active) {
            router.replace('/(tabs)' as any);
          }
          return;
        }

        const candidateUrl = await resolveCandidateUrl();
        if (candidateUrl) {
          const result = await completeOAuthCallbackUrl(candidateUrl, 'google');
          if (!active) return;
          if (result.success) {
            router.replace('/(tabs)' as any);
            return;
          }
          if (result.error) {
            router.replace('/login' as any);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      if (active) {
        router.replace('/login' as any);
      }
    };

    void finishAuth();

    return () => {
      active = false;
    };
  }, [
    isLoading,
    session,
    user,
    linkingUrl,
    globalParams?.access_token,
    globalParams?.refresh_token,
    globalParams?.code,
  ]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.mutedForeground }}>
        Concluindo login...
      </Text>
    </View>
  );
}
