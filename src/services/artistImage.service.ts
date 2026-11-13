import { Storage } from './storage';

/**
 * Resolve a foto oficial de um artista pelo nome usando a API pública do Deezer.
 * Só aceita resultados cujo nome coincida exatamente (normalizado) com o artista,
 * evitando imagens de outros artistas. Retorna `null` quando não houver foto,
 * para que a UI exiba o ícone do Musicpostr.
 */

const CACHE_KEY = 'musicpostr_artist_images_v1';
const memory = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

try {
  const raw = Storage.getItem(CACHE_KEY);
  if (raw) {
    const parsed: Record<string, string | null> = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => memory.set(k, v));
  }
} catch {
  // ignore
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      Storage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memory)));
    } catch {
      // ignore
    }
  }, 800);
}

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function isPlaceholder(url?: string): boolean {
  // O Deezer devolve "/images/artist//..." quando o artista não tem foto
  return !url || /\/images\/artist\/\//.test(url);
}

export function getCachedArtistImage(name?: string | null): string | null | undefined {
  if (!name) return null;
  return memory.get(normalize(name));
}

export async function resolveArtistImage(name?: string | null): Promise<string | null> {
  if (!name || !name.trim()) return null;
  const key = normalize(name);
  if (!key) return null;
  if (memory.has(key)) return memory.get(key) ?? null;
  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    try {
      const res = await fetch(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(name.trim())}&limit=10`
      );
      if (!res.ok) return null; // erro de rede: não cacheia
      const json = await res.json();
      const list: any[] = Array.isArray(json?.data) ? json.data : [];
      const match = list
        .filter((a) => normalize(String(a?.name || '')) === key)
        .sort((a, b) => (b?.nb_fan || 0) - (a?.nb_fan || 0))[0];
      const url: string | undefined = match?.picture_xl || match?.picture_big;
      const result = match && !isPlaceholder(url) ? url! : null;
      memory.set(key, result);
      persist();
      return result;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}
