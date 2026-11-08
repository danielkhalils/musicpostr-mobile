import { Storage } from './storage';

const MB_RELEASE_SEARCH = 'https://musicbrainz.org/ws/2/release';
const CAA_RELEASE_BASE = 'https://coverartarchive.org/release';
const CAA_RELEASE_GROUP_BASE = 'https://coverartarchive.org/release-group';
const CACHE_PREFIX = 'musicpostr_coverart_v2_';
const MISSING_COVERS_KEY = 'musicpostr_missing_covers_v2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const NEGATIVE_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 dia

export const DEFAULT_ALBUM_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop';

export const DEFAULT_ARTIST_IMAGE =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop';

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
  size: '250' | '500' | '1200' = '500'
): string {
  if (!releaseGroupMbid) return DEFAULT_ALBUM_COVER;
  if (missingCoversMemory.has(releaseGroupMbid.toLowerCase())) {
    return DEFAULT_ALBUM_COVER;
  }
  return `${CAA_RELEASE_GROUP_BASE}/${releaseGroupMbid}/front-${size}`;
}

export function getReleaseCoverUrl(
  releaseMbid: string,
  size: '250' | '500' | '1200' = '500'
): string {
  if (!releaseMbid) return DEFAULT_ALBUM_COVER;
  if (missingCoversMemory.has(releaseMbid.toLowerCase())) {
    return DEFAULT_ALBUM_COVER;
  }
  return `${CAA_RELEASE_BASE}/${releaseMbid}/front-${size}`;
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
    frontImg.thumbnails?.['1200'] ||
    frontImg.thumbnails?.large ||
    frontImg.image ||
    `${entityType === 'release-group' ? CAA_RELEASE_GROUP_BASE : CAA_RELEASE_BASE}/${mbid}/front-1200`;

  const frontMediumUrl =
    frontImg.thumbnails?.['500'] ||
    frontImg.thumbnails?.large ||
    frontImg.image;

  const frontSmallUrl =
    frontImg.thumbnails?.['250'] ||
    frontImg.thumbnails?.small ||
    frontMediumUrl;

  const backUrl = backImg
    ? backImg.thumbnails?.['1200'] ||
      backImg.thumbnails?.large ||
      backImg.image ||
      `${CAA_RELEASE_BASE}/${mbid}/back`
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
      frontUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-1200`,
      frontMediumUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-500`,
      frontSmallUrl: `${CAA_RELEASE_BASE}/${withArtwork.id}/front-250`,
      backUrl: caa.back ? `${CAA_RELEASE_BASE}/${withArtwork.id}/back` : null,
    };

    writeCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
