import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HeaderVisibilityProvider } from '@/context/HeaderVisibilityContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';

LogBox.ignoreLogs([
  'ImageBackground is deprecated and will be removed in a future release.',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => { });

function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const { isLoading, session, user } = useAuth();
  const segments = useSegments();
  const isAuthenticated = Boolean(session && user);

  useEffect(() => {
    if (isLoading) return;
    const topSegment = segments[0];
    const isPublicAuthRoute =
      topSegment === 'login' ||
      topSegment === 'register' ||
      topSegment === 'forgot-password' ||
      topSegment === 'auth';

    if (!isAuthenticated && !isPublicAuthRoute) {
      router.replace('/login' as any);
    } else if (
      isAuthenticated &&
      (topSegment === 'login' ||
        topSegment === 'register' ||
        topSegment === 'forgot-password' ||
        topSegment === 'auth')
    ) {
      router.replace('/(tabs)' as any);
    }
  }, [isLoading, isAuthenticated, segments]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [isLoading]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => { });
  }, [colors.background]);

  // Enquanto o Supabase verifica se há um usuário salvo no celular, mostra o loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          animationDuration: 220,
          gestureEnabled: true,
        }}
      >
        <Stack.Protected guard={isAuthenticated} redirectTo="/login">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="album/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="artist/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="label/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="top-albuns" options={{ headerShown: false }} />
          <Stack.Screen name="my-reviews" options={{ headerShown: false }} />
          <Stack.Screen name="favorites" options={{ headerShown: false }} />
          <Stack.Screen name="friends" options={{ headerShown: false }} />
          <Stack.Screen name="idols" options={{ headerShown: false }} />
          <Stack.Screen name="lists" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated} redirectTo="/(tabs)">
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="forgot-password"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack.Protected>
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <HeaderVisibilityProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </HeaderVisibilityProvider>
    </AppThemeProvider>
  );
}
