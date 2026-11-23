import {
  getFallbackImageUrl,
  getReleaseCoverUrl,
  getReleaseGroupCoverUrl,
} from './coverArt.service';
import { AppEvents, Storage } from './storage';

export { getFallbackImageUrl };

const MB_API_BASE = 'https://musicbrainz.org/ws/2';

const STORAGE_KEYS = {
  API_CACHE_PREFIX: 'musicpostr_mb_cache_v6_',
  TIMELINE_INTRO_PENDING: 'musicpostr_timeline_intro_pending_v1',
};

const API_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 horas

export interface CatalogTrack {
  id: string;
  title: string;
  duration: number; // segundos
  artist: {
    id?: string;
    name: string;
  };
  album: {
    id: string;
    title: string;
    cover_medium: string;
    cover_big?: string;
  };
}

export interface AlbumUserReview {
  id: string | number;
  userId?: string;
  user: string;
  username?: string;
  avatar?: string;
  comment: string;
  rating: number;
  date?: string;
  likes?: number;
  likedByMe?: boolean;
  commentsCount?: number;
}

export interface CatalogAlbum {
  id: string;
  releaseId?: string;
  title: string;
  cover_xl: string;
  cover_big: string;
  cover_medium: string;
  cover_small?: string;
  release_date: string;
  record_type: 'album' | 'ep' | 'single';
  genreName: string;
  label: string;
  artist: {
    id: string;
    name: string;
  };
  communityRating: number;
  totalReviews: number;
  listenersCount: number;
  listenedByMe?: boolean;
  isFavorite?: boolean;
  reviews?: AlbumUserReview[];
  tracks?: {
    data: {
      id: string;
      title: string;
      duration: number;
    }[];
  };
}

export interface CatalogArtist {
  id: string;
  name: string;
  imageUrl: string;
  genre: string;
  country?: string;
  nbFans: number;
  type?: string;
}

export type FeedActivityType = 'review' | 'favorite' | 'follow_idol' | 'list';

export interface FeedPostItem {
  id: string;
  userId?: string;
  activityType?: FeedActivityType;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
  albumTitle: string;
  artistName: string;
  albumCover: string;
  albumId: string;
  artistId?: string;
  artistGenre?: string;
  rating: number;
  comment: string;
  timeAgo: string;
  likesCount: number;
  isLiked: boolean;
  isEdited?: boolean;
  comments: {
    id: string;
    userId?: string;
    author: string;
    avatar: string;
    text: string;
    time: string;
  }[];
}

export interface MyReviewRecord {
  id: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  rating: number;
  comment: string;
  date: string;
}

export interface FavoriteAlbumRecord {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year?: string;
  rating: number;
}

export interface UserListRecord {
  id: string;
  title: string;
  count: number;
  description: string;
  createdAt: string;
  isDefault?: boolean;
  albums?: { id: string; title: string; cover: string }[];
}

export interface AlbumAward {
  id: string;
  ceremony: 'grammy' | 'vma' | 'billboard' | 'oscar' | 'brit';
  ceremonyName: string;
  awardName?: string;
  category: string;
  year: string;
  isWinner: boolean;
  result?: 'winner' | 'nominee';
  notes?: string;
  description?: string;
  logoUrl?: string;
}

export const CEREMONY_LOGOS: Record<string, string> = {
  grammy:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png',
  vma: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png',
  billboard:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png',
  brit: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Brit_Awards_trophy_symbol.png/240px-Brit_Awards_trophy_symbol.png',
  oscar:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Academy_Award_trophy.svg/200px-Academy_Award_trophy.svg.png',
  ama: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/American_Music_Awards_logo.svg/320px-American_Music_Awards_logo.svg.png',
  latin_grammy:
    'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Latin_Grammy_Awards_logo.svg/280px-Latin_Grammy_Awards_logo.svg.png',
};

const memoryApiCache = new Map<string, any>();
const inflightRequests = new Map<string, Promise<any>>();

export function subscribeAlbumsUpdated(listener: () => void): () => void {
  return AppEvents.on('musicpostr:albums-updated', listener);
}

export function notifyCatalogUpdated(): void {
  AppEvents.emit('musicpostr:albums-updated');
}

export function triggerTimelineIntroOnSignup(): void {
  try {
    Storage.setItem(STORAGE_KEYS.TIMELINE_INTRO_PENDING, 'true');
  } catch {
    // ignore
  }
}

