import { supabase } from './supabase';
import {
  type MyReviewRecord,
  type FavoriteAlbumRecord,
  type CatalogArtist,
  type UserListRecord,
} from './musicBrainz.service';

export interface FriendProfileRecord {
  id: string;
  name: string;
  username: string;
  avatar: string;
  reviewsCount: number;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  lastfm?: string;
  youtube?: string;
  threads?: string;
  discord?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface UserProfileData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  profile_visibility: 'public' | 'private';
  email_notif: boolean;
  community_notif: boolean;
  releases_notif: boolean;
  is_linked_google: boolean;
  is_linked_apple: boolean;
  auth_provider: string;
  theme_preference: string;
  socials: SocialLinks;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileStats {
  reviews: number;
  favorites: number;
  avgRating: number;
  friends: number;
  idols: number;
  lists: number;
}

export interface UnifiedProfileViewData {
  id?: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  profileVisibility: 'public' | 'private';
  emailNotif: boolean;
  communityNotif: boolean;
  releasesNotif: boolean;
  isLinkedGoogle: boolean;
  isLinkedApple: boolean;
  socials: SocialLinks;
  stats: ProfileStats;
}

// Converte o registro da tabela profiles do Supabase para o formato consumido pelas telas
export function mapSupabaseProfileToView(
  profile: Partial<UserProfileData>,
  stats?: Partial<ProfileStats>
): UnifiedProfileViewData {
  return {
    id: profile.id,
    name: profile.full_name || 'Melômano',
    username: profile.username || 'user',
    email: profile.email || '',
    phone: profile.phone || '',
    bio:
      profile.bio ||
      'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.',
    avatarUrl:
      profile.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    bannerUrl:
      profile.banner_url ||
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=600&auto=format&fit=crop',
    profileVisibility: profile.profile_visibility || 'public',
    emailNotif: profile.email_notif ?? true,
    communityNotif: profile.community_notif ?? true,
    releasesNotif: profile.releases_notif ?? false,
    isLinkedGoogle: profile.is_linked_google ?? false,
    isLinkedApple: profile.is_linked_apple ?? false,
    socials: profile.socials || {},
    stats: {
      reviews: stats?.reviews ?? 0,
      favorites: stats?.favorites ?? 0,
      avgRating: stats?.avgRating ?? 0.0,
      friends: stats?.friends ?? 0,
      idols: stats?.idols ?? 0,
      lists: stats?.lists ?? 0,
    },
  };
}

/**
 * Busca o perfil do usuário pelo seu ID no Supabase
 */
export async function getProfileById(userId: string): Promise<UserProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar perfil por ID:', error);
    return null;
  }
}

/**
 * Busca o perfil do usuário pelo seu username no Supabase
 */
export async function getProfileByUsername(username: string): Promise<UserProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar perfil por username:', error);
    return null;
  }
}

/**
 * Busca as estatísticas consolidadas do usuário através da view v_profile_stats
 */
