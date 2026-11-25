import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import {
  User,
  Star,
  Heart,
  Camera,
  Image as ImageIcon,
  Users,
  Award,
  ListMusic,
  Share2,
  Check,
  Settings,
  ArrowLeft,
  LogIn,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import { useAuth } from '@/context/AuthContext';
import {
  pickAndUploadProfileMedia,
  type ImageSourceMode,
  type ProfileMediaKind,
} from '@/services/profileMedia.service';
import {
  type MyReviewRecord,
  type FavoriteAlbumRecord,
  type UserListRecord,
  type FeedPostItem,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import {
  getProfileByUsername,
  getProfileById,
  getProfileStats,
  getUserReviews,
  getUserFavoriteAlbums,
  getUserFollowedArtists,
  getUserListsFromSupabase,
  deleteReviewFromSupabase,
  mapSupabaseProfileToView,
  type UnifiedProfileViewData,
} from '@/services/profile.service';
import {
  getUserFeedPostsFromSupabase,
  ensureFeedPostInSupabase,
  toggleFeedPostLikeInSupabase,
  addFeedPostCommentInSupabase,
  deleteFeedPostCommentInSupabase,
} from '@/services/catalog.service';
import { CoverImage } from '@/components/CoverImage';
import { FeedPostCard } from '@/components/FeedPostCard';
import { FeedCommentsModal, FeedShareModal } from '@/components/FeedPostModals';
import { SocialIcon } from '@/components/SocialIcon';
import { openSocialLink } from '@/utils/social';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';

type ProfileHistoryTab = 'all' | 'reviews' | 'favorites';

export function ProfileView({
  visitingUsername,
}: {
  visitingUsername?: string;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, profile: authProfile, refreshProfile, updateProfileData } = useAuth();
  const { mode: cardMode } = useActivityCardMode();

  // Verifica se o usuário atual está visitando outro perfil
  const isVisiting = Boolean(
    visitingUsername && visitingUsername !== authProfile?.username
  );
  const canEditMedia = Boolean(user && !isVisiting);

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [historyTab, setHistoryTab] = useState<ProfileHistoryTab>('all');
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(INFINITE_PAGE_SIZE);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<ProfileMediaKind | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<ProfileMediaKind | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<MyReviewRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAlbumRecord[]>([]);
  const [idolsCount, setIdolsCount] = useState(0);
  const [lists, setLists] = useState<UserListRecord[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPostItem[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [sharePostItem, setSharePostItem] = useState<FeedPostItem | null>(null);

  const activeCommentPost = useMemo(
    () => feedPosts.find((item) => item.id === activeCommentPostId) ?? null,
    [feedPosts, activeCommentPostId]
  );

  const filteredFeedPosts = useMemo(() => {
    if (historyTab === 'all') return feedPosts;
    if (historyTab === 'reviews') {
      return feedPosts.filter((p) => (p.activityType || 'review') === 'review');
    }
    if (historyTab === 'favorites') {
      return feedPosts.filter((p) => p.activityType === 'favorite');
    }
    return feedPosts;
  }, [feedPosts, historyTab]);

  // Dados consolidados do perfil carregado
  const [customProfile, setCustomProfile] = useState<UnifiedProfileViewData | null>(null);

  // Carrega os dados reais do Supabase
  const loadProfileData = useCallback(async () => {
    try {
      if (isVisiting && visitingUsername) {
        // Carrega dados do perfil visitado no Supabase
        const [dbProfile, stats, userRevs, userFavs, userIdols, userLists, userPosts] = await Promise.all([
          getProfileByUsername(visitingUsername),
          getProfileStats({ username: visitingUsername }),
          getUserReviews({ username: visitingUsername }),
          getUserFavoriteAlbums({ username: visitingUsername }),
          getUserFollowedArtists({ username: visitingUsername }),
          getUserListsFromSupabase({ username: visitingUsername }),
          getUserFeedPostsFromSupabase({ username: visitingUsername }, user?.id),
        ]);

        if (dbProfile) {
          setCustomProfile(mapSupabaseProfileToView(dbProfile, stats));
        } else {
          setCustomProfile(null);
        }
        setReviews(userRevs);
        setFavorites(userFavs);
        setIdolsCount(userIdols.length);
        setLists(userLists);
        setFeedPosts(userPosts);
      } else if (user) {
        // Carrega dados do usuário autenticado no Supabase
        const [stats, userRevs, userFavs, userIdols, userLists, userPosts] = await Promise.all([
          getProfileStats({ userId: user.id }),
          getUserReviews({ userId: user.id }),
          getUserFavoriteAlbums({ userId: user.id }),
          getUserFollowedArtists({ userId: user.id }),
          getUserListsFromSupabase({ userId: user.id }),
          getUserFeedPostsFromSupabase({ userId: user.id }, user.id),
        ]);

        if (authProfile) {
          setCustomProfile(mapSupabaseProfileToView(authProfile, stats));
        } else {
          const fresh = await getProfileById(user.id);
          if (fresh) {
            setCustomProfile(mapSupabaseProfileToView(fresh, stats));
          }
        }

        setReviews(userRevs);
        setFavorites(userFavs);
        setIdolsCount(userIdols.length);
        setLists(userLists);
        setFeedPosts(userPosts);
      } else {
        setCustomProfile(null);
        setReviews([]);
        setFavorites([]);
        setIdolsCount(0);
        setLists([]);
        setFeedPosts([]);
      }
    } catch (err) {
      console.warn('[ProfileView] Erro ao carregar perfil do Supabase:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [isVisiting, visitingUsername, user, authProfile]);

  useEffect(() => {
    loadProfileData();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      loadProfileData();
    });
    return unsubscribe;
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadProfileData()]);
    setRefreshing(false);
  };

  const handleToggleLike = async (postId: string) => {
    const target = feedPosts.find((item) => item.id === postId);
    if (!target) return;
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const prevLiked = target.isLiked;

    setFeedPosts((prev) =>
      prev.map((item) =>
        item.id === postId
          ? {
              ...item,
              isLiked: !prevLiked,
              likesCount: Math.max(0, prevLiked ? item.likesCount - 1 : item.likesCount + 1),
            }
          : item
      )
    );

    const realPostId = await ensureFeedPostInSupabase(target);
    if (!realPostId) return;

    if (realPostId !== postId) {
      setFeedPosts((prev) =>
        prev.map((item) => (item.id === postId ? { ...item, id: realPostId } : item))
      );
      setActiveCommentPostId((prev) => (prev === postId ? realPostId : prev));
    }

    await toggleFeedPostLikeInSupabase(realPostId, user.id, prevLiked);
  };

  const handleAddComment = async (postId: string, commentText: string): Promise<boolean> => {
    const text = commentText.trim();
    if (!text) return false;
    if (!user) {
      setActiveCommentPostId(null);
      router.push('/login' as any);
      return false;
    }

    const target = feedPosts.find((item) => item.id === postId);
    if (!target) return false;

    const realPostId = await ensureFeedPostInSupabase(target);
    if (!realPostId) return false;

    const authorName = authProfile?.full_name || authProfile?.username || 'Usuário';
    const authorAvatar = authProfile?.avatar_url || '';

    const created = await addFeedPostCommentInSupabase({
      postId: realPostId,
      userId: user.id,
      author: authorName,
      avatar: authorAvatar,
      text,
    });

    if (created) {
      setFeedPosts((prev) =>
        prev.map((item) =>
          item.id === postId || item.id === realPostId
            ? {
                ...item,
                id: realPostId,
                comments: [...item.comments, created],
              }
            : item
        )
      );
      if (realPostId !== postId) {
        setActiveCommentPostId((prev) => (prev === postId ? realPostId : prev));
      }
      return true;
    }
    return false;
  };

  const executeDeleteComment = async (postId: string, commentId: string) => {
    if (deletingCommentId) return;
    setDeletingCommentId(commentId);
    try {
      const ok = await deleteFeedPostCommentInSupabase(commentId);
      if (ok) {
        setFeedPosts((prev) =>
          prev.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  comments: item.comments.filter((c) => c.id !== commentId),
                }
              : item
          )
        );
      } else {
        Alert.alert(
          'Erro ao excluir comentário',
          'Não foi possível excluir este comentário. Tente novamente.'
        );
      }
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (deletingCommentId) return;
    const message = 'Tem certeza que deseja excluir este comentário?';
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(message);
      if (confirmed) {
        executeDeleteComment(postId, commentId);
      }
      return;
    }

    Alert.alert('Excluir comentário', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => executeDeleteComment(postId, commentId),
      },
    ]);
  };

  const executeDeleteReview = async (id: string, albumId?: string) => {
    if (isVisiting || deletingReviewId) return;
    setDeletingReviewId(id);
    try {
      const ok = user ? await deleteReviewFromSupabase(id, user.id) : true;
      if (ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setFeedPosts((prev) =>
          prev.filter(
            (p) =>
              !(
                (p.activityType || 'review') === 'review' &&
                (p.reviewId === id || (albumId && p.albumId === albumId))
              )
          )
        );
      } else {
        Alert.alert(
          'Erro ao excluir',
          'Não foi possível excluir esta avaliação. Tente novamente.'
        );
      }
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleDeleteReview = (id: string, albumTitle?: string, albumId?: string) => {
    if (isVisiting || deletingReviewId) return;
    const message = albumTitle
      ? `Tem certeza que deseja excluir sua avaliação de "${albumTitle}"? Ela também será removida da timeline.`
      : 'Tem certeza que deseja excluir esta avaliação? Ela também será removida da timeline.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(message);
      if (confirmed) {
        executeDeleteReview(id, albumId);
      }
      return;
    }

    Alert.alert('Excluir avaliação', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => executeDeleteReview(id, albumId),
      },
    ]);
  };

  const avgCalculated =
    reviews.length > 0
      ? Number(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        )
      : (customProfile?.stats.avgRating || 0.0);

  const displayProfile: UnifiedProfileViewData = customProfile
    ? {
        ...customProfile,
        stats: {
          ...customProfile.stats,
          reviews: customProfile.stats.reviews || reviews.length,
          favorites: customProfile.stats.favorites || favorites.length,
          idols: customProfile.stats.idols || idolsCount,
          lists: customProfile.stats.lists || lists.length,
          avgRating: customProfile.stats.avgRating || avgCalculated,
        },
      }
    : {
        name: isVisiting ? `@${visitingUsername}` : (authProfile?.full_name || user?.email?.split('@')[0] || 'Visitante'),
        username: isVisiting ? (visitingUsername || 'user') : (authProfile?.username || user?.email?.split('@')[0] || 'visitante'),
        email: isVisiting ? '' : (authProfile?.email || user?.email || ''),
        phone: authProfile?.phone || '',
        bio: authProfile?.bio || '',
        avatarUrl:
          authProfile?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        bannerUrl:
          authProfile?.banner_url ||
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=600&auto=format&fit=crop',
        profileVisibility: authProfile?.profile_visibility || 'public',
        emailNotif: authProfile?.email_notif ?? true,
        communityNotif: authProfile?.community_notif ?? true,
        releasesNotif: authProfile?.releases_notif ?? false,
        isLinkedGoogle: Boolean(authProfile?.is_linked_google),
        isLinkedApple: Boolean(authProfile?.is_linked_apple),
        socials: authProfile?.socials || {},
        stats: {
          reviews: reviews.length,
          favorites: favorites.length,
          avgRating: avgCalculated,
          friends: 0,
          idols: idolsCount,
          lists: lists.length,
        },
      };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        title: `Perfil de ${displayProfile.name} no Musicpostr`,
        message: `Confira o perfil musical de ${displayProfile.name} (@${displayProfile.username}) no Musicpostr!`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSelectProfileMedia = async (
    kind: ProfileMediaKind,
    source: ImageSourceMode
  ) => {
    if (!user) return;
    setMediaPickerTarget(null);
    setUploadingMedia(kind);

    try {
      const result = await pickAndUploadProfileMedia(user.id, kind, source);
      if (result.canceled) return;

      if (result.error || !result.url) {
        Alert.alert(
          'Não foi possível atualizar a foto',
          result.error || 'Tente novamente em instantes.'
        );
        return;
      }

      const updatePayload =
        kind === 'avatar'
          ? { avatar_url: result.url }
          : { banner_url: result.url };

      const saved = await updateProfileData(updatePayload);
      if (!saved.success) {
        Alert.alert(
          'Erro ao salvar no perfil',
          'A imagem foi enviada, mas não foi possível salvar no seu perfil.'
        );
        return;
      }

      setCustomProfile((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: kind === 'avatar' ? result.url! : prev.avatarUrl,
              bannerUrl: kind === 'banner' ? result.url! : prev.bannerUrl,
            }
          : prev
      );
    } finally {
      setUploadingMedia(null);
    }
  };

  if (isInitialLoading && !customProfile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={(e) => {
        if (visibleHistoryCount < filteredFeedPosts.length && isNearScrollBottom(e)) {
          setVisibleHistoryCount((prev) => prev + INFINITE_PAGE_SIZE);
        }
      }}
      scrollEventThrottle={100}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Banner de Usuário Visitante (Deslogado) */}
      {!user && !isVisiting && (
        <View
          style={{
            marginHorizontal: 14,
            marginTop: Math.max(insets.top + 8, 14),
            marginBottom: 10,
            padding: 14,
            borderRadius: 16,
            backgroundColor: `${colors.primary}18`,
            borderWidth: 1,
            borderColor: `${colors.primary}40`,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground }}>
              Navegando como visitante
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
              Faça login para salvar suas avaliações no Supabase.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/login' as any)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogIn size={13} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Foto de Capa com Botão de Configurações no Topo */}
      <View style={styles.bannerBox}>
        <TouchableOpacity
          activeOpacity={canEditMedia ? 0.9 : 1}
          disabled={!canEditMedia || uploadingMedia === 'banner'}
          onPress={() => canEditMedia && setMediaPickerTarget('banner')}
          style={{ width: '100%', height: '100%' }}
        >
          <CoverImage
            uri={displayProfile.bannerUrl}
            style={styles.bannerImg}
            quality="high"
          />
        </TouchableOpacity>
        <View style={styles.bannerOverlay} pointerEvents="none" />

        {uploadingMedia === 'banner' && (
          <View style={styles.mediaLoadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.mediaLoadingText}>Salvando capa...</Text>
          </View>
        )}

        {canEditMedia && uploadingMedia !== 'banner' && (
          <TouchableOpacity
            onPress={() => setMediaPickerTarget('banner')}
            style={styles.bannerEditBtn}
            accessibilityLabel="Alterar foto de capa"
            activeOpacity={0.85}
          >
            <Camera size={12} color="#fff" />
            <Text style={styles.bannerEditBtnText}>Alterar capa</Text>
          </TouchableOpacity>
        )}

        {/* Ações no topo da tela (Voltar na esquerda, Compartilhar e Configurações na direita) */}
        <View
          style={[
            styles.topHeaderBar,
            { top: Math.max(insets.top + 8, 14) },
          ]}
        >
          {isVisiting ? (
            <TouchableOpacity
              onPress={() => safeGoBack('/(tabs)/reviews')}
              style={styles.topCircleBtn}
              accessibilityLabel="Voltar"
              activeOpacity={0.85}
            >
              <ArrowLeft size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36, height: 36 }} />
          )}

          <View style={styles.topRightActionsWrap}>
            <TouchableOpacity
              onPress={handleShareProfile}
              style={styles.topCircleBtn}
              accessibilityLabel="Compartilhar Perfil"
              activeOpacity={0.85}
            >
              {copied ? (
                <Check size={17} color={colors.emerald} />
              ) : (
                <Share2 size={17} color="#fff" />
              )}
            </TouchableOpacity>

            {!isVisiting && (
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={styles.topCircleBtn}
                accessibilityLabel="Configurações"
                activeOpacity={0.85}
              >
                <Settings size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Card Principal de Perfil Social Móvel */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Linha do Avatar e Identidade */}
        <View style={styles.avatarHeaderRow}>
          <TouchableOpacity
            activeOpacity={canEditMedia ? 0.85 : 1}
            disabled={!canEditMedia || uploadingMedia === 'avatar'}
            onPress={() => canEditMedia && setMediaPickerTarget('avatar')}
            style={[
              styles.avatarWrapper,
              { borderColor: colors.card },
            ]}
          >
            <CoverImage
              uri={displayProfile.avatarUrl}
              style={styles.avatarImg}
              fallbackType="artist"
            />
            {uploadingMedia === 'avatar' && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            {canEditMedia && uploadingMedia !== 'avatar' && (
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Camera size={11} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.identityRightCol}>
            <Text
              style={[styles.userName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {displayProfile.name}
            </Text>
            <Text style={[styles.handleText, { color: colors.primary }]}>
              @{displayProfile.username}
            </Text>
          </View>
        </View>

        {/* Descrição (Bio) */}
        <Text style={[styles.bioText, { color: colors.foreground }]}>
          {displayProfile.bio}
        </Text>

        {/* Redes Conectadas com Símbolos dos Apps */}
        {displayProfile.socials && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.socialsRow}
          >
            {Object.entries(displayProfile.socials).map(([key, url]) => {
              const trimmed = typeof url === 'string' ? url.trim() : '';
              if (!trimmed) return null;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => openSocialLink(key, trimmed)}
                  style={[
                    styles.socialCircleBtn,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityLabel={key}
                  activeOpacity={0.8}
                >
                  <SocialIcon
                    name={key}
                    url={trimmed}
                    size={16}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Card Unificado de Estatísticas com Separador Pipe */}
        <View
          style={[
            styles.unifiedStatsCard,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unifiedStatsScroll}
          >
            {/* Avaliações */}
            <TouchableOpacity
              style={[
                styles.unifiedStatItem,
                historyTab === 'reviews' && {
                  backgroundColor: `${colors.primary}18`,
                  borderRadius: 10,
                },
              ]}
              onPress={() => setHistoryTab('reviews')}
              activeOpacity={0.7}
            >
              <View style={styles.unifiedStatHeader}>
                <Star size={12} color={colors.primary} fill={colors.primary} />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.reviews}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  {
                    color:
                      historyTab === 'reviews'
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}
              >
                Avaliações
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.pipeDivider, { backgroundColor: colors.border }]}
            />

            {/* Média */}
            <View style={styles.unifiedStatItem}>
              <View style={styles.unifiedStatHeader}>
                <Award size={12} color={colors.amber} />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.avgRating}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Média
              </Text>
            </View>

            <View
              style={[styles.pipeDivider, { backgroundColor: colors.border }]}
            />

            {/* Listas */}
            <TouchableOpacity
              style={styles.unifiedStatItem}
              onPress={() =>
                router.push({
                  pathname: '/lists' as any,
                  params: isVisiting
                    ? { username: displayProfile.username }
                    : {},
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.unifiedStatHeader}>
                <ListMusic size={12} color={colors.emerald} />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.lists}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Listas
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.pipeDivider, { backgroundColor: colors.border }]}
            />

            {/* Amigos */}
            <TouchableOpacity
              style={styles.unifiedStatItem}
              onPress={() =>
                router.push({
                  pathname: '/friends' as any,
                  params: isVisiting
                    ? { username: displayProfile.username }
                    : {},
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.unifiedStatHeader}>
                <Users size={12} color="#3b82f6" />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.friends}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Amigos
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.pipeDivider, { backgroundColor: colors.border }]}
            />

            {/* Favoritos */}
            <TouchableOpacity
              style={[
                styles.unifiedStatItem,
                historyTab === 'favorites' && {
                  backgroundColor: `${colors.rose}18`,
                  borderRadius: 10,
                },
              ]}
              onPress={() => setHistoryTab('favorites')}
              activeOpacity={0.7}
            >
              <View style={styles.unifiedStatHeader}>
                <Heart size={12} color={colors.rose} fill={colors.rose} />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.favorites}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  {
                    color:
                      historyTab === 'favorites'
                        ? colors.rose
                        : colors.mutedForeground,
                  },
                ]}
              >
                Favoritos
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.pipeDivider, { backgroundColor: colors.border }]}
            />

            {/* Ídolos */}
            <TouchableOpacity
              style={styles.unifiedStatItem}
              onPress={() =>
                router.push({
                  pathname: '/idols' as any,
                  params: isVisiting
                    ? { username: displayProfile.username }
                    : {},
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.unifiedStatHeader}>
                <User size={12} color="#a855f7" />
                <Text
                  style={[styles.unifiedStatValue, { color: colors.foreground }]}
                >
                  {displayProfile.stats.idols}
                </Text>
              </View>
              <Text
                style={[
                  styles.unifiedStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Ídolos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Abas de Filtro do Feed Completo do Perfil */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyTabsRow}
      >
        {(
          [
            { key: 'all', label: 'Todo o Histórico' },
            { key: 'reviews', label: `Avaliados (${reviews.length})` },
            { key: 'favorites', label: `Favoritados (${favorites.length})` },
          ] as const
        ).map((tab) => {
          const active = historyTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setHistoryTab(tab.key)}
              style={[
                styles.historyTabChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: active ? '#fff' : colors.foreground,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Histórico Completo Carregado Direto no Perfil (idêntico ao Feed) */}
      <View style={styles.feedHistoryContainer}>
        {filteredFeedPosts.slice(0, visibleHistoryCount).map((item) => {
          const isArtistActivity =
            item.activityType === 'follow_idol' ||
            item.activityType === 'superfan';
          const isReviewActivity = (item.activityType || 'review') === 'review';
          const targetRoute = isArtistActivity
            ? `/artist/${item.artistId || ''}`
            : `/album/${item.albumId}`;
          const linkedReviewId = isReviewActivity
            ? item.reviewId || reviews.find((r) => r.albumId === item.albumId)?.id
            : undefined;
          const canShare = Boolean(
            item.activityType !== 'follow_idol' &&
              user &&
              ((item.userId && item.userId === user.id) ||
                (authProfile?.username &&
                  item.friendUsername.toLowerCase() ===
                    authProfile.username.toLowerCase()))
          );

          return (
            <FeedPostCard
              key={item.id}
              item={{
                ...item,
                friendName: displayProfile.name,
                friendUsername: displayProfile.username,
                friendAvatar: displayProfile.avatarUrl,
              }}
              cardMode={cardMode}
              isCommentsOpen={activeCommentPostId === item.id}
              canShare={canShare}
              onPressTarget={() => router.push(targetRoute as any)}
              onToggleLike={() => handleToggleLike(item.id)}
              onPressComment={() => setActiveCommentPostId(item.id)}
              onShare={() =>
                setSharePostItem({
                  ...item,
                  friendName: displayProfile.name,
                  friendUsername: displayProfile.username,
                  friendAvatar: displayProfile.avatarUrl,
                })
              }
              onDelete={
                !isVisiting && linkedReviewId
                  ? () => handleDeleteReview(linkedReviewId, item.albumTitle, item.albumId)
                  : undefined
              }
              isDeleting={Boolean(linkedReviewId && deletingReviewId === linkedReviewId)}
            />
          );
        })}
      </View>

      {/* Modal de escolha de foto (Avatar ou Capa) */}
      <Modal
        visible={mediaPickerTarget !== null}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setMediaPickerTarget(null)}
      >
        <View style={styles.mediaModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMediaPickerTarget(null)}
          />
          <View
            style={[
              styles.mediaModalSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 14 : 22,
              },
            ]}
          >
            <View style={styles.mediaModalHandle} />
            <View style={styles.mediaModalHeader}>
              <Text style={[styles.mediaModalTitle, { color: colors.foreground }]}>
                {mediaPickerTarget === 'avatar'
                  ? 'Alterar foto de avatar'
                  : 'Alterar foto de capa'}
              </Text>
              <TouchableOpacity
                onPress={() => setMediaPickerTarget(null)}
                style={[styles.mediaModalCloseBtn, { backgroundColor: colors.secondary }]}
              >
                <X size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                mediaPickerTarget &&
                handleSelectProfileMedia(mediaPickerTarget, 'library')
              }
              style={[
                styles.mediaOptionRow,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.mediaOptionIcon,
                  { backgroundColor: `${colors.primary}22` },
                ]}
              >
                <ImageIcon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mediaOptionTitle, { color: colors.foreground }]}>
                  Escolher da Galeria
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.mutedForeground }}>
                  Selecione uma imagem salva no seu dispositivo
                </Text>
              </View>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                onPress={() =>
                  mediaPickerTarget &&
                  handleSelectProfileMedia(mediaPickerTarget, 'camera')
                }
                style={[
                  styles.mediaOptionRow,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.mediaOptionIcon,
                    { backgroundColor: `${colors.emerald}22` },
                  ]}
                >
                  <Camera size={18} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mediaOptionTitle, { color: colors.foreground }]}>
                    Tirar Foto com a Câmera
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.mutedForeground }}>
                    Capture uma nova foto agora
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>

    <FeedCommentsModal
      post={activeCommentPost}
      currentUserId={user?.id}
      currentUsername={authProfile?.username}
      currentUserAvatar={authProfile?.avatar_url}
      deletingCommentId={deletingCommentId}
      onClose={() => setActiveCommentPostId(null)}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
    />

    <FeedShareModal
      post={sharePostItem}
      onClose={() => setSharePostItem(null)}
    />
    </View>
  );
}