export function consumeTimelineIntroOnce(): boolean {
  try {
    const val = Storage.getItem(STORAGE_KEYS.TIMELINE_INTRO_PENDING);
    if (val === 'true') {
      Storage.removeItem(STORAGE_KEYS.TIMELINE_INTRO_PENDING);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function readApiCache<T>(key: string): T | null {
  if (memoryApiCache.has(key)) {
    return memoryApiCache.get(key) as T;
  }
  try {
    const raw = Storage.getItem(STORAGE_KEYS.API_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; timestamp: number };
    if (Date.now() - parsed.timestamp > API_CACHE_TTL) {
      Storage.removeItem(STORAGE_KEYS.API_CACHE_PREFIX + key);
      return null;
    }
    memoryApiCache.set(key, parsed.data);
    return parsed.data;
  } catch {
    return null;
  }
}

function writeApiCache<T>(key: string, data: T): void {
  memoryApiCache.set(key, data);
  try {
    Storage.setItem(
      STORAGE_KEYS.API_CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
}

async function mbFetchJson(pathAndQuery: string): Promise<any | null> {
  const cached = readApiCache<any>(pathAndQuery);
  if (cached) return cached;

  const existingPromise = inflightRequests.get(pathAndQuery);
  if (existingPromise) return existingPromise;

  const requestPromise = (async () => {
    const attemptFetch = async (): Promise<{ status: number; data: any | null }> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(`${MB_API_BASE}/${pathAndQuery}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MusicpostrMobile/1.2.0 (https://musicpostr.com)',
          },
          signal: controller.signal,
        });
        if (!res.ok) return { status: res.status, data: null };
        const data = await res.json();
        return { status: res.status, data };
      } catch {
        return { status: 0, data: null };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      let result = await attemptFetch();
      // MusicBrainz retorna 503/429 quando excede 1 req/s — aguarda e tenta novamente uma vez
      if (result.status === 503 || result.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 950));
        result = await attemptFetch();
      }
      if (result.data && !result.data.unavailable && !result.data.error) {
        writeApiCache(pathAndQuery, result.data);
      }
      return result.data;
    } catch {
      return null;
    } finally {
      inflightRequests.delete(pathAndQuery);
    }
  })();

  inflightRequests.set(pathAndQuery, requestPromise);
  return requestPromise;
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  Pop: ['pop', 'synth-pop', 'dance-pop', 'electropop', 'indie pop', 'art pop', 'teen pop'],
  Rock: [
    'rock',
    'alternative rock',
    'progressive rock',
    'hard rock',
    'classic rock',
    'post-punk',
    'metal',
    'punk',
  ],
  'Hip-Hop': ['hip hop', 'hip-hop', 'rap', 'trap', 'conscious hip hop', 'boom bap'],
  Eletrônica: [
    'electronic',
    'house',
    'techno',
    'electro',
    'edm',
    'ambient',
    'hyperpop',
    'dance',
    'drum and bass',
  ],
  Indie: ['indie', 'indie rock', 'shoegaze', 'dream pop', 'lo-fi', 'alternative', 'psychedelic'],
  'R&B': ['r&b', 'rnb', 'soul', 'neo-soul', 'contemporary r&b', 'funk'],
  'Samba e pagode': ['samba', 'pagode', 'mpb', 'bossa nova', 'choro', 'brazilian'],
};

function mapTagsToGenre(tags?: { name: string }[]): string {
  if (tags && tags.length > 0) {
    const joined = tags.map((t) => t.name.toLowerCase()).join(' ');
    for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
      if (keywords.some((kw) => joined.includes(kw))) {
        return genre;
      }
    }
    return tags[0].name;
  }
  return 'Música';
}

function normalizeRecordType(
  primaryType?: string,
  secondaryTypes?: string[]
): 'album' | 'ep' | 'single' {
  const pt = (primaryType || '').toLowerCase();
  if (pt === 'ep') return 'ep';
  if (pt === 'single') return 'single';
  if (secondaryTypes?.some((s) => s.toLowerCase() === 'ep')) return 'ep';
  if (secondaryTypes?.some((s) => s.toLowerCase() === 'single')) return 'single';
  return 'album';
}

function formatArtistCredit(artistCredit?: any[]): { id: string; name: string } {
  if (!Array.isArray(artistCredit) || artistCredit.length === 0) {
    return { id: '', name: 'Artista Desconhecido' };
  }
  const firstArtist = artistCredit[0]?.artist || artistCredit[0];
  const fullName = artistCredit
    .map((ac) => (ac.name || ac.artist?.name || '') + (ac.joinphrase || ''))
    .join('')
    .trim();
  return {
    id: firstArtist?.id || '',
    name: fullName || firstArtist?.name || 'Artista',
  };
}

export function mapReleaseGroupToCatalogAlbum(rg: any): CatalogAlbum {
  const id = String(rg.id);
  const artist = formatArtistCredit(rg['artist-credit']);
  const recordType = normalizeRecordType(rg['primary-type'], rg['secondary-types']);
  const genreName = mapTagsToGenre(rg.tags || rg.genres);

  return {
    id,
    title: rg.title || 'Álbum',
    release_date: rg['first-release-date'] || rg.date || '',
    record_type: recordType,
    genreName,
    label: 'Oficial',
    artist,
    cover_xl: getReleaseGroupCoverUrl(id, '500'),
    cover_big: getReleaseGroupCoverUrl(id, '250'),
    cover_medium: getReleaseGroupCoverUrl(id, '250'),
    communityRating: 0,
    totalReviews: 0,
    listenersCount: 0,
    listenedByMe: false,
    isFavorite: false,
    reviews: [],
    tracks: { data: [] },
  };
}

const apiAlbumCache = new Map<string, CatalogAlbum>();

export async function fetchPopularAlbumsFromApi(limit = 25): Promise<CatalogAlbum[]> {
  try {
    const res = await fetch(`https://api.deezer.com/chart/0/albums?limit=${limit}`);
    if (!res.ok) return [];
    const json = await res.json();
    const list: any[] = Array.isArray(json?.data) ? json.data : [];

    const mapped: CatalogAlbum[] = list
      .filter((item) => item && item.id && item.title)
      .map((item) => ({
        id: `dz-album-${item.id}`,
        title: String(item.title),
        cover_xl: item.cover_xl || item.cover_big || item.cover_medium || '',
        cover_big: item.cover_big || item.cover_medium || item.cover_xl || '',
        cover_medium: item.cover_medium || item.cover_big || item.cover_xl || '',
        cover_small: item.cover_small || item.cover_medium || '',
        artist: {
          id: item.artist?.id ? `dz-artist-${item.artist.id}` : '',
          name: item.artist?.name || 'Artista',
        },
        release_date: item.release_date || '',
        record_type: item.record_type === 'ep' ? 'ep' : 'album',
        genreName: 'Popular',
        label: 'Oficial',
        communityRating: 0,
        totalReviews: 0,
        listenersCount: Number(item.position ? (limit + 1 - item.position) * 1000 : 0),
        listenedByMe: false,
        isFavorite: false,
        tracks: { data: [] },
        reviews: [],
      }));

    for (const alb of mapped) {
      apiAlbumCache.set(alb.id, alb);
    }
    return mapped;
  } catch {
    return [];
  }
}

export async function fetchNewReleasesFromMusicBrainz(limit = 12): Promise<CatalogAlbum[]> {
  const currentYear = new Date().getFullYear();
  const minYear = Math.max(2024, currentYear - 2);

  const query = `status:official AND primarytype:album AND date:[${minYear}-01-01 TO ${currentYear}-12-31] NOT artist:"Various Artists"`;
  const data = await mbFetchJson(
    `release?query=${encodeURIComponent(query)}&limit=24&fmt=json`
  );

  const results: CatalogAlbum[] = [];
  const seenReleaseGroups = new Set<string>();

  if (data && Array.isArray(data.releases) && data.releases.length > 0) {
    const sortedReleases = [...data.releases].sort((a, b) => {
      const aArt = a['cover-art-archive']?.artwork ? 1 : 0;
      const bArt = b['cover-art-archive']?.artwork ? 1 : 0;
      if (bArt !== aArt) return bArt - aArt;
      return String(b.date || '').localeCompare(String(a.date || ''));
    });

    for (const rel of sortedReleases) {
      const rgId = rel['release-group']?.id || rel.id;
      if (!rgId || seenReleaseGroups.has(rgId)) continue;

      const artist = formatArtistCredit(rel['artist-credit']);
      if (
        !artist.name ||
        artist.name.toLowerCase().includes('various artists') ||
        artist.name.toLowerCase().includes('[unknown]')
      ) {
        continue;
      }

      seenReleaseGroups.add(rgId);
      const hasReleaseArtwork = rel['cover-art-archive']?.artwork === true;
      const cover250 = hasReleaseArtwork
        ? getReleaseCoverUrl(rel.id, '250')
        : getReleaseGroupCoverUrl(rgId, '250');
      const cover500 = hasReleaseArtwork
        ? getReleaseCoverUrl(rel.id, '500')
        : getReleaseGroupCoverUrl(rgId, '500');

      const labelInfo = rel['label-info']?.[0]?.label?.name || 'Oficial';

      results.push({
        id: String(rgId),
        releaseId: rel.id,
        title: rel.title || 'Álbum',
        release_date: rel.date || `${currentYear}`,
        record_type: normalizeRecordType(rel['release-group']?.['primary-type']),
        genreName: 'Música',
        label: labelInfo,
        artist,
        cover_xl: cover500,
        cover_big: cover250,
        cover_medium: cover250,
        communityRating: 0,
        totalReviews: 0,
        listenersCount: 0,
        listenedByMe: false,
        isFavorite: false,
        reviews: [],
        tracks: { data: [] },
      });

      if (results.length >= limit) break;
    }
  }

  return results;
}

export async function searchAlbumsInMusicBrainz(
  query: string,
  limit = 15,
  offset = 0
): Promise<{ albums: CatalogAlbum[]; total: number }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { albums: [], total: 0 };
  }

  const data = await mbFetchJson(
    `release-group?query=${encodeURIComponent(trimmed)}&limit=${limit}&offset=${offset}&fmt=json`
  );

  if (!data || !Array.isArray(data['release-groups'])) {
    return { albums: [], total: 0 };
  }

  const mapped = data['release-groups'].map((rg: any) => mapReleaseGroupToCatalogAlbum(rg));

  return {
    albums: mapped,
    total: typeof data.count === 'number' ? data.count : mapped.length,
  };
}

export async function searchArtistsInMusicBrainz(
  query: string,
  limit = 18,
  offset = 0
): Promise<{ artists: CatalogArtist[]; total: number }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { artists: [], total: 0 };
  }

  const data = await mbFetchJson(
    `artist?query=${encodeURIComponent(trimmed)}&limit=${limit}&offset=${offset}&fmt=json`
  );

  if (!data || !Array.isArray(data.artists)) {
    return { artists: [], total: 0 };
  }

  const blockedNames = new Set([
    'various artists',
    'unknown',
    '[unknown]',
    'various',
    'none',
    'anonymous',
    'vários artistas',
    'artista desconhecido',
  ]);

  const normalizeName = (raw: string) =>
    raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const normQuery = normalizeName(trimmed);

  // Ordena priorizando correspondência exata + score + metadados oficiais (tags/país/tipo)
  const rankedArtists = [...data.artists]
    .filter((artist: any) => {
      const name = (artist.name || '').toLowerCase().trim();
      if (!name || name.startsWith('[') || blockedNames.has(name)) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      const normA = normalizeName(String(a.name || ''));
      const normB = normalizeName(String(b.name || ''));
      const exactA = normA === normQuery ? 1 : 0;
      const exactB = normB === normQuery ? 1 : 0;
      if (exactA !== exactB) return exactB - exactA;

      const scoreA = Number(a.score || 0);
      const scoreB = Number(b.score || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;

      const metaA =
        (Array.isArray(a.tags) ? a.tags.length : 0) +
        (a.country ? 2 : 0) +
        (a.type ? 1 : 0);
      const metaB =
        (Array.isArray(b.tags) ? b.tags.length : 0) +
        (b.country ? 2 : 0) +
        (b.type ? 1 : 0);
      return metaB - metaA;
    });

  // Deduplica por nome normalizado para não retornar o mesmo artista repetido
  const seenNames = new Set<string>();
  const uniqueArtists: any[] = [];
  for (const artist of rankedArtists) {
    const key = normalizeName(String(artist.name || ''));
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    uniqueArtists.push(artist);
  }

  const formatted: CatalogArtist[] = uniqueArtists.map((artist: any) => {
    const genre =
      artist.tags && artist.tags.length > 0
        ? artist.tags
            .slice(0, 2)
            .map((t: any) => t.name)
            .join(' / ')
        : artist.disambiguation || 'Artista';

    return {
      id: String(artist.id),
      name: artist.name,
      imageUrl: '',
      genre,
      country: artist.country || artist.area?.name || '',
      nbFans: 0,
      type: artist.type,
    };
  });

  return {
    artists: formatted,
    total: formatted.length,
  };
}

export async function searchTracksInMusicBrainz(
  query: string,
  limit = 10
): Promise<CatalogTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await mbFetchJson(
    `recording?query=${encodeURIComponent(trimmed)}&limit=${limit}&fmt=json`
  );

  if (!data || !Array.isArray(data.recordings)) {
    return [];
  }

  const tracks: CatalogTrack[] = [];
  for (const rec of data.recordings) {
    const artist = formatArtistCredit(rec['artist-credit']);
    const firstRelease = rec.releases?.[0];
    const releaseGroupId = firstRelease?.['release-group']?.id || firstRelease?.id || '';
    const albumTitle = firstRelease?.title || 'Single';

    tracks.push({
      id: String(rec.id),
      title: rec.title,
      duration: rec.length ? Math.round(rec.length / 1000) : 0,
      artist,
      album: {
        id: String(releaseGroupId),
        title: albumTitle,
        cover_medium: releaseGroupId
          ? getReleaseGroupCoverUrl(releaseGroupId, '250')
          : getFallbackImageUrl(rec.id || rec.title, 'album'),
        cover_big: releaseGroupId
          ? getReleaseGroupCoverUrl(releaseGroupId, '250')
          : getFallbackImageUrl(rec.id || rec.title, 'album'),
      },
    });
  }

  return tracks;
}

export interface MusicBrainzArtistDetails {
  id: string;
  name: string;
  bannerUrl: string;
  genre: string;
  country: string;
  label?: string;
  activeYears: string;
  type: string;
  disambiguation: string;
  wikipediaUrl?: string;
  wikidataId?: string;
  albums: CatalogAlbum[];
  epsAndSingles: CatalogAlbum[];
}

function formatLifeSpan(lifeSpan?: { begin?: string | null; end?: string | null; ended?: boolean }): string {
  if (!lifeSpan?.begin) return '';
  const beginYear = String(lifeSpan.begin).substring(0, 4);
  if (!/^\d{4}$/.test(beginYear)) return '';
  if (lifeSpan.end) {
    const endYear = String(lifeSpan.end).substring(0, 4);
    if (/^\d{4}$/.test(endYear)) {
      return `${beginYear} – ${endYear}`;
    }
  }
  return lifeSpan.ended ? `${beginYear} – Encerrado` : `${beginYear} – presente`;
}

function translateArtistType(rawType?: string | null): string {
  switch ((rawType || '').toLowerCase()) {
    case 'artist':
      return 'Artista Solo';
    case 'group':
      return 'Banda / Grupo';
    case 'orchestra':
      return 'Orquestra';
    case 'choir':
      return 'Coral';
    case 'character':
      return 'Personagem';
    default:
      return '';
  }
}

const EXCLUDED_STUDIO_SECONDARY_TYPES = new Set([
  'compilation',
  'live',
  'interview',
  'audiobook',
  'spokenword',
  'audio drama',
  'dj-mix',
]);

const COUNTRY_CODE_PT: Record<string, string> = {
  US: 'Estados Unidos',
  GB: 'Reino Unido',
  BR: 'Brasil',
  CA: 'Canadá',
  AU: 'Austrália',
  KR: 'Coreia do Sul',
  JP: 'Japão',
  FR: 'França',
  DE: 'Alemanha',
  ES: 'Espanha',
  MX: 'México',
  CO: 'Colômbia',
  AR: 'Argentina',
  IT: 'Itália',
  SE: 'Suécia',
  IE: 'Irlanda',
  NZ: 'Nova Zelândia',
  PR: 'Porto Rico',
  PT: 'Portugal',
  JM: 'Jamaica',
  BB: 'Barbados',
  NG: 'Nigéria',
  ZA: 'África do Sul',
  NL: 'Países Baixos',
  BE: 'Bélgica',
  NO: 'Noruega',
  DK: 'Dinamarca',
  IS: 'Islândia',
  CH: 'Suíça',
  AT: 'Áustria',
  CL: 'Chile',
  PE: 'Peru',
  UY: 'Uruguai',
};

function normalizeCountryName(areaName?: string, countryCode?: string): string {
  const code = String(countryCode || '').toUpperCase().trim();
  if (code && COUNTRY_CODE_PT[code]) {
    return COUNTRY_CODE_PT[code];
  }
  const area = String(areaName || '').trim();
  if (area.toLowerCase() === 'united states') return 'Estados Unidos';
  if (area.toLowerCase() === 'united kingdom') return 'Reino Unido';
  if (area.toLowerCase() === 'brazil') return 'Brasil';
  if (area.toLowerCase() === 'canada') return 'Canadá';
  if (area.toLowerCase() === 'australia') return 'Austrália';
  if (area.toLowerCase() === 'south korea') return 'Coreia do Sul';
  if (area.toLowerCase() === 'japan') return 'Japão';
  if (area.toLowerCase() === 'france') return 'França';
  if (area.toLowerCase() === 'germany') return 'Alemanha';
  if (area.toLowerCase() === 'spain') return 'Espanha';
  if (area.toLowerCase() === 'italy') return 'Itália';
  if (area.toLowerCase() === 'sweden') return 'Suécia';
  if (area.toLowerCase() === 'ireland') return 'Irlanda';
  return area || code || '';
}

async function fetchOfficialArtistLabelFromDeezer(artistName: string): Promise<string> {
  const q = artistName.trim();
  if (!q) return '';
  try {
    const searchRes = await fetch(
      `https://api.deezer.com/search/album?q=${encodeURIComponent(`artist:"${q}"`)}&limit=1`
    );
    if (!searchRes.ok) return '';
    const searchJson = await searchRes.json();
    const firstAlbum = Array.isArray(searchJson?.data) ? searchJson.data[0] : null;
    if (!firstAlbum?.id) return '';

    const albRes = await fetch(
      `https://api.deezer.com/album/${encodeURIComponent(String(firstAlbum.id))}`
    );
    if (!albRes.ok) return '';
    const albJson = await albRes.json();
    return typeof albJson?.label === 'string' ? albJson.label.trim() : '';
  } catch {
    return '';
  }
}

function deriveAnnualActivePeriod(
  lifeSpan: any,
  artistType: string | undefined,
  releases: CatalogAlbum[]
): string {
  const years = releases
    .map((r) => Number(String(r.release_date || '').slice(0, 4)))
    .filter((y) => Number.isFinite(y) && y >= 1950 && y <= new Date().getFullYear());
  const earliestReleaseYear = years.length > 0 ? Math.min(...years) : null;

  const isPerson = String(artistType || '').toLowerCase() === 'Artista';
  const beginYear = lifeSpan?.begin ? Number(String(lifeSpan.begin).slice(0, 4)) : null;
  const endYear = lifeSpan?.end ? Number(String(lifeSpan.end).slice(0, 4)) : null;
  const ended = Boolean(lifeSpan?.ended);

  // Para artistas solo (Artista), o life-span.begin do MusicBrainz é a data de nascimento;
  // priorizamos o ano do primeiro lançamento oficial para o período de atividade anual.
  const startYear =
    isPerson && earliestReleaseYear
      ? earliestReleaseYear
      : beginYear || earliestReleaseYear;

  if (!startYear) return '';
  if (ended && endYear) return `${startYear} – ${endYear}`;
  return `${startYear} – presente`;
}

export async function fetchSimilarArtistsFromApi(
  artistName: string,
  limit = 10
): Promise<CatalogArtist[]> {
  const q = artistName.trim();
  if (!q) return [];
  try {
    const searchRes = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=1`
    );
    if (!searchRes.ok) return [];
    const searchJson = await searchRes.json();
    const firstArtist = Array.isArray(searchJson?.data) ? searchJson.data[0] : null;
    if (!firstArtist?.id) return [];

    const relRes = await fetch(
      `https://api.deezer.com/artist/${encodeURIComponent(String(firstArtist.id))}/related?limit=${limit}`
    );
    if (!relRes.ok) return [];
    const relJson = await relRes.json();
    const list: any[] = Array.isArray(relJson?.data) ? relJson.data : [];

    const seen = new Set<string>();
    const results: CatalogArtist[] = [];
    for (const item of list) {
      const name = String(item?.name || '').trim();
      const norm = name.toLowerCase();
      if (!name || seen.has(norm)) continue;
      seen.add(norm);
      results.push({
        id: `dz-artist-${item.id}`,
        name,
        imageUrl: item.picture_xl || item.picture_big || item.picture_medium || '',
        genre: 'Artista',
        nbFans: Number(item.nb_fan || 0),
        country: '',
        type: 'Artista',
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchArtistDetailsFromMusicBrainz(
  artistId: string
): Promise<MusicBrainzArtistDetails | null> {
  // Suporte direto a artistas vindos da API do Deezer (ex.: Artistas parecidos / Populares)
  if (artistId.startsWith('dz-artist-')) {
    const dzId = artistId.replace('dz-artist-', '');
    try {
      const [artRes, albRes] = await Promise.all([
        fetch(`https://api.deezer.com/artist/${encodeURIComponent(dzId)}`),
        fetch(`https://api.deezer.com/artist/${encodeURIComponent(dzId)}/albums?limit=40`),
      ]);
      if (artRes.ok) {
        const art = await artRes.json();
        if (art && art.id && !art.error) {
          const albJson = albRes.ok ? await albRes.json() : { data: [] };
          const rawAlbs: any[] = Array.isArray(albJson?.data) ? albJson.data : [];
          const mappedAlbs: CatalogAlbum[] = rawAlbs
            .filter((a) => a && a.id && a.title && (a.record_type === 'album' || a.record_type === 'ep'))
            .map((a) => {
              const alb: CatalogAlbum = {
                id: `dz-album-${a.id}`,
                title: String(a.title),
                cover_xl: a.cover_xl || a.cover_big || a.cover_medium || '',
                cover_big: a.cover_big || a.cover_medium || a.cover_xl || '',
                cover_medium: a.cover_medium || a.cover_big || a.cover_xl || '',
                cover_small: a.cover_small || a.cover_medium || '',
                artist: { id: artistId, name: String(art.name || 'Artista') },
                release_date: a.release_date || '',
                record_type: a.record_type === 'ep' ? 'ep' : 'album',
                genreName: 'Música',
                label: 'Oficial',
                communityRating: 0,
                totalReviews: 0,
                listenersCount: Number(a.fans || 0),
                listenedByMe: false,
                isFavorite: false,
                tracks: { data: [] },
                reviews: [],
              };
              apiAlbumCache.set(alb.id, alb);
              return alb;
            })
            .sort((a, b) => String(b.release_date || '').localeCompare(String(a.release_date || '')));

          // Enriquecimento de metadados oficiais via MusicBrainz (país, gênero, atividade, tipo)
          let enrichedGenre = 'Artista';
          let enrichedCountry = '';
          let enrichedActiveYears = '';
          let enrichedType = 'Artista';
          let enrichedDisambiguation = '';

          try {
            const mbSearch = await mbFetchJson(
              `artist?query=${encodeURIComponent(`artist:"${String(art.name || '')}"`)}&limit=1&fmt=json`
            );
            const mbArtist = Array.isArray(mbSearch?.artists) ? mbSearch.artists[0] : null;
            if (mbArtist) {
              if (Array.isArray(mbArtist.tags) && mbArtist.tags.length > 0) {
                enrichedGenre = mbArtist.tags
                  .slice(0, 3)
                  .map((t: any) =>
                    String(t.name || '')
                      .split(' ')
                      .map((w: string) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
                      .join(' ')
                  )
                  .join(' • ');
              }
              enrichedCountry = mbArtist.area?.name || mbArtist['begin-area']?.name || mbArtist.country || '';
              enrichedActiveYears = formatLifeSpan(mbArtist['life-span']);
              enrichedType = translateArtistType(mbArtist.type);
              enrichedDisambiguation = mbArtist.disambiguation || '';
            }
          } catch {
            // non-blocking
          }

          const officialAlbums = mappedAlbs.filter((a) => a.record_type === 'album');
          const officialEps = mappedAlbs.filter((a) => a.record_type === 'ep');
          const dzLabel = await fetchOfficialArtistLabelFromDeezer(String(art.name || ''));

          return {
            id: artistId,
            name: String(art.name || 'Artista'),
            bannerUrl: art.picture_xl || art.picture_big || art.picture_medium || '',
            genre: enrichedGenre,
            country: normalizeCountryName(enrichedCountry, ''),
            label: dzLabel || undefined,
            activeYears:
              deriveAnnualActivePeriod(null, undefined, [...officialAlbums, ...officialEps]) ||
              enrichedActiveYears,
            type: enrichedType,
            disambiguation: enrichedDisambiguation,
            albums: officialAlbums,
            epsAndSingles: officialEps,
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  }
  const artistData = await mbFetchJson(
    `artist/${artistId}?inc=release-groups+tags+genres+url-rels&fmt=json`
  );

  if (!artistData || !artistData.id) {
    return null;
  }

  const artistName = artistData.name || 'Artista';
  const beginArea = artistData['begin-area']?.name || '';
  const mainArea = artistData.area?.name || '';
  const countryCode = artistData.country || '';
  const country = normalizeCountryName(mainArea || beginArea, countryCode);

  const rawGenres: { name: string; count?: number }[] = Array.isArray(artistData.genres)
    ? artistData.genres
    : [];
  const rawTags: { name: string; count?: number }[] = Array.isArray(artistData.tags)
    ? artistData.tags
    : [];
  const genrePool = (rawGenres.length > 0 ? rawGenres : rawTags)
    .slice()
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  const genre = genrePool.length
    ? genrePool
        .slice(0, 3)
        .map((t) =>
          t.name
            .split(' ')
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
            .join(' ')
        )
        .join(' • ')
    : 'Artista';

  const activeYears = formatLifeSpan(artistData['life-span']);
  const type = translateArtistType(artistData.type);
  const disambiguation = artistData.disambiguation || '';

  let wikipediaUrl: string | undefined;
  let wikidataId: string | undefined;
  const relations: any[] = Array.isArray(artistData.relations) ? artistData.relations : [];
  for (const rel of relations) {
    const resource = String(rel?.url?.resource || '');
    if (!resource) continue;
    if (rel.type === 'wikipedia' || resource.includes('wikipedia.org/wiki/')) {
      if (!wikipediaUrl || resource.includes('pt.wikipedia.org')) {
        wikipediaUrl = resource;
      }
    } else if (rel.type === 'wikidata' || resource.includes('wikidata.org/wiki/')) {
      const match = resource.match(/\/(Q\d+)$/i);
      if (match?.[1]) wikidataId = match[1].toUpperCase();
    }
  }

  let releaseGroups: any[] = artistData['release-groups'] || [];

  // O endpoint artist?inc=release-groups retorna no máximo 25 itens.
  // Se atingiu o limite, busca a discografia completa (até 100 itens).
  if (releaseGroups.length >= 25) {
    const fullRgData = await mbFetchJson(
      `release-group?artist=${artistId}&limit=100&fmt=json`
    );
    if (fullRgData && Array.isArray(fullRgData['release-groups']) && fullRgData['release-groups'].length > releaseGroups.length) {
      releaseGroups = fullRgData['release-groups'];
    }
  }

  const uniqueMap = new Map<string, any>();
  for (const rg of releaseGroups) {
    const secondaryTypes: string[] = Array.isArray(rg['secondary-types'])
      ? rg['secondary-types'].map((s: string) => s.toLowerCase())
      : [];
    const primaryType = String(rg['primary-type'] || '').toLowerCase();

    // Mantém apenas álbuns oficiais e EPs oficiais (sem compilações, ao vivo, remixes, bootlegs, etc.)
    if (primaryType !== 'album' && primaryType !== 'ep') {
      continue;
    }
    if (secondaryTypes.length > 0) {
      continue;
    }

    const normTitle = String(rg.title || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (!normTitle) continue;
    const dedupeKey = `${normalizeRecordType(rg['primary-type'], rg['secondary-types'])}::${normTitle}`;
    const existing = uniqueMap.get(dedupeKey);
    if (!existing) {
      uniqueMap.set(dedupeKey, rg);
    } else if (!existing['first-release-date'] && rg['first-release-date']) {
      uniqueMap.set(dedupeKey, rg);
    }
  }

  const allReleases = Array.from(uniqueMap.values())
    .map((rg) => {
      const mapped = mapReleaseGroupToCatalogAlbum(rg);
      return {
        ...mapped,
        artist: { id: artistId, name: artistName },
      };
    })
    .sort((a, b) => String(b.release_date || '').localeCompare(String(a.release_date || '')));

  const albums = allReleases.filter((item) => item.record_type === 'album');
  const epsAndSingles = allReleases.filter((item) => item.record_type === 'ep');

  const bannerUrl =
    albums[0]?.cover_xl ||
    albums[0]?.cover_medium ||
    epsAndSingles[0]?.cover_medium ||
    '';

  const officialLabel = await fetchOfficialArtistLabelFromDeezer(artistName);
  const annualActiveYears =
    deriveAnnualActivePeriod(artistData['life-span'], artistData.type, allReleases) ||
    activeYears;

  return {
    id: artistId,
    name: artistName,
    bannerUrl,
    genre,
    country,
    label: officialLabel || undefined,
    activeYears: annualActiveYears,
    type,
    disambiguation,
    wikipediaUrl,
    wikidataId,
    albums,
    epsAndSingles,
  };
}

const BIO_CACHE_PREFIX = 'musicpostr_artist_bio_v2_';
const BIO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const bioMemoryCache = new Map<string, { bio: string; source: string } | null>();
const inflightBioRequests = new Map<string, Promise<{ bio: string; source: string } | null>>();

async function fetchWikiSummary(lang: 'pt' | 'en', pageTitle: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MusicpostrMobile/1.0 (https://musicpostr.app)',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.type === 'disambiguation') return null;
    const extract = typeof data?.extract === 'string' ? data.extract.trim() : '';
    return extract.length >= 40 ? extract : null;
  } catch {
    return null;
  }
}

async function searchWikiMusicArticle(
  lang: 'pt' | 'en',
  artistName: string
): Promise<string | null> {
  try {
    const suffix = lang === 'pt' ? 'cantor OR banda OR músico' : 'singer OR band OR musician';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        `"${artistName}" (${suffix})`
      )}&srlimit=3&format=json&origin=*`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MusicpostrMobile/1.0 (https://musicpostr.app)',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const hits: any[] = Array.isArray(data?.query?.search) ? data.query.search : [];
    for (const hit of hits) {
      if (!hit?.title) continue;
      const summary = await fetchWikiSummary(lang, String(hit.title));
      if (summary) return summary;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveWikiTitlesFromWikidata(
  wikidataId: string
): Promise<{ pt?: string; en?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
        wikidataId
      )}&props=sitelinks&sitefilter=ptwiki|enwiki&format=json&origin=*`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const data = await res.json();
    const sitelinks = data?.entities?.[wikidataId]?.sitelinks;
    return {
      pt: sitelinks?.ptwiki?.title,
      en: sitelinks?.enwiki?.title,
    };
  } catch {
    return {};
  }
}

/**
 * Busca a biografia real do artista na Wikipedia (priorizando PT-BR, com fallback para EN)
 * usando os links oficiais do MusicBrainz/Wikidata ou busca direta pelo nome.
 */
export async function fetchArtistBioFromWikipedia(
  artistName: string,
  wikipediaUrl?: string,
  wikidataId?: string
): Promise<{ bio: string; source: string } | null> {
  const key = artistName.trim().toLowerCase();
  if (!key) return null;

  if (bioMemoryCache.has(key)) {
    return bioMemoryCache.get(key) ?? null;
  }

  try {
    const raw = Storage.getItem(BIO_CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        value: { bio: string; source: string } | null;
        cachedAt: number;
      };
      if (Date.now() - parsed.cachedAt < BIO_CACHE_TTL_MS) {
        bioMemoryCache.set(key, parsed.value);
        return parsed.value;
      }
      Storage.removeItem(BIO_CACHE_PREFIX + key);
    }
  } catch {
    // ignore
  }

  const pending = inflightBioRequests.get(key);
  if (pending) return pending;

  const task = (async (): Promise<{ bio: string; source: string } | null> => {
    let result: { bio: string; source: string } | null = null;

    // 1. Se temos Wikidata ID do MusicBrainz, resolvemos diretamente o artigo PT e EN exato
    if (wikidataId) {
      const titles = await resolveWikiTitlesFromWikidata(wikidataId);
      if (titles.pt) {
        const ptBio = await fetchWikiSummary('pt', titles.pt);
        if (ptBio) result = { bio: ptBio, source: 'Wikipedia (PT) & MusicBrainz' };
      }
      if (!result && titles.en) {
        const enBio = await fetchWikiSummary('en', titles.en);
        if (enBio) result = { bio: enBio, source: 'Wikipedia (EN) & MusicBrainz' };
      }
    }

    // 2. Se temos URL direta da Wikipedia do MusicBrainz
    if (!result && wikipediaUrl) {
      const match = wikipediaUrl.match(/https?:\/\/([a-z]{2})\.wikipedia\.org\/wiki\/(.+)$/i);
      if (match?.[1] && match?.[2]) {
        const lang = match[1].toLowerCase() === 'pt' ? 'pt' : 'en';
        const title = decodeURIComponent(match[2]).replace(/_/g, ' ');
        const directBio = await fetchWikiSummary(lang, title);
        if (directBio) {
          result = {
            bio: directBio,
            source: `Wikipedia (${lang.toUpperCase()}) & MusicBrainz`,
          };
        }
      }
    }

    // 3. Fallback por nome exato na Wikipedia PT e depois EN (validando contexto musical)
    if (!result) {
      const musicRegex =
        /\b(cantor|cantora|banda|músic|music|singer|songwriter|rapper|band|album|álbum|rock|pop|hip[- ]hop|dj|produtor|producer|compositor|vocalist|guitarist|mpb|samba|funk|sertanejo|jazz|soul)\b/i;

      const ptDirect = await fetchWikiSummary('pt', artistName.trim());
      if (ptDirect && musicRegex.test(ptDirect)) {
        result = { bio: ptDirect, source: 'Wikipedia (PT) & MusicBrainz' };
      } else {
        const ptSearch = await searchWikiMusicArticle('pt', artistName.trim());
        if (ptSearch) {
          result = { bio: ptSearch, source: 'Wikipedia (PT)' };
        } else {
          const enDirect = await fetchWikiSummary('en', artistName.trim());
          if (enDirect && musicRegex.test(enDirect)) {
            result = { bio: enDirect, source: 'Wikipedia (EN) & MusicBrainz' };
          } else {
            const enSearch = await searchWikiMusicArticle('en', artistName.trim());
            if (enSearch) {
              result = { bio: enSearch, source: 'Wikipedia (EN)' };
            }
          }
        }
      }
    }

    if (result) {
      bioMemoryCache.set(key, result);
      try {
        Storage.setItem(
          BIO_CACHE_PREFIX + key,
          JSON.stringify({ value: result, cachedAt: Date.now() })
        );
      } catch {
        // ignore
      }
    }
    return result;
  })();

  inflightBioRequests.set(key, task);
  try {
    return await task;
  } finally {
    inflightBioRequests.delete(key);
  }
}

export async function fetchAlbumDetailsFromMusicBrainz(
  albumId: string
): Promise<CatalogAlbum | null> {
  // Suporte direto a álbuns vindos da API do Deezer (ex.: aba Populares do Ranking)
  if (albumId.startsWith('dz-album-')) {
    const dzId = albumId.replace('dz-album-', '');
    try {
      const res = await fetch(`https://api.deezer.com/album/${encodeURIComponent(dzId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id && !data.error) {
          const tracksData = Array.isArray(data.tracks?.data)
            ? data.tracks.data.map((t: any) => ({
                id: `dz-track-${t.id}`,
                title: String(t.title || 'Faixa'),
                duration: Number(t.duration || 0),
              }))
            : [];

          const genreName =
            Array.isArray(data.genres?.data) && data.genres.data[0]?.name
              ? String(data.genres.data[0].name)
              : 'Música';

          const albumResult: CatalogAlbum = {
            id: albumId,
            title: String(data.title || 'Álbum'),
            cover_xl: data.cover_xl || data.cover_big || data.cover_medium || '',
            cover_big: data.cover_big || data.cover_medium || data.cover_xl || '',
            cover_medium: data.cover_medium || data.cover_big || data.cover_xl || '',
            cover_small: data.cover_small || data.cover_medium || '',
            artist: {
              id: data.artist?.id ? `dz-artist-${data.artist.id}` : '',
              name: data.artist?.name || 'Artista',
            },
            release_date: data.release_date || '',
            record_type: data.record_type === 'ep' ? 'ep' : 'album',
            genreName,
            label: data.label || 'Oficial',
            communityRating: 0,
            totalReviews: 0,
            listenersCount: Number(data.fans || 0),
            listenedByMe: false,
            isFavorite: false,
            tracks: { data: tracksData },
            reviews: [],
          };
          apiAlbumCache.set(albumId, albumResult);
          return albumResult;
        }
      }
    } catch {
      // fallback para cache em memória
    }
    return apiAlbumCache.get(albumId) || null;
  }

  let releaseGroupId = albumId;
  let targetReleaseId = '';
  let title = '';
  let releaseDate = '';
  let recordType: 'album' | 'ep' | 'single' = 'album';
  let artist = { id: '', name: 'Artista' };
  let genreName = 'Música';
  let label = 'Oficial';

  const rgData = await mbFetchJson(
    `release-group/${albumId}?inc=artist-credits+releases+tags+genres&fmt=json`
  );

  if (rgData && rgData.id) {
    releaseGroupId = rgData.id;
    title = rgData.title || '';
    releaseDate = rgData['first-release-date'] || '';
    recordType = normalizeRecordType(rgData['primary-type'], rgData['secondary-types']);
    artist = formatArtistCredit(rgData['artist-credit']);
    if (rgData.tags?.length || rgData.genres?.length) {
      genreName = mapTagsToGenre(rgData.tags || rgData.genres);
    }

    const releasesList: any[] = rgData.releases || [];
    if (releasesList.length > 0) {
      const officialRelease =
        releasesList.find(
          (r) =>
            String(r.status || '').toLowerCase() === 'official' &&
            (r.country === 'US' || r.country === 'XW' || r.country === 'GB' || r.country === 'BR')
        ) ||
        releasesList.find((r) => String(r.status || '').toLowerCase() === 'official') ||
        releasesList[0];

      targetReleaseId = officialRelease.id;
    }
  } else {
    targetReleaseId = albumId;
  }

  const tracksList: { id: string; title: string; duration: number }[] = [];

  if (targetReleaseId) {
    const releaseDetails = await mbFetchJson(
      `release/${targetReleaseId}?inc=recordings+labels&fmt=json`
    );

    if (releaseDetails && releaseDetails.id) {
      if (!title) title = releaseDetails.title || '';
      if (!releaseDate) releaseDate = releaseDetails.date || '';
      if (releaseDetails['release-group']?.id) {
        releaseGroupId = releaseDetails['release-group'].id;
        recordType = normalizeRecordType(
          releaseDetails['release-group']['primary-type'],
          releaseDetails['release-group']['secondary-types']
        );
      }
      if (!artist.id && releaseDetails['artist-credit']) {
        artist = formatArtistCredit(releaseDetails['artist-credit']);
      }
      const foundLabel = releaseDetails['label-info']?.[0]?.label?.name;
      if (foundLabel) {
        label = foundLabel;
      }

      const mediaList: any[] = releaseDetails.media || [];
      for (const medium of mediaList) {
        const mediumTracks: any[] = medium.tracks || [];
        for (const tr of mediumTracks) {
          const durationMs = tr.length ?? tr.recording?.length ?? 0;
          tracksList.push({
            id: String(tr.recording?.id || tr.id || `${tracksList.length + 1}`),
            title: tr.title || tr.recording?.title || `Faixa ${tracksList.length + 1}`,
            duration: durationMs ? Math.round(durationMs / 1000) : 0,
          });
        }
      }
    }
  }

  if (!title) {
    return apiAlbumCache.get(albumId) || null;
  }

  return {
    id: String(releaseGroupId),
    releaseId: targetReleaseId || undefined,
    title,
    release_date: releaseDate,
    record_type: recordType,
    genreName,
    label,
    artist,
    cover_xl: getReleaseGroupCoverUrl(releaseGroupId, '500'),
    cover_big: getReleaseGroupCoverUrl(releaseGroupId, '250'),
    cover_medium: getReleaseGroupCoverUrl(releaseGroupId, '250'),
    communityRating: 0,
    totalReviews: 0,
    listenersCount: 0,
    listenedByMe: false,
    isFavorite: false,
    reviews: [],
    tracks: {
      data: tracksList,
    },
  };
}
