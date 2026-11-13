import { router } from 'expo-router';

/**
 * Safely navigates back without leaving an unmounted/white screen in the root stack.
 * In Expo Router, if canGoBack() is false or if the current stack has no parent history,
 * calling router.back() pops into a blank screen.
 * We dismiss to the fallback route or replace cleanly.
 */
export function safeGoBack(fallbackRoute: string = '/(tabs)/index') {
  try {
    if (router.canGoBack()) {
      router.back();
      return;
    }
  } catch {
    // ignore
  }

  try {
    router.replace(fallbackRoute as any);
  } catch {
    try {
      router.replace('/(tabs)/index' as any);
    } catch {
      // ignore
    }
  }
}
