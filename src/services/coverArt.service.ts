import { onStorageHydrated, Storage } from './storage';

const MB_RELEASE_SEARCH = 'https://musicbrainz.org/ws/2/release';
const CAA_RELEASE_BASE = 'https://coverartarchive.org/release';
const CAA_RELEASE_GROUP_BASE = 'https://coverartarchive.org/release-group';
const CACHE_PREFIX = 'musicpostr_coverart_v2_';
const RESOLVED_ALBUM_COVER_KEY = 'musicpostr_resolved_album_covers_v1';
const MISSING_COVERS_KEY = 'musicpostr_missing_covers_v2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const NEGATIVE_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 dia

const FALLBACK_ALBUM_POOL = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=250&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=250&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=250&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=250&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=65&w=250&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=65&w=250&auto=format&fit=crop',
];

const FALLBACK_ARTIST_POOL = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=65&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=65&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=65&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=500&auto=format&fit=crop',
];

export const DEFAULT_ALBUM_COVER = FALLBACK_ALBUM_POOL[0];

export const DEFAULT_ARTIST_IMAGE = FALLBACK_ARTIST_POOL[0];

export function isFallbackPlaceholderUrl(url?: string | null): boolean {
  if (!url) return true;
  return url.includes('images.unsplash.com/photo-');
}

