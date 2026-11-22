import { onStorageHydrated, Storage } from './storage';

/**
 * Resolve foto oficial, perfil e capas de discografia de um artista usando a API pública do Deezer.
 * Só aceita resultados cujo nome coincida exatamente (normalizado) com o artista,
 * evitando imagens de outros artistas. Retorna `null` quando não houver foto,
 * para que a UI exiba o ícone do Musicpostr.
 */

const CACHE_KEY = 'musicpostr_artist_images_v1';
const PROFILE_CACHE_KEY = 'musicpostr_artist_profiles_v1';
const DISCOGRAPHY_CACHE_PREFIX = 'musicpostr_deezer_discog_v1_';
const DISCOGRAPHY_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 dias

export interface DeezerArtistProfile {
  id: number;
  name: string;
  imageUrl: string | null;
  nbFans: number;
  nbAlbums: number;
}

export interface DeezerAlbumCover {
  id: number;
  title: string;
  cover_xl: string;
  cover_big: string;
  cover_medium: string;
  cover_small: string;
  release_date: string;
  record_type: 'album' | 'ep' | 'single';
}

const memory = new Map<string, string | null>();
const profileMemory = new Map<string, DeezerArtistProfile | null>();
const inflightProfile = new Map<string, Promise<DeezerArtistProfile | null>>();

const discographyMemory = new Map<string, DeezerAlbumCover[]>();
const inflightDiscography = new Map<string, Promise<DeezerAlbumCover[]>>();

function loadPersistedCaches(): void {
  try {
    const raw = Storage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: Record<string, string | null> = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => {
        if (!memory.has(k)) memory.set(k, v);
      });
    }
  } catch {
    // ignore
  }
  try {
    const rawProfiles = Storage.getItem(PROFILE_CACHE_KEY);
    if (rawProfiles) {
      const parsed: Record<string, DeezerArtistProfile | null> = JSON.parse(rawProfiles);
      Object.entries(parsed).forEach(([k, v]) => {
        if (!profileMemory.has(k)) profileMemory.set(k, v);
      });
    }
  } catch {
    // ignore
  }
}

loadPersistedCaches();
onStorageHydrated(loadPersistedCaches);

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
    try {
      const entries = Array.from(profileMemory.entries()).slice(-150);
      Storage.setItem(PROFILE_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // ignore
    }
  }, 800);
}

export function normalizeArtistKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeAlbumTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeAlbumTitleBase(title: string): string {
  const stripped = title
    .replace(/\s*\([^)]*(deluxe|remaster|edition|version|explicit|bonus|expanded|anniversary|live|tour|pt\.?|vol\.?)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*-\s*(deluxe|remastered|single|ep|explicit).*$/i, '');
  return normalizeAlbumTitle(stripped);
}

function isPlaceholder(url?: string): boolean {
  // O Deezer devolve "/images/artist//..." quando o artista não tem foto
  return !url || /\/images\/artist\/\//.test(url);
}

