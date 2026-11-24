import { formatSocialDate } from '@/utils/date';
import {
  fetchAlbumAwardsFromApi,
  fetchArtistAwardsFromWikidata,
} from './awards.service';
import {
  notifyCatalogUpdated,
  type AlbumAward,
  type AlbumUserReview,
  type CatalogAlbum,
  type CatalogArtist,
  type CatalogTrack,
  type FeedPostItem,
  type UserListRecord,
} from './musicBrainz.service';
import { fetchLiveRecordLabelDetails } from './recordLabel.service';
import { supabase } from './supabase';

export interface GenreRecord {
  id: string;
  name: string;
  emoji: string;
}

export interface RecordLabelRecord {
  id: string;
  name: string;
  desc: string;
}

export interface RecordLabelFullDetails {
  id: string;
  name: string;
  desc: string;
  founded: string;
  headquarters: string;
  parentGroup: string;
  genres: string[];
  bio: string;
  artists: CatalogArtist[];
  albums: CatalogAlbum[];
}

export interface CommunityReviewItem {
  id: string;
  userId?: string;
  userName: string;
  username: string;
  userAvatar: string;
  albumTitle: string;
  artistName: string;
  albumCover: string;
  albumId: string;
  rating: number;
  comment: string;
  timeAgo: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
}

function formatRelativeTime(
  isoDate?: string | null,
  fallbackLabel?: string | null,
  isEdited?: boolean
): string {
  return formatSocialDate(isoDate, { fallback: fallbackLabel, isEdited });
}