export function getFallbackImageUrl(
  seed?: string | null,
  type: 'album' | 'artist' = 'album'
): string {
  const pool = type === 'artist' ? FALLBACK_ARTIST_POOL : FALLBACK_ALBUM_POOL;
  if (!seed) return pool[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

const missingCoversMemory = new Set<string>();
const resolvedAlbumCoversMemory = new Map<string, string | null>();
const inflightAlbumCoverResolve = new Map<string, Promise<string | null>>();

function loadPersistedCoverCaches(): void {
  try {
    const savedMissing = Storage.getItem(MISSING_COVERS_KEY);
    if (savedMissing) {
      const parsed: string[] = JSON.parse(savedMissing);
      parsed.forEach((id) => missingCoversMemory.add(id));
    }
  } catch {
    // ignore
  }
  try {
    const savedResolved = Storage.getItem(RESOLVED_ALBUM_COVER_KEY);
    if (savedResolved) {
      const parsed: Record<string, string | null> = JSON.parse(savedResolved);
      Object.entries(parsed).forEach(([k, v]) => {
        if (!resolvedAlbumCoversMemory.has(k)) {
          resolvedAlbumCoversMemory.set(k, v);
        }
      });
    }
  } catch {
    // ignore
  }
}

loadPersistedCoverCaches();
onStorageHydrated(loadPersistedCoverCaches);

let persistResolvedTimer: ReturnType<typeof setTimeout> | null = null;
function persistResolvedAlbumCovers(): void {
  if (persistResolvedTimer) return;
  persistResolvedTimer = setTimeout(() => {
    persistResolvedTimer = null;
    try {
      const entries = Array.from(resolvedAlbumCoversMemory.entries()).slice(-300);
      Storage.setItem(RESOLVED_ALBUM_COVER_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // ignore
    }
  }, 800);
}

export function markCoverAsMissing(url: string): void {
  const match = url.match(
    /coverartarchive\.org\/(?:release-group|release)\/([a-f0-9-]{36})/i
  );
  if (!match?.[1]) return;
  const mbid = match[1].toLowerCase();
  if (missingCoversMemory.has(mbid)) return;
  missingCoversMemory.add(mbid);
  try {
    const arr = Array.from(missingCoversMemory).slice(-300);
    Storage.setItem(MISSING_COVERS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function stripEditionSuffix(title: string): string {
  return title
    .replace(/\s*\([^)]*(deluxe|remaster|edition|version|explicit|bonus|expanded|anniversary)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();
}

function buildResolvedCoverKey(albumTitle: string, artistName?: string | null): string {
  return `${normalizeText(artistName || '')}::${normalizeText(albumTitle)}`;
}

export function getCachedResolvedAlbumCover(
  albumTitle?: string | null,
  artistName?: string | null
): string | null | undefined {
  if (!albumTitle) return undefined;
  const key = buildResolvedCoverKey(albumTitle, artistName);
  return resolvedAlbumCoversMemory.get(key);
}

/**
 * Resolve a capa oficial de um álbum via Deezer (com fallback para iTunes Search API)
 * quando a URL primária (ex.: Cover Art Archive) falha ou não existe.
 */
export async function resolveAlbumCoverUrl(
  albumTitle?: string | null,
  artistName?: string | null
): Promise<string | null> {
  if (!albumTitle || !albumTitle.trim()) return null;
  const key = buildResolvedCoverKey(albumTitle, artistName);
  if (!key || key === '::') return null;

  if (resolvedAlbumCoversMemory.has(key)) {
    return resolvedAlbumCoversMemory.get(key) ?? null;
  }

  const pending = inflightAlbumCoverResolve.get(key);
  if (pending) return pending;

  const task = (async (): Promise<string | null> => {
    const cleanTitle = stripEditionSuffix(albumTitle.trim()) || albumTitle.trim();
    const normTitle = normalizeText(cleanTitle);
    const normArtist = normalizeText(artistName || '');

    const titleMatches = (candidate: string) => {
      const c = normalizeText(stripEditionSuffix(candidate || ''));
      if (!c || !normTitle) return false;
      return c === normTitle || c.includes(normTitle) || normTitle.includes(c);
    };

    const artistMatches = (candidate: string) => {
      if (!normArtist) return true;
      const c = normalizeText(candidate || '');
      if (!c) return false;
      return c === normArtist || c.includes(normArtist) || normArtist.includes(c);
    };

    // 1. Tentativa via Deezer Album Search
    try {
      const query = artistName?.trim()
        ? `artist:"${artistName.trim()}" album:"${cleanTitle}"`
        : cleanTitle;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      const res = await fetch(
        `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=6`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const list: any[] = Array.isArray(json?.data) ? json.data : [];
        const match =
          list.find(
            (item) =>
              titleMatches(String(item?.title || '')) &&
              artistMatches(String(item?.artist?.name || ''))
          ) ||
          list.find((item) => artistMatches(String(item?.artist?.name || '')));

        const coverUrl: string | undefined =
          match?.cover_big || match?.cover_xl || match?.cover_medium;
        if (coverUrl && !/\/images\/cover\/\//.test(coverUrl)) {
          resolvedAlbumCoversMemory.set(key, coverUrl);
          persistResolvedAlbumCovers();
          return coverUrl;
        }
      }
    } catch {
      // fallback to iTunes
    }

    // 2. Fallback via iTunes Search API
    try {
      const term = artistName?.trim()
        ? `${artistName.trim()} ${cleanTitle}`
        : cleanTitle;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=6`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const list: any[] = Array.isArray(json?.results) ? json.results : [];
        const match = list.find(
          (item) =>
            titleMatches(String(item?.collectionName || '')) &&
            artistMatches(String(item?.artistName || ''))
        );
        const rawArt: string | undefined = match?.artworkUrl100 || match?.artworkUrl60;
        if (rawArt) {
          const highRes = rawArt.replace(/\d+x\d+bb\.(jpg|png)/i, '600x600bb.$1');
          resolvedAlbumCoversMemory.set(key, highRes);
          persistResolvedAlbumCovers();
          return highRes;
        }
      }
    } catch {
      // ignore
    }

    resolvedAlbumCoversMemory.set(key, null);
    persistResolvedAlbumCovers();
    return null;
  })();

  inflightAlbumCoverResolve.set(key, task);
  try {
    return await task;
  } finally {
    inflightAlbumCoverResolve.delete(key);
  }
}

export interface CoverArtResult {
  mbid: string;
  entityType?: 'release' | 'release-group';
  frontUrl: string;
  frontMediumUrl?: string;
  frontSmallUrl?: string;
  backUrl: string | null;
}

interface CachedCoverArt {
  result: CoverArtResult | null;
  cachedAt: number;
}

const memoryCache = new Map<string, CoverArtResult | null>();

export function getReleaseGroupCoverUrl(
  releaseGroupMbid: string,
  size: '250' | '500' | '1200' = '250'
): string {
  if (!releaseGroupMbid) return DEFAULT_ALBUM_COVER;
  if (missingCoversMemory.has(releaseGroupMbid.toLowerCase())) {
    return getFallbackImageUrl(releaseGroupMbid, 'album');
  }
  return `${CAA_RELEASE_GROUP_BASE}/${releaseGroupMbid}/front-${size}`;
}

export function getReleaseCoverUrl(
  releaseMbid: string,
  size: '250' | '500' | '1200' = '250'
): string {
  if (!releaseMbid) return DEFAULT_ALBUM_COVER;
  if (missingCoversMemory.has(releaseMbid.toLowerCase())) {
    return getFallbackImageUrl(releaseMbid, 'album');
  }
  return `${CAA_RELEASE_BASE}/${releaseMbid}/front-${size}`;
}

export function optimizeCoverUrl(
  url?: string | null,
  targetSize: '250' | '500' | '1200' = '250'
): string | undefined {
  if (!url) return undefined;
  if (url.includes('coverartarchive.org')) {
    return url.replace(/\/(front|back)(?:-(1200|500|250))?\b/, `/$1-${targetSize}`);
  }
  if (url.includes('dzcdn.net') || url.includes('e-cdns-images.dzcdn.net')) {
    const dim = targetSize === '1200' ? '1000x1000' : targetSize === '500' ? '500x500' : '250x250';
    const jpgQuality = targetSize === '1200' ? '90' : '85';
    return url.replace(/\/\d+x\d+-\d+-\d+-\d+-\d+\.jpg/i, `/${dim}-000000-${jpgQuality}-0-0.jpg`);
  }
  if (url.includes('mzstatic.com')) {
    const dim = targetSize === '1200' ? '1000x1000' : targetSize === '500' ? '600x600' : '300x300';
    return url.replace(/\/\d+x\d+bb\.(jpg|png)/i, `/${dim}bb.$1`);
  }
  if (url.includes('images.unsplash.com')) {
    const width = targetSize === '1200' ? '1200' : targetSize === '500' ? '600' : '300';
    const quality = targetSize === '1200' ? '85' : '75';
    return url
      .replace(/([?&])q=\d+/, `$1q=${quality}`)
      .replace(/([?&])w=\d+/, `$1w=${width}`);
  }
  return url;
}

function buildCacheKey(
  albumTitle: string,
  artistName: string,
  mbid?: string
): string {
  if (mbid) {
    return `${CACHE_PREFIX}mbid::${mbid.toLowerCase().trim()}`;
  }
  return `${CACHE_PREFIX}${artistName}::${albumTitle}`.toLowerCase().trim();
}

function readCache(cacheKey: string): {
  found: boolean;
  result: CoverArtResult | null;
} {
  if (memoryCache.has(cacheKey)) {
    return { found: true, result: memoryCache.get(cacheKey) ?? null };
  }
  try {
    const raw = Storage.getItem(cacheKey);
    if (!raw) return { found: false, result: null };
    const parsed = JSON.parse(raw) as CachedCoverArt;
    const ttl = parsed.result ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;
    if (Date.now() - parsed.cachedAt > ttl) {
      Storage.removeItem(cacheKey);
      return { found: false, result: null };
    }
    memoryCache.set(cacheKey, parsed.result);
    return { found: true, result: parsed.result };
  } catch {
    return { found: false, result: null };
  }
}

function writeCache(cacheKey: string, result: CoverArtResult | null): void {
  memoryCache.set(cacheKey, result);
  try {
    const payload: CachedCoverArt = { result, cachedAt: Date.now() };
    Storage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function sanitizeLucene(str: string): string {
  return str
    .replace(/["\\/()[\]{}~*?:!^&|+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchCaaJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function parseCaaImages(
  data: any,
  mbid: string,
  entityType: 'release' | 'release-group'
): CoverArtResult | null {
  if (!data || !Array.isArray(data.images) || data.images.length === 0) {
    return null;
  }

  const frontImg = data.images.find((img: any) => img.front) || data.images[0];
  const backImg = data.images.find((img: any) => img.back);

  if (!frontImg) return null;

  const frontUrl =
    frontImg.thumbnails?.['500'] ||
    frontImg.thumbnails?.large ||
    frontImg.thumbnails?.['1200'] ||
    frontImg.image ||
    `${entityType === 'release-group' ? CAA_RELEASE_GROUP_BASE : CAA_RELEASE_BASE}/${mbid}/front-500`;

  const frontMediumUrl =
    frontImg.thumbnails?.['250'] ||
    frontImg.thumbnails?.small ||
    frontImg.thumbnails?.['500'] ||
    frontImg.thumbnails?.large ||
    frontImg.image;

  const frontSmallUrl =
    frontImg.thumbnails?.['250'] ||
    frontImg.thumbnails?.small ||
    frontMediumUrl;

  const backUrl = backImg
    ? backImg.thumbnails?.['500'] ||
      backImg.thumbnails?.large ||
      backImg.thumbnails?.['250'] ||
      backImg.thumbnails?.small ||
      `${CAA_RELEASE_BASE}/${mbid}/back-500`
    : null;

  return {
    mbid,
    entityType,
    frontUrl,
    frontMediumUrl,
    frontSmallUrl,
    backUrl,
  };
}

export async function findAlbumCoverArt(
  albumTitle: string,
  artistName: string,
  mbid?: string,
  releaseId?: string
): Promise<CoverArtResult | null> {
  const cacheKey = buildCacheKey(albumTitle, artistName, mbid || releaseId);

  const cached = readCache(cacheKey);
  if (cached.found) return cached.result;

  if (releaseId) {
    const releaseData = await fetchCaaJson(`${CAA_RELEASE_BASE}/${releaseId}`);
    const parsedRelease = parseCaaImages(releaseData, releaseId, 'release');
    if (parsedRelease) {
      writeCache(cacheKey, parsedRelease);
      return parsedRelease;
    }
  }

  if (mbid) {
    const rgData = await fetchCaaJson(`${CAA_RELEASE_GROUP_BASE}/${mbid}`);
    const parsedRg = parseCaaImages(rgData, mbid, 'release-group');

    if (parsedRg) {
      if (!parsedRg.backUrl && rgData?.release) {
        const linkedReleaseId = String(rgData.release).split('/').pop();
        if (linkedReleaseId) {
          const relData = await fetchCaaJson(
            `${CAA_RELEASE_BASE}/${linkedReleaseId}`
          );
          const parsedRel = parseCaaImages(relData, linkedReleaseId, 'release');
          if (parsedRel?.backUrl) {
            parsedRg.backUrl = parsedRel.backUrl;
            parsedRg.mbid = linkedReleaseId;
            parsedRg.entityType = 'release';
          }
        }
      }
      writeCache(cacheKey, parsedRg);
      return parsedRg;
    }

    const relData = await fetchCaaJson(`${CAA_RELEASE_BASE}/${mbid}`);
    const parsedRel = parseCaaImages(relData, mbid, 'release');
    if (parsedRel) {
      writeCache(cacheKey, parsedRel);
      return parsedRel;
    }
  }

  const cleanTitle = sanitizeLucene(albumTitle);
  const cleanArtist = sanitizeLucene(artistName);

  if (!cleanTitle && !cleanArtist) return null;

  try {
    const luceneQuery = cleanArtist
      ? `release:(${cleanTitle}) AND artist:(${cleanArtist})`
      : `release:(${cleanTitle})`;

    const response = await fetch(
      `${MB_RELEASE_SEARCH}?query=${encodeURIComponent(luceneQuery)}&fmt=json&limit=10`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MusicpostrMobile/1.2.0 (https://musicpostr.com)',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const releases: any[] = data?.releases ?? [];

      const withFrontAndBack = releases.find(
        (release) =>
          release['cover-art-archive']?.artwork === true &&
          release['cover-art-archive']?.back === true
      );
      const withArtwork =
        withFrontAndBack ||
        releases.find(
          (release) => release['cover-art-archive']?.artwork === true
        );

      if (withArtwork) {
        const caa = withArtwork['cover-art-archive'];
        const result: CoverArtResult = {
          mbid: withArtwork.id,
          entityType: 'release',
          frontUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-500`,
          frontMediumUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-250`,
          frontSmallUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-250`,
          backUrl: caa.back ? `${CAA_RELEASE_BASE}/${withArtwork.id}/back-500` : null,
        };

        writeCache(cacheKey, result);
        return result;
      }
    }
  } catch {
    // fallback below
  }

  // Fallback final para Deezer/iTunes quando Cover Art Archive não tiver a capa
  const fallbackCover = await resolveAlbumCoverUrl(albumTitle, artistName);
  if (fallbackCover) {
    const result: CoverArtResult = {
      mbid: mbid || releaseId || '',
      entityType: 'release-group',
      frontUrl: optimizeCoverUrl(fallbackCover, '1200') || fallbackCover,
      frontMediumUrl: optimizeCoverUrl(fallbackCover, '500') || fallbackCover,
      frontSmallUrl: optimizeCoverUrl(fallbackCover, '250') || fallbackCover,
      backUrl: null,
    };
    writeCache(cacheKey, result);
    return result;
  }

  writeCache(cacheKey, null);
  return null;
}
