import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HeaderVisibilityProvider } from '@/context/HeaderVisibilityContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';

LogBox.ignoreLogs([
  'ImageBackground is deprecated and will be removed in a future release.',
]);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => { });

function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const { session, isLoading } = useAuth();

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

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => { });
  }, [colors.background]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="album/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="artist/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="top-albuns" options={{ headerShown: false }} />
        <Stack.Screen name="my-reviews" options={{ headerShown: false }} />
        <Stack.Screen name="favorites" options={{ headerShown: false }} />
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="idols" options={{ headerShown: false }} />
        <Stack.Screen name="lists" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false, presentation: 'modal' }}
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