export function mapDbAlbumToCatalog(row: any): CatalogAlbum {
  return {
    id: String(row.id),
    releaseId: row.release_id || undefined,
    title: row.title || 'Álbum',
    cover_xl: row.cover_xl || row.cover_big || row.cover_medium || '',
    cover_big: row.cover_big || row.cover_medium || row.cover_xl || '',
    cover_medium: row.cover_medium || row.cover_big || row.cover_xl || '',
    cover_small: row.cover_small || row.cover_medium || '',
    artist: {
      id: String(row.artist_id || ''),
      name: row.artist_name || 'Artista',
    },
    release_date: row.release_date || '',
    record_type: row.record_type || 'album',
    genreName: row.genre_name || 'Música',
    label: row.label || 'Independente',
    communityRating: Number(row.community_rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    listenersCount: Number(row.listeners_count || 0),
    listenedByMe: false,
    isFavorite: false,
    tracks: { data: [] },
    reviews: [],
  };
}

export function mapDbArtistToCatalog(row: any): CatalogArtist {
  return {
    id: String(row.id),
    name: row.name || 'Artista',
    imageUrl: row.image_url || row.banner_url || '',
    genre: row.genre || 'Artista',
    nbFans: Number(row.nb_fans || 0),
    country: row.country || '',
    type: row.type || 'Artista',
  };
}

export function mapDbTrackToCatalog(row: any): CatalogTrack {
  const album = Array.isArray(row.album) ? row.album[0] : row.album;
  return {
    id: String(row.id),
    title: row.title || 'Faixa',
    duration: Number(row.duration || 0),
    artist: {
      id: row.artist_id ? String(row.artist_id) : album?.artist_id ? String(album.artist_id) : undefined,
      name: row.artist_name || album?.artist_name || 'Artista',
    },
    album: {
      id: row.album_id ? String(row.album_id) : '',
      title: album?.title || 'Álbum',
      cover_medium: album?.cover_medium || album?.cover_big || '',
      cover_big: album?.cover_big || album?.cover_medium || '',
    },
  };
}

// ============================================================================
// GÊNEROS & GRAVADORAS
// ============================================================================

const DEFAULT_GENRES: GenreRecord[] = [
  { id: 'pop', name: 'Pop', emoji: '✨' },
  { id: 'rock', name: 'Rock', emoji: '🎸' },
  { id: 'hip-hop', name: 'Hip-Hop', emoji: '🎤' },
  { id: 'rap', name: 'Rap', emoji: '🔥' },
  { id: 'rnb', name: 'R&B', emoji: '💜' },
  { id: 'indie', name: 'Indie', emoji: '🌙' },
  { id: 'electronic', name: 'Eletrônica', emoji: '🎛️' },
  { id: 'mpb', name: 'MPB', emoji: '🇧🇷' },
  { id: 'samba', name: 'Samba', emoji: '🥁' },
  { id: 'bossa-nova', name: 'Bossa Nova', emoji: '🌴' },
  { id: 'funk', name: 'Funk', emoji: '🔊' },
  { id: 'sertanejo', name: 'Sertanejo', emoji: '🤠' },
  { id: 'jazz', name: 'Jazz', emoji: '🎷' },
  { id: 'soul', name: 'Soul', emoji: '🎙️' },
  { id: 'metal', name: 'Metal', emoji: '🤘' },
  { id: 'punk', name: 'Punk', emoji: '⚡' },
  { id: 'alternative', name: 'Alternativo', emoji: '🎧' },
  { id: 'k-pop', name: 'K-Pop', emoji: '💫' },
  { id: 'reggae', name: 'Reggae', emoji: '🟢' },
  { id: 'latin', name: 'Latina', emoji: '💃' },
  { id: 'folk', name: 'Folk', emoji: '🪕' },
  { id: 'blues', name: 'Blues', emoji: '🎺' },
  { id: 'classical', name: 'Clássica', emoji: '🎻' },
  { id: 'country', name: 'Country', emoji: '🪕' },
];

const DEFAULT_RECORD_LABELS: RecordLabelRecord[] = [
  { id: 'universal', name: 'Universal Music Group', desc: 'Major Global • Pop, Hip-Hop & Rock' },
  { id: 'sony', name: 'Sony Music', desc: 'Major Global • Catálogo Mundial' },
  { id: 'warner', name: 'Warner Music Group', desc: 'Major Global • Rock, Pop & R&B' },
  { id: 'atlantic', name: 'Atlantic Records', desc: 'Warner • Pop, R&B & Hip-Hop' },
  { id: 'republic', name: 'Republic Records', desc: 'Universal • Pop & Mainstream' },
  { id: 'interscope', name: 'Interscope Records', desc: 'Universal • Hip-Hop, Pop & Alt' },
  { id: 'columbia', name: 'Columbia Records', desc: 'Sony • Pop, Rock & Soul' },
  { id: 'rca', name: 'RCA Records', desc: 'Sony • Pop, R&B & Indie' },
  { id: 'capitol', name: 'Capitol Records', desc: 'Universal • Clássicos & Pop' },
  { id: 'def-jam', name: 'Def Jam Recordings', desc: 'Universal • Hip-Hop & R&B' },
  { id: 'island', name: 'Island Records', desc: 'Universal • Reggae, Rock & Pop' },
  { id: 'virgin', name: 'Virgin Music', desc: 'Universal • Pop & Eletrônica' },
  { id: 'parlophone', name: 'Parlophone', desc: 'Warner • Britpop & Rock' },
  { id: 'polydor', name: 'Polydor Records', desc: 'Universal • UK Pop & Rock' },
  { id: 'epic', name: 'Epic Records', desc: 'Sony • Pop, Hip-Hop & R&B' },
  { id: 'elektra', name: 'Elektra Records', desc: 'Warner • Rock & Alternativo' },
  { id: 'roc-nation', name: 'Roc Nation', desc: 'Hip-Hop, R&B & Pop' },
  { id: 'tde', name: 'Top Dawg Entertainment', desc: 'Hip-Hop & R&B Independente' },
  { id: 'ovo', name: 'OVO Sound', desc: 'Hip-Hop & R&B Contemporâneo' },
  { id: 'xo', name: 'XO Records', desc: 'R&B Alternativo & Pop' },
  { id: 'cactus-jack', name: 'Cactus Jack', desc: 'Trap & Hip-Hop' },
  { id: 'aftermath', name: 'Aftermath Entertainment', desc: 'Hip-Hop Clássico & West Coast' },
  { id: 'motown', name: 'Motown Records', desc: 'Soul, R&B & Funk Histórico' },
  { id: 'blue-note', name: 'Blue Note Records', desc: 'Jazz Clássico & Contemporâneo' },
  { id: 'sub-pop', name: 'Sub Pop', desc: 'Indie Rock & Grunge' },
  { id: 'xl', name: 'XL Recordings', desc: 'Indie, Eletrônica & Pop UK' },
  { id: '4ad', name: '4AD', desc: 'Dream Pop & Pós-Punk' },
  { id: 'warp', name: 'Warp Records', desc: 'Eletrônica & Experimental' },
  { id: 'ninja-tune', name: 'Ninja Tune', desc: 'Eletrônica, Beats & Jazz' },
  { id: 'domino', name: 'Domino Recording Co.', desc: 'Indie Rock & Alternativo' },
  { id: 'matador', name: 'Matador Records', desc: 'Indie & Rock Alternativo' },
  { id: 'som-livre', name: 'Som Livre', desc: 'Brasil • MPB, Pop & Sertanejo' },
  { id: 'deck', name: 'Deckdisc', desc: 'Brasil • Rock & MPB' },
  { id: 'kondzilla', name: 'KondZilla', desc: 'Brasil • Funk & Urbano' },
  { id: 'biscoito-fino', name: 'Biscoito Fino', desc: 'Brasil • MPB & Samba' },
  { id: 'hybe', name: 'HYBE Labels', desc: 'K-Pop & Pop Global' },
];

export async function getGenresFromSupabase(): Promise<GenreRecord[]> {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name, emoji')
      .order('display_order', { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_GENRES;
    return data.map((g: any) => ({
      id: String(g.id),
      name: g.name,
      emoji: g.emoji || '🎵',
    }));
  } catch {
    return DEFAULT_GENRES;
  }
}

export async function getRecordLabelsFromSupabase(): Promise<RecordLabelRecord[]> {
  try {
    const { data, error } = await supabase
      .from('record_labels')
      .select('id, name, description')
      .order('name', { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_RECORD_LABELS;
    const seen = new Set<string>();
    const merged: RecordLabelRecord[] = [];
    for (const l of data as any[]) {
      const key = String(l.name || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: String(l.id),
        name: l.name,
        desc: l.description || '',
      });
    }
    for (const fallback of DEFAULT_RECORD_LABELS) {
      const key = fallback.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(fallback);
      }
    }
    return merged;
  } catch {
    return DEFAULT_RECORD_LABELS;
  }
}

interface CuratedLabelMeta {
  id: string;
  name: string;
  desc: string;
  founded: string;
  headquarters: string;
  parentGroup: string;
  genres: string[];
  bio: string;
  roster: { name: string; genre: string; country: string }[];
  matchKeywords: string[];
}

const CURATED_LABEL_META: CuratedLabelMeta[] = [
  {
    id: 'universal',
    name: 'Universal Music Group',
    desc: 'Major Global • Pop, Hip-Hop & Rock',
    founded: '1934',
    headquarters: 'Santa Monica, Califórnia, EUA',
    parentGroup: 'Universal Music Group N.V.',
    genres: ['Pop', 'Hip-Hop', 'Rock', 'R&B', 'Latina'],
    bio: 'A Universal Music Group (UMG) é a maior companhia fonográfica do mundo, reunindo selos históricos como Republic, Interscope, Capitol, Def Jam, Island e Polydor, além de distribuir alguns dos artistas mais influentes da música contemporânea.',
    roster: [
      { name: 'Taylor Swift', genre: 'Pop • Country', country: 'Estados Unidos' },
      { name: 'The Weeknd', genre: 'R&B • Pop', country: 'Canadá' },
      { name: 'Kendrick Lamar', genre: 'Hip-Hop • Rap', country: 'Estados Unidos' },
      { name: 'Billie Eilish', genre: 'Pop • Alternativo', country: 'Estados Unidos' },
      { name: 'Lady Gaga', genre: 'Pop • Dance', country: 'Estados Unidos' },
      { name: 'Drake', genre: 'Hip-Hop • R&B', country: 'Canadá' },
      { name: 'Ariana Grande', genre: 'Pop • R&B', country: 'Estados Unidos' },
      { name: 'Post Malone', genre: 'Pop • Hip-Hop', country: 'Estados Unidos' },
      { name: 'Lana Del Rey', genre: 'Indie Pop • Alternativo', country: 'Estados Unidos' },
      { name: 'Sabrina Carpenter', genre: 'Pop', country: 'Estados Unidos' },
    ],
    matchKeywords: ['universal', 'umg'],
  },
  {
    id: 'sony',
    name: 'Sony Music',
    desc: 'Major Global • Catálogo Mundial',
    founded: '1929',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Sony Group Corporation',
    genres: ['Pop', 'Rock', 'R&B', 'Hip-Hop', 'MPB'],
    bio: 'A Sony Music Entertainment é uma das três grandes majors globais da indústria musical, controlando gravadoras lendárias como Columbia Records, RCA Records e Epic Records, com forte atuação mundial e no Brasil.',
    roster: [
      { name: 'Beyoncé', genre: 'R&B • Pop', country: 'Estados Unidos' },
      { name: 'Adele', genre: 'Pop • Soul', country: 'Reino Unido' },
      { name: 'Harry Styles', genre: 'Pop • Rock', country: 'Reino Unido' },
      { name: 'SZA', genre: 'R&B • Neo-Soul', country: 'Estados Unidos' },
      { name: 'Travis Scott', genre: 'Hip-Hop • Trap', country: 'Estados Unidos' },
      { name: 'Doja Cat', genre: 'Pop • Rap', country: 'Estados Unidos' },
      { name: 'Tyler, The Creator', genre: 'Hip-Hop • Alternativo', country: 'Estados Unidos' },
      { name: 'Foo Fighters', genre: 'Rock • Alternativo', country: 'Estados Unidos' },
      { name: 'Rosalía', genre: 'Pop • Flamenco', country: 'Espanha' },
      { name: 'Miley Cyrus', genre: 'Pop • Rock', country: 'Estados Unidos' },
    ],
    matchKeywords: ['sony', 'sme'],
  },
  {
    id: 'warner',
    name: 'Warner Music Group',
    desc: 'Major Global • Rock, Pop & R&B',
    founded: '1958',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Warner Music Group Corp.',
    genres: ['Pop', 'Rock', 'Hip-Hop', 'Eletrônica', 'Alternativo'],
    bio: 'O Warner Music Group (WMG) é um conglomerado fonográfico global que abriga selos icônicos como Atlantic Records, Warner Records, Parlophone e Elektra Records.',
    roster: [
      { name: 'Dua Lipa', genre: 'Pop • Dance', country: 'Reino Unido' },
      { name: 'Ed Sheeran', genre: 'Pop • Folk', country: 'Reino Unido' },
      { name: 'Coldplay', genre: 'Rock • Pop', country: 'Reino Unido' },
      { name: 'Bruno Mars', genre: 'Pop • R&B • Funk', country: 'Estados Unidos' },
      { name: 'Charli xcx', genre: 'Hyperpop • Pop', country: 'Reino Unido' },
      { name: 'Linkin Park', genre: 'Rock • Alternativo', country: 'Estados Unidos' },
      { name: 'Green Day', genre: 'Punk Rock', country: 'Estados Unidos' },
      { name: 'Red Hot Chili Peppers', genre: 'Rock • Funk Rock', country: 'Estados Unidos' },
      { name: 'Gorillaz', genre: 'Alternativo • Eletrônica', country: 'Reino Unido' },
      { name: 'Paramore', genre: 'Rock • Pop Punk', country: 'Estados Unidos' },
    ],
    matchKeywords: ['warner', 'wmg', 'wea'],
  },
  {
    id: 'atlantic',
    name: 'Atlantic Records',
    desc: 'Warner • Pop, R&B & Hip-Hop',
    founded: '1947',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Warner Music Group',
    genres: ['R&B', 'Hip-Hop', 'Pop', 'Soul', 'Rock'],
    bio: 'Fundada em 1947 por Ahmet Ertegun e Herb Abramson, a Atlantic Records construiu a história do R&B, Soul e Rock e hoje lidera paradas globais com estrelas do Pop e Hip-Hop.',
    roster: [
      { name: 'Bruno Mars', genre: 'Pop • R&B', country: 'Estados Unidos' },
      { name: 'Ed Sheeran', genre: 'Pop', country: 'Reino Unido' },
      { name: 'Charli xcx', genre: 'Pop • Eletrônica', country: 'Reino Unido' },
      { name: 'Cardi B', genre: 'Hip-Hop • Rap', country: 'Estados Unidos' },
      { name: 'Lizzo', genre: 'Pop • R&B', country: 'Estados Unidos' },
      { name: 'Coldplay', genre: 'Rock • Pop', country: 'Reino Unido' },
      { name: 'Burna Boy', genre: 'Afrobeats', country: 'Nigéria' },
      { name: 'Paramore', genre: 'Rock • Alternativo', country: 'Estados Unidos' },
    ],
    matchKeywords: ['atlantic'],
  },
  {
    id: 'republic',
    name: 'Republic Records',
    desc: 'Universal • Pop & Mainstream',
    founded: '1995',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Universal Music Group',
    genres: ['Pop', 'Hip-Hop', 'R&B', 'Rock'],
    bio: 'Fundada pelos irmãos Monte e Avery Lipman, a Republic Records é uma das gravadoras de maior desempenho comercial do século XXI, lar de grandes nomes do Pop e Hip-Hop mundial.',
    roster: [
      { name: 'Taylor Swift', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'The Weeknd', genre: 'R&B • Pop', country: 'Canadá' },
      { name: 'Ariana Grande', genre: 'Pop • R&B', country: 'Estados Unidos' },
      { name: 'Drake', genre: 'Hip-Hop', country: 'Canadá' },
      { name: 'Post Malone', genre: 'Pop • Hip-Hop', country: 'Estados Unidos' },
      { name: 'Lorde', genre: 'Indie Pop', country: 'Nova Zelândia' },
      { name: 'Nicki Minaj', genre: 'Hip-Hop • Rap', country: 'Estados Unidos' },
      { name: 'Florence + The Machine', genre: 'Indie Rock', country: 'Reino Unido' },
    ],
    matchKeywords: ['republic'],
  },
  {
    id: 'interscope',
    name: 'Interscope Records',
    desc: 'Universal • Hip-Hop, Pop & Alt',
    founded: '1990',
    headquarters: 'Santa Monica, Califórnia, EUA',
    parentGroup: 'Universal Music Group',
    genres: ['Hip-Hop', 'Pop', 'Alternativo', 'Rock'],
    bio: 'Fundada por Jimmy Iovine e Ted Field em 1990, a Interscope Records revolucionou o Hip-Hop, o Pop alternativo e o Rock moderno, abrigando selos como Aftermath e Darkroom.',
    roster: [
      { name: 'Billie Eilish', genre: 'Pop • Alternativo', country: 'Estados Unidos' },
      { name: 'Kendrick Lamar', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Lady Gaga', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'Lana Del Rey', genre: 'Alternativo • Indie Pop', country: 'Estados Unidos' },
      { name: 'Eminem', genre: 'Hip-Hop • Rap', country: 'Estados Unidos' },
      { name: 'Olivia Rodrigo', genre: 'Pop • Rock', country: 'Estados Unidos' },
      { name: 'BLACKPINK', genre: 'K-Pop • Pop', country: 'Coreia do Sul' },
      { name: 'Imagine Dragons', genre: 'Pop Rock', country: 'Estados Unidos' },
    ],
    matchKeywords: ['interscope', 'geffen', 'a&m'],
  },
  {
    id: 'columbia',
    name: 'Columbia Records',
    desc: 'Sony • Pop, Rock & Soul',
    founded: '1887',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Sony Music Entertainment',
    genres: ['Pop', 'Rock', 'R&B', 'Hip-Hop', 'Soul'],
    bio: 'A Columbia Records é a marca fonográfica mais antiga ainda em atividade no mundo, fundada em 1887, responsável por lançamentos históricos do Jazz, Rock, Soul e Pop moderno.',
    roster: [
      { name: 'Beyoncé', genre: 'R&B • Pop', country: 'Estados Unidos' },
      { name: 'Adele', genre: 'Pop • Soul', country: 'Reino Unido' },
      { name: 'Harry Styles', genre: 'Pop • Rock', country: 'Reino Unido' },
      { name: 'Tyler, The Creator', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Rosalía', genre: 'Pop • Alternativo', country: 'Espanha' },
      { name: 'Miley Cyrus', genre: 'Pop • Rock', country: 'Estados Unidos' },
      { name: 'AC/DC', genre: 'Hard Rock', country: 'Austrália' },
      { name: 'Bob Dylan', genre: 'Folk • Rock', country: 'Estados Unidos' },
    ],
    matchKeywords: ['columbia'],
  },
  {
    id: 'rca',
    name: 'RCA Records',
    desc: 'Sony • Pop, R&B & Indie',
    founded: '1901',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Sony Music Entertainment',
    genres: ['R&B', 'Pop', 'Hip-Hop', 'Rock'],
    bio: 'Com mais de um século de história, a RCA Records é um dos principais selos da Sony Music, reconhecida por seu elenco de vanguarda no R&B contemporâneo, Pop e Indie Rock.',
    roster: [
      { name: 'SZA', genre: 'R&B • Soul', country: 'Estados Unidos' },
      { name: 'Doja Cat', genre: 'Pop • Hip-Hop', country: 'Estados Unidos' },
      { name: 'Foo Fighters', genre: 'Rock', country: 'Estados Unidos' },
      { name: 'The Strokes', genre: 'Indie Rock', country: 'Estados Unidos' },
      { name: 'A$AP Rocky', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Childish Gambino', genre: 'R&B • Hip-Hop', country: 'Estados Unidos' },
      { name: 'Alicia Keys', genre: 'R&B • Soul', country: 'Estados Unidos' },
      { name: 'Steve Lacy', genre: 'R&B • Indie', country: 'Estados Unidos' },
    ],
    matchKeywords: ['rca'],
  },
  {
    id: 'capitol',
    name: 'Capitol Records',
    desc: 'Universal • Clássicos & Pop',
    founded: '1942',
    headquarters: 'Los Angeles, Califórnia, EUA',
    parentGroup: 'Universal Music Group',
    genres: ['Pop', 'Rock', 'Hip-Hop'],
    bio: 'Sediada na icônica CapitolRecords Tower em Hollywood desde 1956, a Capitol Records foi a primeira grande gravadora da Costa Oeste dos EUA.',
    roster: [
      { name: 'Katy Perry', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'Sam Smith', genre: 'Pop • Soul', country: 'Reino Unido' },
      { name: 'Paul McCartney', genre: 'Rock • Pop', country: 'Reino Unido' },
      { name: 'The Beatles', genre: 'Rock', country: 'Reino Unido' },
      { name: 'Troye Sivan', genre: 'Pop', country: 'Austrália' },
      { name: 'Doechii', genre: 'Hip-Hop • R&B', country: 'Estados Unidos' },
      { name: 'Ice Spice', genre: 'Hip-Hop', country: 'Estados Unidos' },
    ],
    matchKeywords: ['capitol'],
  },
  {
    id: 'def-jam',
    name: 'Def Jam Recordings',
    desc: 'Universal • Hip-Hop & R&B',
    founded: '1984',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Universal Music Group',
    genres: ['Hip-Hop', 'Rap', 'R&B'],
    bio: 'Fundada por Rick Rubin e Russell Simmons em 1984, a Def Jam Recordings é o selo mais emblemático da história do Hip-Hop e do R&B urbano.',
    roster: [
      { name: 'Rihanna', genre: 'Pop • R&B', country: 'Barbados' },
      { name: 'Justin Bieber', genre: 'Pop • R&B', country: 'Canadá' },
      { name: 'Kanye West', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'JAY-Z', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Frank Ocean', genre: 'R&B • Alternativo', country: 'Estados Unidos' },
      { name: 'Pusha T', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Jhené Aiko', genre: 'R&B', country: 'Estados Unidos' },
    ],
    matchKeywords: ['def jam'],
  },
  {
    id: 'island',
    name: 'Island Records',
    desc: 'Universal • Reggae, Rock & Pop',
    founded: '1959',
    headquarters: 'Londres, Reino Unido / Nova York, EUA',
    parentGroup: 'Universal Music Group',
    genres: ['Pop', 'Rock', 'Reggae', 'Alternativo'],
    bio: 'Fundada na Jamaica por Chris Blackwell em 1959, a Island Records apresentou o Reggae de Bob Marley ao mundo e tornou-se uma potência do Pop e Rock global.',
    roster: [
      { name: 'Sabrina Carpenter', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'Chappell Roan', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'Shawn Mendes', genre: 'Pop', country: 'Canadá' },
      { name: 'Bob Marley & The Wailers', genre: 'Reggae', country: 'Jamaica' },
      { name: 'U2', genre: 'Rock', country: 'Irlanda' },
      { name: 'Demi Lovato', genre: 'Pop • Rock', country: 'Estados Unidos' },
      { name: 'Hozier', genre: 'Indie Rock • Soul', country: 'Irlanda' },
    ],
    matchKeywords: ['island'],
  },
  {
    id: 'epic',
    name: 'Epic Records',
    desc: 'Sony • Pop, Hip-Hop & R&B',
    founded: '1953',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Sony Music Entertainment',
    genres: ['Pop', 'Hip-Hop', 'R&B', 'Rock'],
    bio: 'Criada pela CBS em 1953, a Epic Records consolidou-se como casa de superestrelas globais, de Michael Jackson e Sade a Travis Scott e Future.',
    roster: [
      { name: 'Travis Scott', genre: 'Hip-Hop • Trap', country: 'Estados Unidos' },
      { name: 'Future', genre: 'Hip-Hop • Trap', country: 'Estados Unidos' },
      { name: '21 Savage', genre: 'Hip-Hop', country: 'Reino Unido' },
      { name: 'Michael Jackson', genre: 'Pop • R&B', country: 'Estados Unidos' },
      { name: 'Sade', genre: 'Soul • R&B', country: 'Reino Unido' },
      { name: 'Camila Cabello', genre: 'Pop', country: 'Estados Unidos' },
      { name: 'Tyla', genre: 'Afrobeats • Pop', country: 'África do Sul' },
    ],
    matchKeywords: ['epic'],
  },
  {
    id: 'roc-nation',
    name: 'Roc Nation',
    desc: 'Hip-Hop, R&B & Pop',
    founded: '2008',
    headquarters: 'Nova York, EUA',
    parentGroup: 'Roc Nation LLC / Universal',
    genres: ['Hip-Hop', 'R&B', 'Pop'],
    bio: 'Fundada por JAY-Z em 2008, a Roc Nation atua como gravadora e companhia global de entretenimento, representando grandes nomes do Hip-Hop e R&B.',
    roster: [
      { name: 'JAY-Z', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Rihanna', genre: 'Pop • R&B', country: 'Barbados' },
      { name: 'J. Cole', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Megan Thee Stallion', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Alicia Keys', genre: 'R&B • Soul', country: 'Estados Unidos' },
    ],
    matchKeywords: ['roc nation'],
  },
  {
    id: 'tde',
    name: 'Top Dawg Entertainment',
    desc: 'Hip-Hop & R&B Independente',
    founded: '2004',
    headquarters: 'Carson, Califórnia, EUA',
    parentGroup: 'Independente',
    genres: ['Hip-Hop', 'R&B', 'Neo-Soul'],
    bio: 'Fundada por Anthony "Top Dawg" Tiffith na Califórnia, a TDE moldou o som do Hip-Hop e R&B contemporâneo com foco lírico e artístico.',
    roster: [
      { name: 'SZA', genre: 'R&B', country: 'Estados Unidos' },
      { name: 'Kendrick Lamar', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'ScHoolboy Q', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Doechii', genre: 'Hip-Hop • R&B', country: 'Estados Unidos' },
      { name: 'Jay Rock', genre: 'Hip-Hop', country: 'Estados Unidos' },
      { name: 'Ab-Soul', genre: 'Hip-Hop', country: 'Estados Unidos' },
    ],
    matchKeywords: ['top dawg', 'tde'],
  },
  {
    id: 'ovo',
    name: 'OVO Sound',
    desc: 'Hip-Hop & R&B Contemporâneo',
    founded: '2012',
    headquarters: 'Toronto, Canadá',
    parentGroup: 'OVO / Universal / Warner',
    genres: ['Hip-Hop', 'R&B'],
    bio: 'Fundada em Toronto por Drake, Oliver El-Khatib e Noah "40" Shebib, a OVO Sound é referência no R&B atmosférico e Hip-Hop canadense.',
    roster: [
      { name: 'Drake', genre: 'Hip-Hop • R&B', country: 'Canadá' },
      { name: 'PARTYNEXTDOOR', genre: 'R&B', country: 'Canadá' },
      { name: 'Majid Jordan', genre: 'R&B • Synthpop', country: 'Canadá' },
      { name: 'dvsn', genre: 'R&B', country: 'Canadá' },
    ],
    matchKeywords: ['ovo'],
  },
  {
    id: 'xo',
    name: 'XO Records',
    desc: 'R&B Alternativo & Pop',
    founded: '2011',
    headquarters: 'Toronto, Canadá',
    parentGroup: 'Republic Records / Universal',
    genres: ['R&B', 'Pop', 'Hip-Hop'],
    bio: 'Selo fundado por The Weeknd, Amir "Cash" Esmailian e Wassim "Sal" Slaiby em Toronto, responsável pela estética dark R&B e Synth-Pop global.',
    roster: [
      { name: 'The Weeknd', genre: 'R&B • Pop', country: 'Canadá' },
      { name: 'Nav', genre: 'Hip-Hop', country: 'Canadá' },
      { name: 'Belly', genre: 'Hip-Hop', country: 'Canadá' },
      { name: 'Black Atlass', genre: 'R&B', country: 'Canadá' },
    ],
    matchKeywords: ['xo records', 'xo'],
  },
  {
    id: 'xl',
    name: 'XL Recordings',
    desc: 'Indie, Eletrônica & Pop UK',
    founded: '1989',
    headquarters: 'Londres, Reino Unido',
    parentGroup: 'Beggars Group',
    genres: ['Indie', 'Alternativo', 'Eletrônica', 'Pop'],
    bio: 'Uma das gravadoras independentes mais prestigiadas do mundo, sediada em Londres, responsável por álbuns históricos de Adele, Radiohead, The Prodigy e FKA twigs.',
    roster: [
      { name: 'Radiohead', genre: 'Rock Alternativo', country: 'Reino Unido' },
      { name: 'Adele', genre: 'Pop • Soul', country: 'Reino Unido' },
      { name: 'Arca', genre: 'Eletrônica • Experimental', country: 'Venezuela' },
      { name: 'FKA twigs', genre: 'Alternativo • Eletrônica', country: 'Reino Unido' },
      { name: 'Fontaines D.C.', genre: 'Post-Punk • Indie', country: 'Irlanda' },
      { name: 'Jungle', genre: 'Neo-Soul • Eletrônica', country: 'Reino Unido' },
      { name: 'The xx', genre: 'Indie Pop', country: 'Reino Unido' },
    ],
    matchKeywords: ['xl recordings', 'xl'],
  },
  {
    id: 'som-livre',
    name: 'Som Livre',
    desc: 'Brasil • MPB, Pop & Sertanejo',
    founded: '1969',
    headquarters: 'Rio de Janeiro, Brasil',
    parentGroup: 'Sony Music Entertainment',
    genres: ['MPB', 'Sertanejo', 'Samba', 'Pop', 'Funk'],
    bio: 'Fundada em 1969 no Rio de Janeiro e hoje integrante da Sony Music, a Som Livre é uma das gravadoras mais importantes da história da música brasileira.',
    roster: [
      { name: 'Marília Mendonça', genre: 'Sertanejo', country: 'Brasil' },
      { name: 'Jorge & Mateus', genre: 'Sertanejo', country: 'Brasil' },
      { name: 'Luan Santana', genre: 'Sertanejo • Pop', country: 'Brasil' },
      { name: 'Djavan', genre: 'MPB', country: 'Brasil' },
      { name: 'Caetano Veloso', genre: 'MPB', country: 'Brasil' },
      { name: 'Ludmilla', genre: 'Pop • Pagode • Funk', country: 'Brasil' },
    ],
    matchKeywords: ['som livre'],
  },
  {
    id: 'deck',
    name: 'Deckdisc',
    desc: 'Brasil • Rock & MPB',
    founded: '1998',
    headquarters: 'Rio de Janeiro, Brasil',
    parentGroup: 'Independente (Brasil)',
    genres: ['Rock', 'MPB', 'Alternativo'],
    bio: 'Fundada por João Augusto no Rio de Janeiro em 1998, a Deck (Deckdisc) é a maior gravadora independente de Rock e MPB do Brasil.',
    roster: [
      { name: 'Pitty', genre: 'Rock', country: 'Brasil' },
      { name: 'NX Zero', genre: 'Rock • Emo', country: 'Brasil' },
      { name: 'Dead Fish', genre: 'Hardcore • Punk', country: 'Brasil' },
      { name: 'Alceu Valença', genre: 'MPB', country: 'Brasil' },
      { name: 'Falamansa', genre: 'Forró • MPB', country: 'Brasil' },
    ],
    matchKeywords: ['deckdisc', 'deck'],
  },
  {
    id: 'hybe',
    name: 'HYBE Labels',
    desc: 'K-Pop & Pop Global',
    founded: '2005',
    headquarters: 'Seul, Coreia do Sul',
    parentGroup: 'HYBE Corporation',
    genres: ['K-Pop', 'Pop', 'R&B', 'Hip-Hop'],
    bio: 'Originalmente fundada como Big Hit Entertainment por Bang Si-hyuk em Seul, a HYBE reúne selos como BIGHIT MUSIC, ADOR, PLEDIS e SOURCE MUSIC.',
    roster: [
      { name: 'BTS', genre: 'K-Pop • Pop', country: 'Coreia do Sul' },
      { name: 'NewJeans', genre: 'K-Pop • R&B', country: 'Coreia do Sul' },
      { name: 'SEVENTEEN', genre: 'K-Pop', country: 'Coreia do Sul' },
      { name: 'LE SSERAFIM', genre: 'K-Pop', country: 'Coreia do Sul' },
      { name: 'TOMORROW X TOGETHER', genre: 'K-Pop', country: 'Coreia do Sul' },
      { name: 'Jung Kook', genre: 'Pop • K-Pop', country: 'Coreia do Sul' },
    ],
    matchKeywords: ['hybe', 'bighit', 'big hit', 'ador'],
  },
];

export async function updateArtistLabelInSupabase(
  artistId: string,
  labelName: string
): Promise<void> {
  const clean = labelName.trim();
  if (!artistId || !clean || clean === 'Não informada' || clean === 'Independente' || clean === 'Oficial') {
    return;
  }
  try {
    await supabase.from('artists').update({ label_name: clean }).eq('id', artistId);
  } catch {
    // non-blocking
  }
}

export async function getRecordLabelDetails(
  labelIdOrName: string
): Promise<RecordLabelFullDetails> {
  const raw = decodeURIComponent(labelIdOrName || '').trim();
  const norm = raw.toLowerCase();

  const curated =
    CURATED_LABEL_META.find(
      (c) =>
        c.id.toLowerCase() === norm ||
        c.name.toLowerCase() === norm ||
        c.matchKeywords.some((kw) => norm.includes(kw))
    ) || null;

  const fallbackRecord =
    DEFAULT_RECORD_LABELS.find(
      (d) =>
        d.id.toLowerCase() === norm ||
        d.name.toLowerCase() === norm ||
        norm.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(norm)
    ) || null;

  const canonicalName = curated?.name || fallbackRecord?.name || raw || 'Gravadora';
  const live = await fetchLiveRecordLabelDetails(canonicalName);

  return {
    id: curated?.id || fallbackRecord?.id || live.id,
    name: live.name || canonicalName,
    desc: curated?.desc || fallbackRecord?.desc || live.desc,
    founded:
      live.founded && live.founded !== 'Selo Ativo'
        ? live.founded
        : curated?.founded || 'Selo Ativo',
    headquarters:
      live.headquarters && live.headquarters !== 'Internacional'
        ? live.headquarters
        : curated?.headquarters || 'Internacional',
    parentGroup: curated?.parentGroup || live.parentGroup || canonicalName,
    genres:
      curated?.genres && curated.genres.length > 0
        ? curated.genres
        : ['Pop', 'Rock', 'Hip-Hop', 'R&B'],
    bio: live.bio || curated?.bio || '',
    artists: live.artists,
    albums: live.albums,
  };
}

// ============================================================================
// ÁLBUNS, ARTISTAS E FAIXAS (CATÁLOGO REAL)
// ============================================================================

export async function getPopularAlbumsFromSupabase(limit = 30): Promise<CatalogAlbum[]> {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('listeners_count', { ascending: false })
      .order('total_reviews', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbAlbumToCatalog);
  } catch {
    return [];
  }
}

export async function getTopRatedAlbumsFromSupabase(limit = 30): Promise<CatalogAlbum[]> {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .gt('total_reviews', 0)
      .order('community_rating', { ascending: false })
      .order('total_reviews', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbAlbumToCatalog);
  } catch {
    return [];
  }
}

export async function getRecentAlbumsFromSupabase(limit = 20): Promise<CatalogAlbum[]> {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbAlbumToCatalog);
  } catch {
    return [];
  }
}

export async function getFeaturedArtistsFromSupabase(limit = 20): Promise<CatalogArtist[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('nb_fans', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbArtistToCatalog);
  } catch {
    return [];
  }
}

export async function getTopTracksFromSupabase(limit = 20): Promise<CatalogTrack[]> {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*, album:albums(title, cover_medium, cover_big, artist_name, artist_id)')
      .order('is_top_track', { ascending: false })
      .order('track_number', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapDbTrackToCatalog);
  } catch {
    return [];
  }
}

export async function searchCatalogInSupabase(query: string): Promise<{
  artists: CatalogArtist[];
  albums: CatalogAlbum[];
  tracks: CatalogTrack[];
}> {
  const q = query.trim();
  if (!q) {
    return { artists: [], albums: [], tracks: [] };
  }

  const pattern = `%${q}%`;
  try {
    const [artistsRes, albumsRes, tracksRes] = await Promise.all([
      supabase
        .from('artists')
        .select('*')
        .or(`name.ilike.${pattern},genre.ilike.${pattern},label_name.ilike.${pattern}`)
        .order('nb_fans', { ascending: false })
        .limit(15),
      supabase
        .from('albums')
        .select('*')
        .or(
          `title.ilike.${pattern},artist_name.ilike.${pattern},genre_name.ilike.${pattern},label.ilike.${pattern}`
        )
        .order('listeners_count', { ascending: false })
        .limit(20),
      supabase
        .from('tracks')
        .select('*, album:albums(title, cover_medium, cover_big, artist_name, artist_id)')
        .or(`title.ilike.${pattern},artist_name.ilike.${pattern}`)
        .limit(15),
    ]);

    return {
      artists: !artistsRes.error && artistsRes.data ? artistsRes.data.map(mapDbArtistToCatalog) : [],
      albums: !albumsRes.error && albumsRes.data ? albumsRes.data.map(mapDbAlbumToCatalog) : [],
      tracks: !tracksRes.error && tracksRes.data ? tracksRes.data.map(mapDbTrackToCatalog) : [],
    };
  } catch {
    return { artists: [], albums: [], tracks: [] };
  }
}

export async function getAlbumFromSupabase(
  albumId: string,
  currentUserId?: string
): Promise<CatalogAlbum | null> {
  try {
    const { data: albumRow, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', albumId)
      .maybeSingle();

    if (error || !albumRow) return null;

    const album = mapDbAlbumToCatalog(albumRow);

    const [tracksRes, reviewsRes, listenedRes] = await Promise.all([
      supabase
        .from('tracks')
        .select('*')
        .eq('album_id', albumId)
        .order('track_number', { ascending: true }),
      supabase
        .from('album_reviews')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false }),
      currentUserId
        ? supabase
            .from('user_listened_albums')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('album_id', albumId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (!tracksRes.error && tracksRes.data) {
      album.tracks = {
        data: tracksRes.data.map((t: any) => ({
          id: String(t.id),
          title: t.title,
          duration: Number(t.duration || 0),
        })),
      };
    }

    if (!reviewsRes.error && reviewsRes.data) {
      let likedReviewIds = new Set<string>();
      if (currentUserId && reviewsRes.data.length > 0) {
        const { data: likesData } = await supabase
          .from('album_review_likes')
          .select('review_id')
          .eq('user_id', currentUserId)
          .in(
            'review_id',
            reviewsRes.data.map((r: any) => r.id)
          );
        if (likesData) {
          likedReviewIds = new Set(likesData.map((l: any) => String(l.review_id)));
        }
      }

      album.reviews = reviewsRes.data.map((r: any): AlbumUserReview => ({
        id: String(r.id),
        userId: r.user_id ? String(r.user_id) : undefined,
        user: r.user_display_name || r.username || 'Usuário',
        username: r.username || 'user',
        avatar: r.user_avatar || '',
        rating: Number(r.rating || 0),
        comment: r.comment || '',
        date: formatRelativeTime(r.created_at, r.display_date, Boolean(r.is_edited)),
        likes: Number(r.likes_count || 0),
        likedByMe: likedReviewIds.has(String(r.id)),
      }));

      // Garante que a nota e o total da comunidade reflitam todas as avaliações reais (incluindo a do usuário)
      if (album.reviews.length > 0) {
        const sum = album.reviews.reduce((acc, rev) => acc + Number(rev.rating || 0), 0);
        album.totalReviews = album.reviews.length;
        album.communityRating = Number((sum / album.reviews.length).toFixed(1));
      } else {
        album.totalReviews = 0;
        album.communityRating = 0;
      }
    }

    if (!listenedRes.error && listenedRes.data) {
      album.listenedByMe = true;
    }

    return album;
  } catch {
    return null;
  }
}

export async function getAlbumAwardsFromSupabase(
  albumId: string,
  albumTitle?: string,
  artistName?: string,
  releaseDate?: string
): Promise<AlbumAward[]> {
  const dbResults: AlbumAward[] = [];
  try {
    let targetAlbumIds = [albumId];

    const { data, error } = await supabase
      .from('album_awards')
      .select('*')
      .eq('album_id', albumId)
      .order('year', { ascending: false });

    if (!error && data && data.length > 0) {
      for (const row of data as any[]) {
        dbResults.push({
          id: String(row.id),
          ceremony: row.ceremony || 'grammy',
          ceremonyName: row.ceremony_name || 'Premiação',
          awardName: row.award_name || row.ceremony_name || '',
          category: row.category || '',
          year: String(row.year || ''),
          isWinner: Boolean(row.is_winner),
          result: row.is_winner ? 'winner' : 'nominee',
          notes: row.notes || undefined,
          description: row.description || undefined,
          logoUrl: row.logo_url || undefined,
        });
      }
    } else if (albumTitle) {
      // Fallback por título + artista no Supabase
      let albumQuery = supabase.from('albums').select('id').ilike('title', albumTitle.trim());
      if (artistName) {
        albumQuery = albumQuery.ilike('artist_name', artistName.trim());
      }
      const { data: matchedAlbums } = await albumQuery.limit(5);
      if (matchedAlbums && matchedAlbums.length > 0) {
        targetAlbumIds = matchedAlbums.map((a: any) => String(a.id));
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('album_awards')
          .select('*')
          .in('album_id', targetAlbumIds)
          .order('year', { ascending: false });

        if (!fallbackErr && fallbackData) {
          for (const row of fallbackData as any[]) {
            dbResults.push({
              id: String(row.id),
              ceremony: row.ceremony || 'grammy',
              ceremonyName: row.ceremony_name || 'Premiação',
              awardName: row.award_name || row.ceremony_name || '',
              category: row.category || '',
              year: String(row.year || ''),
              isWinner: Boolean(row.is_winner),
              result: row.is_winner ? 'winner' : 'nominee',
              notes: row.notes || undefined,
              description: row.description || undefined,
              logoUrl: row.logo_url || undefined,
            });
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // Enriquece com premiações e indicações oficiais do álbum via API (Wikidata + Wikipedia)
  if (albumTitle && albumTitle.trim()) {
    try {
      const apiAwards = await fetchAlbumAwardsFromApi(
        albumTitle.trim(),
        artistName?.trim(),
        releaseDate
      );
      const seen = new Set(
        dbResults.map((a) => `${(a.awardName || a.ceremonyName).toLowerCase()}::${a.category.toLowerCase()}`)
      );
      for (const aw of apiAwards) {
        const key = `${(aw.awardName || aw.ceremonyName).toLowerCase()}::${aw.category.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          dbResults.push(aw);
        }
      }
    } catch {
      // ignore
    }
  }

  return dbResults;
}

export interface ArtistAwardRecord extends AlbumAward {
  albumTitle?: string;
}

export async function getArtistAwardsFromSupabase(
  artistId: string,
  artistName?: string
): Promise<ArtistAwardRecord[]> {
  const dbAwards: ArtistAwardRecord[] = [];
  try {
    const albumIdToTitle = new Map<string, string>();

    const { data: byId } = await supabase
      .from('albums')
      .select('id, title')
      .eq('artist_id', artistId);

    if (byId) {
      for (const a of byId as any[]) {
        albumIdToTitle.set(String(a.id), String(a.title || ''));
      }
    }

    if (artistName) {
      const { data: byName } = await supabase
        .from('albums')
        .select('id, title')
        .ilike('artist_name', artistName.trim());

      if (byName) {
        for (const a of byName as any[]) {
          if (!albumIdToTitle.has(String(a.id))) {
            albumIdToTitle.set(String(a.id), String(a.title || ''));
          }
        }
      }
    }

    const albumIds = Array.from(albumIdToTitle.keys());
    if (albumIds.length > 0) {
      const { data, error } = await supabase
        .from('album_awards')
        .select('*')
        .in('album_id', albumIds)
        .order('year', { ascending: false });

      if (!error && data) {
        for (const row of data as any[]) {
          dbAwards.push({
            id: String(row.id),
            ceremony: row.ceremony || 'grammy',
            ceremonyName: row.ceremony_name || 'Premiação',
            awardName: row.award_name || row.ceremony_name || '',
            category: row.category || '',
            year: String(row.year || ''),
            isWinner: Boolean(row.is_winner),
            result: row.is_winner ? 'winner' : 'nominee',
            notes: row.notes || undefined,
            description: row.description || undefined,
            logoUrl: row.logo_url || undefined,
            albumTitle: albumIdToTitle.get(String(row.album_id)) || undefined,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // Enriquece com todas as premiações e indicações oficiais do artista no Wikidata (P166 / P1411)
  if (artistName && artistName.trim()) {
    try {
      const wikiAwards = await fetchArtistAwardsFromWikidata(artistName.trim());
      const seen = new Set(
        dbAwards.map((a) => `${a.category.toLowerCase()}::${a.year}`)
      );
      for (const wa of wikiAwards) {
        const key = `${wa.category.toLowerCase()}::${wa.year}`;
        if (!seen.has(key)) {
          seen.add(key);
          dbAwards.push(wa);
        }
      }
    } catch {
      // ignore
    }
  }

  return dbAwards;
}

export async function getArtistFromSupabase(artistId: string): Promise<{
  artist: CatalogArtist;
  bio: string;
  labelName: string;
  activeYears: string;
  albums: CatalogAlbum[];
  epsAndSingles: CatalogAlbum[];
  related: CatalogArtist[];
} | null> {
  try {
    const { data: artistRow, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .maybeSingle();

    if (error || !artistRow) return null;

    const artist = mapDbArtistToCatalog(artistRow);

    const [albumsRes, relatedRes] = await Promise.all([
      supabase
        .from('albums')
        .select('*')
        .eq('artist_id', artistId)
        .order('release_date', { ascending: false }),
      supabase
        .from('artists')
        .select('*')
        .neq('id', artistId)
        .eq('genre', artist.genre)
        .order('nb_fans', { ascending: false })
        .limit(6),
    ]);

    const allDiscography =
      !albumsRes.error && albumsRes.data ? albumsRes.data.map(mapDbAlbumToCatalog) : [];
    const albums = allDiscography.filter((a) => a.record_type === 'album');
    const epsAndSingles = allDiscography.filter((a) => a.record_type !== 'album');
    const related =
      !relatedRes.error && relatedRes.data ? relatedRes.data.map(mapDbArtistToCatalog) : [];

    return {
      artist,
      bio: artistRow.bio || '',
      labelName: artistRow.label_name || '',
      activeYears: artistRow.active_years || '',
      albums,
      epsAndSingles,
      related,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// GARANTIR EXISTÊNCIA DE ARTISTA / ÁLBUM NO SUPABASE (PARA ITENS DO MUSICBRAINZ)
// ============================================================================

export async function ensureArtistExistsInSupabase(artist: {
  id: string;
  name: string;
  image_url?: string;
  banner_url?: string;
  genre?: string;
  country?: string;
  type?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!artist.id) return { ok: false, error: 'ID de artista inválido.' };
  try {
    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .eq('id', artist.id)
      .maybeSingle();

    if (existing) return { ok: true };

    const { error } = await supabase.from('artists').insert({
      id: artist.id,
      name: artist.name || 'Artista',
      image_url: artist.image_url || '',
      banner_url: artist.banner_url || artist.image_url || '',
      genre: artist.genre || 'Artista',
      country: artist.country || '',
      type: artist.type || 'Artista',
    });

    if (error && error.code !== '23505') {
      console.warn('[CatalogService] Erro ao garantir artista no Supabase:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[CatalogService] Exceção ao garantir artista:', err);
    return { ok: false, error: err?.message };
  }
}

export async function ensureAlbumExistsInSupabase(
  album: CatalogAlbum
): Promise<{ ok: boolean; error?: string }> {
  if (!album.id) return { ok: false, error: 'ID de álbum inválido.' };
  try {
    const { data: existing } = await supabase
      .from('albums')
      .select('id')
      .eq('id', album.id)
      .maybeSingle();

    if (existing) return { ok: true };

    const artistId = album.artist?.id?.trim() || `artist-${album.id}`;
    const artistRes = await ensureArtistExistsInSupabase({
      id: artistId,
      name: album.artist?.name || 'Artista',
      genre: album.genreName,
    });
    if (!artistRes.ok) {
      return artistRes;
    }

    const normalizedRecordType =
      album.record_type === 'ep' || album.record_type === 'single'
        ? album.record_type
        : 'album';

    const { error } = await supabase.from('albums').insert({
      id: album.id,
      release_id: album.releaseId || null,
      title: album.title || 'Álbum',
      artist_id: artistId,
      artist_name: album.artist?.name || 'Artista',
      cover_xl: album.cover_xl || album.cover_big || album.cover_medium || '',
      cover_big: album.cover_big || album.cover_medium || album.cover_xl || '',
      cover_medium: album.cover_medium || album.cover_big || album.cover_xl || '',
      cover_small: album.cover_small || album.cover_medium || '',
      release_date: album.release_date || '2025',
      record_type: normalizedRecordType,
      genre_name: album.genreName || 'Música',
      label: album.label || 'Independente',
    });
    if (error && error.code !== '23505') {
      console.warn('[CatalogService] Erro ao garantir álbum no Supabase:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[CatalogService] Exceção ao garantir álbum:', err);
    return { ok: false, error: err?.message };
  }
}

// ============================================================================
// FEED DA COMUNIDADE (`feed_posts`, `feed_post_comments`, `feed_post_likes`)
// ============================================================================

export async function getFeedPostsFromSupabase(currentUserId?: string): Promise<FeedPostItem[]> {
  try {
    const [postsRes, reviewsRes] = await Promise.all([
      supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('album_reviews')
        .select(`
          id,
          album_id,
          user_id,
          user_display_name,
          username,
          user_avatar,
          rating,
          comment,
          display_date,
          is_edited,
          likes_count,
          created_at,
          album:albums(title, artist_id, artist_name, genre_name, cover_xl, cover_big, cover_medium)
        `)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const posts: any[] = !postsRes.error && Array.isArray(postsRes.data) ? postsRes.data : [];
    const postIds = posts.map((p) => p.id);

    const [commentsRes, likesRes] =
      postIds.length > 0
        ? await Promise.all([
            supabase
              .from('feed_post_comments')
              .select('*')
              .in('post_id', postIds)
              .order('created_at', { ascending: true }),
            currentUserId
              ? supabase
                  .from('feed_post_likes')
                  .select('post_id')
                  .eq('user_id', currentUserId)
                  .in('post_id', postIds)
              : Promise.resolve({ data: [], error: null }),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];

    const commentsByPost = new Map<
      string,
      { id: string; userId?: string; author: string; avatar: string; text: string; time: string }[]
    >();

    if (!commentsRes.error && commentsRes.data) {
      for (const c of commentsRes.data as any[]) {
        const list = commentsByPost.get(c.post_id) || [];
        list.push({
          id: String(c.id),
          userId: c.user_id ? String(c.user_id) : undefined,
          author: c.author || 'Usuário',
          avatar: c.avatar || '',
          text: c.text || '',
          time: formatRelativeTime(c.created_at, c.time_label),
        });
        commentsByPost.set(c.post_id, list);
      }
    }

    const likedSet = new Set<string>(
      !likesRes.error && likesRes.data
        ? (likesRes.data as any[]).map((l) => String(l.post_id))
        : []
    );

    const existingReviewIds = new Set<string>();
    const combined: { sortTime: number; item: FeedPostItem }[] = [];

    for (const p of posts) {
      if (p.review_id) {
        existingReviewIds.add(String(p.review_id));
      }
      const sortTime = p.created_at ? new Date(p.created_at).getTime() || 0 : 0;
      combined.push({
        sortTime,
        item: {
          id: String(p.id),
          userId: p.user_id ? String(p.user_id) : undefined,
          activityType: p.activity_type || 'review',
          friendName: p.friend_name || 'Usuário',
          friendUsername: p.friend_username || 'user',
          friendAvatar: p.friend_avatar || '',
          albumId: String(p.album_id || ''),
          albumTitle: p.album_title || '',
          artistId: p.artist_id ? String(p.artist_id) : undefined,
          artistName: p.artist_name || '',
          artistGenre: p.artist_genre || undefined,
          albumCover: p.album_cover || '',
          rating: Number(p.rating || 0),
          comment: p.comment || '',
          timeAgo: formatRelativeTime(p.created_at, p.time_ago, Boolean(p.is_edited)),
          likesCount: Number(p.likes_count || 0),
          isLiked: likedSet.has(String(p.id)),
          isEdited: Boolean(p.is_edited),
          comments: commentsByPost.get(String(p.id)) || [],
        },
      });
    }

    // Garante que qualquer avaliação em `album_reviews` que ainda não tenha entrada em `feed_posts`
    // também apareça na timeline em ordem cronológica
    const recentReviews: any[] =
      !reviewsRes.error && Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
    for (const r of recentReviews) {
      const reviewId = String(r.id);
      if (existingReviewIds.has(reviewId)) continue;
      const album = Array.isArray(r.album) ? r.album[0] : r.album;
      const sortTime = r.created_at ? new Date(r.created_at).getTime() || 0 : 0;
      combined.push({
        sortTime,
        item: {
          id: `review-feed-${reviewId}`,
          userId: r.user_id ? String(r.user_id) : undefined,
          activityType: 'review',
          friendName: r.user_display_name || r.username || 'Usuário',
          friendUsername: r.username || 'user',
          friendAvatar: r.user_avatar || '',
          albumId: String(r.album_id || ''),
          albumTitle: album?.title || 'Álbum',
          artistId: album?.artist_id ? String(album.artist_id) : undefined,
          artistName: album?.artist_name || 'Artista',
          artistGenre: album?.genre_name || undefined,
          albumCover: album?.cover_xl || album?.cover_big || album?.cover_medium || '',
          rating: Number(r.rating || 0),
          comment: r.comment || '',
          timeAgo: formatRelativeTime(r.created_at, r.display_date, Boolean(r.is_edited)),
          likesCount: Number(r.likes_count || 0),
          isLiked: false,
          isEdited: Boolean(r.is_edited),
          comments: [],
        },
      });
    }

    combined.sort((a, b) => b.sortTime - a.sortTime);
    return combined.slice(0, 60).map((entry) => entry.item);
  } catch (err) {
    console.warn('[CatalogService] Erro ao buscar feed_posts:', err);
    return [];
  }
}

export async function toggleFeedPostLikeInSupabase(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  try {
    if (currentlyLiked) {
      const { error } = await supabase
        .from('feed_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) return currentlyLiked;
      return false;
    } else {
      const { error } = await supabase
        .from('feed_post_likes')
        .insert({ post_id: postId, user_id: userId });
      if (error) return currentlyLiked;
      return true;
    }
  } catch {
    return currentlyLiked;
  }
}

export async function addFeedPostCommentInSupabase(params: {
  postId: string;
  userId: string;
  author: string;
  avatar: string;
  text: string;
}): Promise<{ id: string; userId?: string; author: string; avatar: string; text: string; time: string } | null> {
  try {
    const { data, error } = await supabase
      .from('feed_post_comments')
      .insert({
        post_id: params.postId,
        user_id: params.userId,
        author: params.author,
        avatar: params.avatar,
        text: params.text,
        time_label: 'Agora mesmo',
      })
      .select('*')
      .single();

    if (error || !data) return null;
    return {
      id: String(data.id),
      userId: data.user_id ? String(data.user_id) : params.userId,
      author: data.author,
      avatar: data.avatar || '',
      text: data.text,
      time: formatRelativeTime(data.created_at),
    };
  } catch {
    return null;
  }
}

export async function deleteFeedPostCommentInSupabase(
  commentId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('feed_post_comments')
      .delete()
      .eq('id', commentId)
      .select('id');
    if (error) {
      console.warn('[CatalogService] Erro ao excluir comentário:', error);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

// ============================================================================
// REVIEWS DA COMUNIDADE (`album_reviews`, `album_review_likes`)
// ============================================================================

export async function getCommunityReviewsFromSupabase(
  currentUserId?: string,
  albumId?: string
): Promise<CommunityReviewItem[]> {
  try {
    let query = supabase
      .from('album_reviews')
      .select(`
        id,
        album_id,
        user_id,
        user_display_name,
        username,
        user_avatar,
        rating,
        comment,
        display_date,
        is_edited,
        likes_count,
        comments_count,
        created_at,
        album:albums(title, artist_name, cover_xl, cover_big, cover_medium)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (albumId) {
      query = query.eq('album_id', albumId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let likedIds = new Set<string>();
    if (currentUserId && data.length > 0) {
      const { data: likesData } = await supabase
        .from('album_review_likes')
        .select('review_id')
        .eq('user_id', currentUserId)
        .in(
          'review_id',
          data.map((r: any) => r.id)
        );
      if (likesData) {
        likedIds = new Set(likesData.map((l: any) => String(l.review_id)));
      }
    }

    return data.map((row: any): CommunityReviewItem => {
      const album = Array.isArray(row.album) ? row.album[0] : row.album;
      return {
        id: String(row.id),
        userId: row.user_id || undefined,
        userName: row.user_display_name || row.username || 'Usuário',
        username: row.username || 'user',
        userAvatar: row.user_avatar || '',
        albumTitle: album?.title || 'Álbum',
        artistName: album?.artist_name || 'Artista',
        albumCover: album?.cover_xl || album?.cover_big || album?.cover_medium || '',
        albumId: String(row.album_id),
        rating: Number(row.rating || 0),
        comment: row.comment || '',
        timeAgo: formatRelativeTime(row.created_at, row.display_date, Boolean(row.is_edited)),
        likesCount: Number(row.likes_count || 0),
        isLiked: likedIds.has(String(row.id)),
        commentsCount: Number(row.comments_count || 0),
      };
    });
  } catch (err) {
    console.warn('[CatalogService] Erro ao buscar album_reviews:', err);
    return [];
  }
}

export async function toggleReviewLikeInSupabase(
  reviewId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  try {
    if (currentlyLiked) {
      const { error } = await supabase
        .from('album_review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);
      if (error) return currentlyLiked;
      return false;
    } else {
      const { error } = await supabase
        .from('album_review_likes')
        .insert({ review_id: reviewId, user_id: userId });
      if (error) return currentlyLiked;
      return true;
    }
  } catch {
    return currentlyLiked;
  }
}

export async function syncAlbumCommunityRatingInSupabase(albumId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('album_reviews')
      .select('rating')
      .eq('album_id', albumId);

    if (error || !Array.isArray(data)) return;

    const ratings = data
      .map((row: any) => Number(row.rating))
      .filter((val) => Number.isFinite(val) && val > 0);

    const totalReviews = ratings.length;
    const communityRating =
      totalReviews > 0
        ? Number((ratings.reduce((acc, r) => acc + r, 0) / totalReviews).toFixed(1))
        : 0;

    await supabase
      .from('albums')
      .update({
        total_reviews: totalReviews,
        community_rating: communityRating,
      })
      .eq('id', albumId);
  } catch {
    // non-blocking
  }
}

export async function submitAlbumReviewToSupabase(params: {
  album: CatalogAlbum;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  rating: number;
  comment: string;
}): Promise<{ review: AlbumUserReview | null; isEdited?: boolean; error?: string }> {
  try {
    const ensured = await ensureAlbumExistsInSupabase(params.album);
    if (!ensured.ok) {
      return {
        review: null,
        error: `Não foi possível registrar o álbum no catálogo: ${ensured.error || 'erro desconhecido'}`,
      };
    }

    const clampedRating = Math.min(10, Math.max(1, Number(params.rating) || 8));

    // Verifica se o usuário já avaliou este álbum (para atualizar em vez de duplicar)
    const { data: existingReview } = await supabase
      .from('album_reviews')
      .select('id')
      .eq('album_id', params.album.id)
      .eq('user_id', params.userId)
      .maybeSingle();

    let savedRow: any = null;
    let saveError: any = null;
    let isEdited = false;

    if (existingReview?.id) {
      isEdited = true;
      const { data, error } = await supabase
        .from('album_reviews')
        .update({
          rating: clampedRating,
          comment: params.comment,
          user_display_name: params.displayName,
          username: params.username,
          user_avatar: params.avatarUrl,
          display_date: 'Editado agora',
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReview.id)
        .eq('user_id', params.userId)
        .select('*')
        .single();
      savedRow = data;
      saveError = error;
    } else {
      const { data, error } = await supabase
        .from('album_reviews')
        .insert({
          album_id: params.album.id,
          user_id: params.userId,
          user_display_name: params.displayName,
          username: params.username,
          user_avatar: params.avatarUrl,
          rating: clampedRating,
          comment: params.comment,
          display_date: 'Agora mesmo',
        })
        .select('*')
        .single();
      savedRow = data;
      saveError = error;
    }

    if (saveError || !savedRow) {
      console.warn('[CatalogService] Erro ao salvar album_reviews:', saveError);
      return { review: null, error: saveError?.message || 'Erro ao publicar avaliação.' };
    }

    // Recalcula e persiste a nota e o total da comunidade na tabela `albums`
    await syncAlbumCommunityRatingInSupabase(params.album.id);

    // Publica ou atualiza também na timeline (feed_posts) — garante aparição no início
    try {
      const insertFeedPost = async () => {
        const basePayload = {
          activity_type: 'review' as const,
          user_id: params.userId,
          friend_name: params.displayName,
          friend_username: params.username,
          friend_avatar: params.avatarUrl || '',
          album_id: params.album.id,
          album_title: params.album.title,
          artist_id: params.album.artist?.id?.trim() || null,
          artist_name: params.album.artist?.name || 'Artista',
          artist_genre: params.album.genreName || null,
          album_cover: params.album.cover_xl || params.album.cover_big || params.album.cover_medium || '',
          rating: clampedRating,
          comment: params.comment,
          time_ago: 'agora',
          is_edited: isEdited,
          review_id: savedRow.id,
        };

        const { error: feedErr } = await supabase.from('feed_posts').insert(basePayload);
        if (feedErr) {
          // Se falhar por FK de artist_id (ex.: artista com ID divergente), tenta novamente com artist_id = null
          if (feedErr.code === '23503' && basePayload.artist_id) {
            const { error: retryErr } = await supabase
              .from('feed_posts')
              .insert({ ...basePayload, artist_id: null });
            if (retryErr) {
              console.warn('[CatalogService] Aviso ao publicar em feed_posts (retry):', retryErr);
            }
          } else {
            console.warn('[CatalogService] Aviso ao publicar em feed_posts:', feedErr);
          }
        }
      };

      if (isEdited) {
        const { data: updatedPosts, error: updateErr } = await supabase
          .from('feed_posts')
          .update({
            friend_name: params.displayName,
            friend_username: params.username,
            friend_avatar: params.avatarUrl || '',
            rating: clampedRating,
            comment: params.comment,
            is_edited: true,
            time_ago: 'agora · editado',
            updated_at: new Date().toISOString(),
          })
          .eq('review_id', savedRow.id)
          .eq('user_id', params.userId)
          .select('id');

        if (updateErr || !updatedPosts || updatedPosts.length === 0) {
          await insertFeedPost();
        }
      } else {
        await insertFeedPost();
      }
    } catch {
      // non-blocking
    }

    return {
      isEdited,
      review: {
        id: String(savedRow.id),
        userId: savedRow.user_id ? String(savedRow.user_id) : params.userId,
        user: savedRow.user_display_name || params.displayName,
        username: savedRow.username || params.username,
        avatar: savedRow.user_avatar || '',
        rating: Number(savedRow.rating),
        comment: savedRow.comment,
        date: formatRelativeTime(savedRow.created_at, undefined, isEdited),
        likes: Number(savedRow.likes_count || 0),
        likedByMe: false,
      },
    };
  } catch (err: any) {
    console.warn('[CatalogService] Exceção ao salvar avaliação:', err);
    return { review: null, error: err?.message || 'Erro inesperado ao salvar avaliação.' };
  }
}

// ============================================================================
// INTERAÇÕES DO USUÁRIO (FAVORITOS, OUVIDOS, ÍDOLOS, LISTAS)
// ============================================================================

export async function isAlbumFavoritedInSupabase(
  userId: string,
  albumId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_favorite_albums')
      .select('id')
      .eq('user_id', userId)
      .eq('album_id', albumId)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

export async function toggleFavoriteAlbumInSupabase(
  userId: string,
  album: CatalogAlbum
): Promise<boolean> {
  try {
    const exists = await isAlbumFavoritedInSupabase(userId, album.id);
    if (exists) {
      await Promise.all([
        supabase
          .from('user_favorite_albums')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', album.id),
        supabase
          .from('feed_posts')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', album.id)
          .eq('activity_type', 'favorite'),
      ]);
      notifyCatalogUpdated();
      return false;
    } else {
      await ensureAlbumExistsInSupabase(album);
      await supabase
        .from('user_favorite_albums')
        .insert({ user_id: userId, album_id: album.id });

      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        const basePayload = {
          activity_type: 'favorite' as const,
          user_id: userId,
          friend_name: userProfile?.full_name || userProfile?.username || 'Usuário',
          friend_username: userProfile?.username || 'user',
          friend_avatar: userProfile?.avatar_url || '',
          album_id: album.id,
          album_title: album.title || 'Álbum',
          artist_id: album.artist?.id?.trim() || null,
          artist_name: album.artist?.name || 'Artista',
          artist_genre: album.genreName || null,
          album_cover: album.cover_xl || album.cover_big || album.cover_medium || '',
          rating: Number(album.communityRating || 0),
          comment: '',
          time_ago: 'agora',
        };

        const { error: feedErr } = await supabase.from('feed_posts').insert(basePayload);
        if (feedErr && feedErr.code === '23503' && basePayload.artist_id) {
          await supabase.from('feed_posts').insert({ ...basePayload, artist_id: null });
        }
      } catch {
        // non-blocking
      }

      notifyCatalogUpdated();
      return true;
    }
  } catch {
    return false;
  }
}

export async function toggleListenedAlbumInSupabase(
  userId: string,
  album: CatalogAlbum,
  currentlyListened: boolean
): Promise<boolean> {
  try {
    if (currentlyListened) {
      await supabase
        .from('user_listened_albums')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', album.id);
      return false;
    } else {
      await ensureAlbumExistsInSupabase(album);
      await supabase
        .from('user_listened_albums')
        .insert({ user_id: userId, album_id: album.id });
      return true;
    }
  } catch {
    return currentlyListened;
  }
}

export async function getFollowedArtistIdsFromSupabase(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_followed_artists')
      .select('artist_id')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map((row: any) => String(row.artist_id));
  } catch {
    return [];
  }
}

export async function toggleFollowArtistInSupabase(
  userId: string,
  artist: CatalogArtist,
  currentlyFollowing: boolean
): Promise<boolean> {
  try {
    if (currentlyFollowing) {
      await Promise.all([
        supabase
          .from('user_followed_artists')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', artist.id),
        supabase
          .from('feed_posts')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', artist.id)
          .eq('activity_type', 'follow_idol'),
      ]);
      notifyCatalogUpdated();
      return false;
    } else {
      await ensureArtistExistsInSupabase({
        id: artist.id,
        name: artist.name,
        image_url: artist.imageUrl,
        banner_url: artist.imageUrl,
        genre: artist.genre,
        country: artist.country,
        type: artist.type,
      });
      await supabase
        .from('user_followed_artists')
        .insert({ user_id: userId, artist_id: artist.id });

      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        await supabase.from('feed_posts').insert({
          activity_type: 'follow_idol' as const,
          user_id: userId,
          friend_name: userProfile?.full_name || userProfile?.username || 'Usuário',
          friend_username: userProfile?.username || 'user',
          friend_avatar: userProfile?.avatar_url || '',
          album_id: null,
          album_title: artist.name || 'Artista',
          artist_id: artist.id,
          artist_name: artist.name || 'Artista',
          artist_genre: artist.genre || 'Artista',
          album_cover: artist.imageUrl || '',
          rating: 0,
          comment: '',
          time_ago: 'agora',
        });
      } catch {
        // non-blocking
      }

      notifyCatalogUpdated();
      return true;
    }
  } catch {
    return currentlyFollowing;
  }
}

export async function createUserListInSupabase(
  userId: string,
  title: string,
  description: string
): Promise<UserListRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_lists')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || 'Coletânea personalizada de álbuns favoritos.',
        items_count: 0,
        created_label: 'Criado agora',
      })
      .select('*')
      .single();

    if (error || !data) return null;
    return {
      id: String(data.id),
      title: data.title,
      count: Number(data.items_count || 0),
      description: data.description || '',
      createdAt: data.created_label || 'Criado agora',
      isDefault: Boolean(data.is_default),
      albums: [],
    };
  } catch {
    return null;
  }
}

export async function addAlbumToUserListInSupabase(
  listId: string,
  album: CatalogAlbum
): Promise<boolean> {
  try {
    await ensureAlbumExistsInSupabase(album);
    const { error } = await supabase.from('user_list_items').upsert(
      {
        list_id: listId,
        album_id: album.id,
        album_title: album.title,
        album_cover: album.cover_medium || album.cover_big || '',
      },
      { onConflict: 'list_id,album_id', ignoreDuplicates: true }
    );
    return !error;
  } catch {
    return false;
  }
}