function isAlbumPlaceholder(url?: string): boolean {
  return !url || /\/images\/cover\/\//.test(url);
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

export function getCachedArtistImage(name?: string | null): string | null | undefined {
  if (!name) return null;
  const key = normalizeArtistKey(name);
  if (memory.has(key)) return memory.get(key);
  const prof = profileMemory.get(key);
  if (prof !== undefined) return prof?.imageUrl ?? null;
  return undefined;
}

export async function resolveDeezerArtistProfile(
  name?: string | null
): Promise<DeezerArtistProfile | null> {
  if (!name || !name.trim()) return null;
  const key = normalizeArtistKey(name);
  if (!key) return null;
  if (profileMemory.has(key)) return profileMemory.get(key) ?? null;

  const pending = inflightProfile.get(key);
  if (pending) return pending;

  const task = (async (): Promise<DeezerArtistProfile | null> => {
    try {
      const res = await fetchWithTimeout(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(name.trim())}&limit=10`
      );
      if (!res || !res.ok) return null; // erro de rede: não cacheia
      const json = await res.json();
      const list: any[] = Array.isArray(json?.data) ? json.data : [];
      const match = list
        .filter((a) => normalizeArtistKey(String(a?.name || '')) === key)
        .sort((a, b) => (b?.nb_fan || 0) - (a?.nb_fan || 0))[0];

      if (!match) {
        profileMemory.set(key, null);
        memory.set(key, null);
        persist();
        return null;
      }

      const rawUrl: string | undefined = match?.picture_xl || match?.picture_big || match?.picture_medium;
      const imageUrl = !isPlaceholder(rawUrl) ? rawUrl! : null;

      const profile: DeezerArtistProfile = {
        id: Number(match.id),
        name: String(match.name || name.trim()),
        imageUrl,
        nbFans: Number(match.nb_fan || 0),
        nbAlbums: Number(match.nb_album || 0),
      };

      profileMemory.set(key, profile);
      memory.set(key, imageUrl);
      persist();
      return profile;
    } catch {
      return null;
    } finally {
      inflightProfile.delete(key);
    }
  })();

  inflightProfile.set(key, task);
  return task;
}

export async function resolveArtistImage(name?: string | null): Promise<string | null> {
  if (!name || !name.trim()) return null;
  const key = normalizeArtistKey(name);
  if (!key) return null;
  if (memory.has(key)) return memory.get(key) ?? null;
  const profile = await resolveDeezerArtistProfile(name);
  return profile?.imageUrl ?? null;
}

/**
 * Busca todas as capas oficiais da discografia de um artista no Deezer em uma única chamada.
 * Permite enriquecer instantaneamente as capas de álbuns, EPs e singles da tela do artista.
 */
export async function fetchDeezerArtistAlbums(
  artistName?: string | null
): Promise<DeezerAlbumCover[]> {
  if (!artistName || !artistName.trim()) return [];
  const key = normalizeArtistKey(artistName);
  if (!key) return [];

  if (discographyMemory.has(key)) {
    return discographyMemory.get(key) || [];
  }

  try {
    const raw = Storage.getItem(DISCOGRAPHY_CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as { items: DeezerAlbumCover[]; cachedAt: number };
      if (Date.now() - parsed.cachedAt < DISCOGRAPHY_TTL_MS && Array.isArray(parsed.items)) {
        discographyMemory.set(key, parsed.items);
        return parsed.items;
      }
      Storage.removeItem(DISCOGRAPHY_CACHE_PREFIX + key);
    }
  } catch {
    // ignore
  }

  const pending = inflightDiscography.get(key);
  if (pending) return pending;

  const task = (async (): Promise<DeezerAlbumCover[]> => {
    try {
      const profile = await resolveDeezerArtistProfile(artistName);
      if (!profile?.id) return [];

      const res = await fetchWithTimeout(
        `https://api.deezer.com/artist/${profile.id}/albums?limit=100`,
        7500
      );
      if (!res || !res.ok) return [];
      const json = await res.json();
      const rawList: any[] = Array.isArray(json?.data) ? json.data : [];

      const items: DeezerAlbumCover[] = [];
      for (const alb of rawList) {
        const coverBig = alb?.cover_big || alb?.cover_xl || alb?.cover_medium || '';
        if (isAlbumPlaceholder(coverBig)) continue;
        const rt = String(alb?.record_type || 'album').toLowerCase();
        const recordType: 'album' | 'ep' | 'single' =
          rt === 'ep' ? 'ep' : rt === 'single' ? 'single' : 'album';

        items.push({
          id: Number(alb.id),
          title: String(alb.title || ''),
          cover_xl: alb.cover_xl || alb.cover_big || coverBig,
          cover_big: alb.cover_big || alb.cover_xl || coverBig,
          cover_medium: alb.cover_medium || alb.cover_big || coverBig,
          cover_small: alb.cover_small || alb.cover_medium || coverBig,
          release_date: String(alb.release_date || ''),
          record_type: recordType,
        });
      }

      discographyMemory.set(key, items);
      try {
        Storage.setItem(
          DISCOGRAPHY_CACHE_PREFIX + key,
          JSON.stringify({ items, cachedAt: Date.now() })
        );
      } catch {
        // ignore
      }
      return items;
    } catch {
      return [];
    } finally {
      inflightDiscography.delete(key);
    }
  })();

  inflightDiscography.set(key, task);
  return task;
}

/**
 * Constrói um índice rápido de capas do Deezer por título normalizado (exato e sem sufixos de edição).
 */
export function buildDeezerCoverIndex(items: DeezerAlbumCover[]): {
  exact: Map<string, DeezerAlbumCover>;
  base: Map<string, DeezerAlbumCover>;
} {
  const exact = new Map<string, DeezerAlbumCover>();
  const base = new Map<string, DeezerAlbumCover>();
  for (const item of items) {
    const exactKey = normalizeAlbumTitle(item.title);
    if (exactKey && !exact.has(exactKey)) {
      exact.set(exactKey, item);
    }
    const baseKey = normalizeAlbumTitleBase(item.title);
    if (baseKey && !base.has(baseKey)) {
      base.set(baseKey, item);
    }
  }
  return { exact, base };
}

export function matchDeezerCover(
  albumTitle: string,
  index: { exact: Map<string, DeezerAlbumCover>; base: Map<string, DeezerAlbumCover> }
): DeezerAlbumCover | null {
  const exactKey = normalizeAlbumTitle(albumTitle);
  if (exactKey && index.exact.has(exactKey)) {
    return index.exact.get(exactKey)!;
  }
  const baseKey = normalizeAlbumTitleBase(albumTitle);
  if (baseKey && index.base.has(baseKey)) {
    return index.base.get(baseKey)!;
  }
  return null;
}