export async function getProfileStats(identifier: { userId?: string; username?: string }): Promise<ProfileStats> {
  try {
    let query = supabase.from('v_profile_stats').select('*');
    if (identifier.userId) {
      query = query.eq('user_id', identifier.userId);
    } else if (identifier.username) {
      query = query.ilike('username', identifier.username);
    } else {
      return { reviews: 0, favorites: 0, avgRating: 0.0, friends: 0, idols: 0, lists: 0 };
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    if (data) {
      return {
        reviews: Number(data.reviews_count || 0),
        favorites: Number(data.favorites_count || 0),
        avgRating: Number(data.avg_rating || 0.0),
        friends: Number(data.friends_count || 0),
        idols: Number(data.idols_count || 0),
        lists: Number(data.lists_count || 0),
      };
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar v_profile_stats:', error);
  }

  return { reviews: 0, favorites: 0, avgRating: 0.0, friends: 0, idols: 0, lists: 0 };
}

/**
 * Atualiza os campos do perfil na tabela `profiles`
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfileData>
): Promise<{ success: boolean; data?: UserProfileData; error?: any }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.warn('[ProfileService] Erro ao atualizar perfil:', error);
    return { success: false, error };
  }
}

/**
 * Busca as avaliações (reviews) feitas pelo usuário
 */
export async function getUserReviews(identifier: { userId?: string; username?: string }): Promise<MyReviewRecord[]> {
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
        likes_count,
        created_at,
        album:albums(
          id,
          title,
          artist_name,
          cover_medium,
          release_date,
          genre_name
        )
      `)
      .order('created_at', { ascending: false });

    if (identifier.userId) {
      query = query.eq('user_id', identifier.userId);
    } else if (identifier.username) {
      query = query.ilike('username', identifier.username);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        albumId: item.album_id,
        albumTitle: item.album?.title || 'Álbum',
        artistName: item.album?.artist_name || 'Artista',
        coverUrl: item.album?.cover_medium || '',
        rating: Number(item.rating),
        comment: item.comment,
        date: item.created_at,
      }));
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar reviews do Supabase:', error);
  }

  return [];
}

/**
 * Busca os álbuns favoritos do usuário
 */
export async function getUserFavoriteAlbums(identifier: { userId?: string; username?: string }): Promise<FavoriteAlbumRecord[]> {
  try {
    let targetUserId = identifier.userId;
    if (!targetUserId && identifier.username) {
      const profile = await getProfileByUsername(identifier.username);
      targetUserId = profile?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_favorite_albums')
      .select(`
        id,
        album_id,
        created_at,
        album:albums(
          id,
          title,
          artist_name,
          cover_medium,
          release_date,
          genre_name,
          community_rating
        )
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.album?.id || item.album_id,
        title: item.album?.title || 'Álbum',
        artist: item.album?.artist_name || 'Artista',
        cover: item.album?.cover_medium || '',
        rating: Number(item.album?.community_rating || 0),
      }));
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar favoritos do Supabase:', error);
  }

  return [];
}

/**
 * Busca os artistas seguidos (Ídolos) pelo usuário
 */
export async function getUserFollowedArtists(identifier: { userId?: string; username?: string }): Promise<CatalogArtist[]> {
  try {
    let targetUserId = identifier.userId;
    if (!targetUserId && identifier.username) {
      const profile = await getProfileByUsername(identifier.username);
      targetUserId = profile?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_followed_artists')
      .select(`
        id,
        artist_id,
        created_at,
        artist:artists(
          id,
          name,
          image_url,
          genre,
          country,
          nb_fans
        )
      `)
      .eq('user_id', targetUserId);

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.artist?.id || item.artist_id,
        name: item.artist?.name || 'Artista',
        imageUrl: item.artist?.image_url || '',
        genre: item.artist?.genre || 'Artista Oficial',
        country: item.artist?.country || '',
        nbFans: item.artist?.nb_fans || 0,
      }));
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar ídolos do Supabase:', error);
  }

  return [];
}

/**
 * Busca as listas criadas pelo usuário
 */
export async function getUserListsFromSupabase(identifier: { userId?: string; username?: string }): Promise<UserListRecord[]> {
  try {
    let targetUserId = identifier.userId;
    if (!targetUserId && identifier.username) {
      const profile = await getProfileByUsername(identifier.username);
      targetUserId = profile?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_lists')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        title: item.title || item.name || 'Lista',
        count: item.items_count || 0,
        description: item.description || '',
        createdAt: item.created_label || item.created_at,
        isDefault: item.is_default || false,
      }));
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar listas do Supabase:', error);
  }

  return [];
}

/**
 * Busca a rede de amigos aceitos do usuário no Supabase
 */
export async function getUserFriends(identifier: { userId?: string; username?: string }): Promise<FriendProfileRecord[]> {
  try {
    let targetUserId = identifier.userId;
    if (!targetUserId && identifier.username) {
      const profile = await getProfileByUsername(identifier.username);
      targetUserId = profile?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        friend:profiles!friendships_friend_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'accepted');

    if (error) throw error;

    if (data && data.length > 0) {
      return data
        .filter((row: any) => row.friend)
        .map((row: any) => ({
          id: row.friend.id,
          name: row.friend.full_name || row.friend.username || 'Usuário',
          username: row.friend.username || 'user',
          avatar:
            row.friend.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          reviewsCount: 0,
        }));
    }
  } catch (error) {
    console.warn('[ProfileService] Erro ao buscar amigos do Supabase:', error);
  }

  return [];
}

/**
 * Exclui uma avaliação feita pelo usuário no Supabase
 */
export async function deleteReviewFromSupabase(reviewId: string, userId?: string): Promise<boolean> {
  try {
    let query = supabase.from('album_reviews').delete().eq('id', reviewId);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('[ProfileService] Erro ao excluir review do Supabase:', error);
    return false;
  }
}
