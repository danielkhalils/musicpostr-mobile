import {
  getReleaseGroupCoverUrl,
  getReleaseCoverUrl,
  getFallbackImageUrl,
} from './coverArt.service';
import { Storage, AppEvents } from './storage';

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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);
      const res = await fetch(`${MB_API_BASE}/${pathAndQuery}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MusicpostrMobile/1.2.0 (https://musicpostr.com)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && !data.unavailable && !data.error) {
        writeApiCache(pathAndQuery, data);
      }
      return data;
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

  const validArtists = data.artists.filter((artist: any) => {
    const name = (artist.name || '').toLowerCase().trim();
    if (!name || name.startsWith('[') || blockedNames.has(name)) return false;
    return true;
  });

  const formatted: CatalogArtist[] = validArtists.map((artist: any) => {
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
      imageUrl: getFallbackImageUrl(artist.id || artist.name, 'artist'),
      genre,
      country: artist.country || artist.area?.name || '',
      nbFans: 0,
      type: artist.type,
    };
  });

  return {
    artists: formatted,
    total: typeof data.count === 'number' ? data.count : formatted.length,
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

export async function fetchArtistDetailsFromMusicBrainz(artistId: string): Promise<{
  id: string;
  name: string;
  bannerUrl: string;
  genre: string;
  country: string;
  albums: CatalogAlbum[];
  epsAndSingles: CatalogAlbum[];
} | null> {
  const artistData = await mbFetchJson(
    `artist/${artistId}?inc=release-groups+tags+genres&fmt=json`
  );

  if (!artistData || !artistData.id) {
    return null;
  }

  const artistName = artistData.name || 'Artista';
  const country = artistData.country || artistData.area?.name || '';
  const genre = artistData.tags?.length
    ? artistData.tags
        .slice(0, 3)
        .map((t: any) => t.name)
        .join(' • ')
    : 'Artista';

  const releaseGroups: any[] = artistData['release-groups'] || [];

  const uniqueMap = new Map<string, any>();
  for (const rg of releaseGroups) {
    const normTitle = String(rg.title || '').toLowerCase().trim();
    if (!normTitle) continue;
    const existing = uniqueMap.get(normTitle);
    if (!existing) {
      uniqueMap.set(normTitle, rg);
    } else if (!existing['first-release-date'] && rg['first-release-date']) {
      uniqueMap.set(normTitle, rg);
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
  const epsAndSingles = allReleases.filter(
    (item) => item.record_type === 'ep' || item.record_type === 'single'
  );

  const bannerUrl =
    albums[0]?.cover_xl ||
    albums[0]?.cover_medium ||
    epsAndSingles[0]?.cover_medium ||
    getFallbackImageUrl(artistId || artistName, 'artist');

  return {
    id: artistId,
    name: artistName,
    bannerUrl,
    genre,
    country,
    albums,
    epsAndSingles,
  };
}

export async function fetchAlbumDetailsFromMusicBrainz(
  albumId: string
): Promise<CatalogAlbum | null> {
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
    return null;
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
