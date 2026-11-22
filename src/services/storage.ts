import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

const PERSISTED_PREFIX = 'musicpostr_';
let hydrationStarted = false;
let hydrationDone = false;

async function hydrateFromAsyncStorage(): Promise<void> {
  if (Platform.OS === 'web' || hydrationStarted) return;
  hydrationStarted = true;
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const targetKeys = allKeys.filter((k) => k.startsWith(PERSISTED_PREFIX));
    if (targetKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(targetKeys);
      for (const [key, value] of pairs) {
        if (value !== null && !memoryStore.has(key)) {
          memoryStore.set(key, value);
        }
      }
    }
  } catch {
    // ignore storage hydration errors
  } finally {
    hydrationDone = true;
    AppEvents.emit('storage:hydrated');
  }
}

export function isStorageHydrated(): boolean {
  return Platform.OS === 'web' || hydrationDone;
}

export function onStorageHydrated(listener: Listener): () => void {
  if (isStorageHydrated()) {
    listener();
    return () => {};
  }
  return AppEvents.on('storage:hydrated', listener);
}

// Inicia hidratação do cache persistente em background no mobile
void hydrateFromAsyncStorage();

export const Storage = {
  getItem(key: string): string | null {
    if (memoryStore.has(key)) {
      return memoryStore.get(key) ?? null;
    }
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
        }
        return val;
      } catch {
        return null;
      }
    }
    return null;
  },

  setItem(key: string, value: string): void {
    memoryStore.set(key, value);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore storage quota errors
      }
    } else if (Platform.OS !== 'web' && key.startsWith(PERSISTED_PREFIX)) {
      AsyncStorage.setItem(key, value).catch(() => {
        // ignore native storage errors
      });
    }
  },

  removeItem(key: string): void {
    memoryStore.delete(key);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    } else if (Platform.OS !== 'web' && key.startsWith(PERSISTED_PREFIX)) {
      AsyncStorage.removeItem(key).catch(() => {
        // ignore
      });
    }
  },
};

export const AppEvents = {
  emit(event: string): void {
    const set = listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore listener error
        }
      });
    }
  },

  on(event: string, listener: Listener): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener);
    return () => {
      listeners.get(event)?.delete(listener);
    };
  },
};
