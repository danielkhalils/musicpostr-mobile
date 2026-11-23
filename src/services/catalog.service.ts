import { supabase } from './supabase';
import { formatSocialDate } from '@/utils/date';
import {
  notifyCatalogUpdated,
  type CatalogAlbum,
  type CatalogArtist,
  type CatalogTrack,
  type AlbumUserReview,
  type FeedPostItem,
  type AlbumAward,
  type UserListRecord,
} from './musicBrainz.service';

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
    type: row.type || 'Person',
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

export async function getGenresFromSupabase(): Promise<GenreRecord[]> {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name, emoji')
      .order('display_order', { ascending: true });
    if (error || !data) return [];
    return data.map((g: any) => ({
      id: String(g.id),
      name: g.name,
      emoji: g.emoji || '🎵',
    }));
  } catch {
    return [];
  }
}

export async function getRecordLabelsFromSupabase(): Promise<RecordLabelRecord[]> {
  try {
    const { data, error } = await supabase
      .from('record_labels')
      .select('id, name, description')
      .order('name', { ascending: true });
    if (error || !data) return [];
    return data.map((l: any) => ({
      id: String(l.id),
      name: l.name,
      desc: l.description || '',
    }));
  } catch {
    return [];
  }
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
    }

    if (!listenedRes.error && listenedRes.data) {
      album.listenedByMe = true;
    }

    return album;
  } catch {
    return null;
  }
}

export async function getAlbumAwardsFromSupabase(albumId: string): Promise<AlbumAward[]> {
  try {
    const { data, error } = await supabase
      .from('album_awards')
      .select('*')
      .eq('album_id', albumId)
      .order('year', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
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
    }));
  } catch {
    return [];
  }
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
      type: artist.type || 'Person',
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
