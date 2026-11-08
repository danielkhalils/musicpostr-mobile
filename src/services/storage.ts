import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

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
