import { Storage } from './storage';

const MB_RELEASE_SEARCH = 'https://musicbrainz.org/ws/2/release';
const CAA_RELEASE_BASE = 'https://coverartarchive.org/release';
const CAA_RELEASE_GROUP_BASE = 'https://coverartarchive.org/release-group';
const CACHE_PREFIX = 'musicpostr_coverart_v2_';
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
try {
  const savedMissing = Storage.getItem(MISSING_COVERS_KEY);
  if (savedMissing) {
    const parsed: string[] = JSON.parse(savedMissing);
    parsed.forEach((id) => missingCoversMemory.add(id));
  }
} catch {
  // ignore
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
    return url.replace(/\/(front|back)-(1200|500|250)\b/, `/$1-${targetSize}`);
  }
  if (url.includes('images.unsplash.com')) {
    const width = targetSize === '1200' ? '1080' : targetSize === '500' ? '500' : '250';
    const quality = targetSize === '1200' ? '80' : '65';
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

    if (!response.ok) {
      return null;
    }

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

    if (!withArtwork) {
      writeCache(cacheKey, null);
      return null;
    }

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
  } catch {
    return null;
  }
}