export default function ProfileScreen() {
  return <ProfileView />;
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 110,
  },
  bannerBox: {
    width: '100%',
    height: 165,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  topHeaderBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 25,
  },
  topRightActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(9,9,11,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    marginTop: -22,
    marginHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: -32,
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 3,
    borderRadius: 999,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 999,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRightCol: {
    flex: 1,
    paddingBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
  },
  handleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 0,
  },
  bioText: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.9,
  },
  socialsRow: {
    gap: 8,
    paddingTop: 0,
  },
  socialCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedStatsCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  unifiedStatsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unifiedStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 70,
    gap: 3,
  },
  unifiedStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unifiedStatValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  unifiedStatLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  pipeDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  historyTabsRow: {
    gap: 8,
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  historyTabChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  historyModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  feedHistoryContainer: {
    gap: 16,
    paddingHorizontal: 14,
  },
  activityItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  activityRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  listIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  activityComment: {
    fontSize: 11.5,
    fontStyle: 'italic',
    marginTop: 2,
    opacity: 0.9,
  },
  deleteIconBtn: {
    padding: 6,
  },
  bannerEditBtn: {
    position: 'absolute',
    right: 14,
    bottom: 30,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(9,9,11,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  bannerEditBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  mediaLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 30,
  },
  mediaLoadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  mediaModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 18,
    gap: 12,
  },
  mediaModalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.4)',
    alignSelf: 'center',
    marginBottom: 2,
  },
  mediaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mediaModalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  mediaModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  mediaOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
});
