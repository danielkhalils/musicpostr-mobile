import { router } from 'expo-router';

/**
 * Safely navigates back if there is a previous route in the stack history.
 * Otherwise falls back to a reliable route instead of leaving an empty/white screen.
 */
export function safeGoBack(fallbackRoute: string = '/(tabs)/index') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}
