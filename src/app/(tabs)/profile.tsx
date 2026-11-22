import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  RefreshControl,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
  Trash2,
  ArrowLeft,
  LogIn,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  pickAndUploadProfileMedia,
  type ImageSourceMode,
  type ProfileMediaKind,
} from '@/services/profileMedia.service';
import {
  type MyReviewRecord,
  type FavoriteAlbumRecord,
  type CatalogArtist,
  type UserListRecord,
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
import { CoverImage } from '@/components/CoverImage';
import { FeedStyleActivityCard } from '@/components/FeedStyleActivityCard';
import { SocialIcon } from '@/components/SocialIcon';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';

type ProfileHistoryTab = 'all' | 'reviews' | 'favorites' | 'idols';

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
  const [historyTab, setHistoryTab] = useState<ProfileHistoryTab>('all');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<ProfileMediaKind | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<ProfileMediaKind | null>(null);

  const [reviews, setReviews] = useState<MyReviewRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAlbumRecord[]>([]);
  const [idols, setIdols] = useState<CatalogArtist[]>([]);
  const [idolsCount, setIdolsCount] = useState(0);
  const [lists, setLists] = useState<UserListRecord[]>([]);

  // Dados consolidados do perfil carregado
  const [customProfile, setCustomProfile] = useState<UnifiedProfileViewData | null>(null);

  // Carrega os dados reais do Supabase
  const loadProfileData = useCallback(async () => {
    try {
      if (isVisiting && visitingUsername) {
        // Carrega dados do perfil visitado no Supabase
        const [dbProfile, stats, userRevs, userFavs, userIdols, userLists] = await Promise.all([
          getProfileByUsername(visitingUsername),
          getProfileStats({ username: visitingUsername }),
          getUserReviews({ username: visitingUsername }),
          getUserFavoriteAlbums({ username: visitingUsername }),
          getUserFollowedArtists({ username: visitingUsername }),
          getUserListsFromSupabase({ username: visitingUsername }),
        ]);

        if (dbProfile) {
          setCustomProfile(mapSupabaseProfileToView(dbProfile, stats));
        } else {
          setCustomProfile(null);
        }
        setReviews(userRevs);
        setFavorites(userFavs);
        setIdols(userIdols);
        setIdolsCount(userIdols.length);
        setLists(userLists);
      } else if (user) {
        // Carrega dados do usuário autenticado no Supabase
        const [stats, userRevs, userFavs, userIdols, userLists] = await Promise.all([
          getProfileStats({ userId: user.id }),
          getUserReviews({ userId: user.id }),
          getUserFavoriteAlbums({ userId: user.id }),
          getUserFollowedArtists({ userId: user.id }),
          getUserListsFromSupabase({ userId: user.id }),
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
        setIdols(userIdols);
        setIdolsCount(userIdols.length);
        setLists(userLists);
      } else {
        setCustomProfile(null);
        setReviews([]);
        setFavorites([]);
        setIdols([]);
        setIdolsCount(0);
        setLists([]);
      }
    } catch (err) {
      console.warn('[ProfileView] Erro ao carregar perfil do Supabase:', err);
    }
  }, [isVisiting, visitingUsername, user, authProfile]);

  useEffect(() => {
    loadProfileData();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      loadProfileData();
    });
    return unsubscribe;
  }, [loadProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadProfileData()]);
    setRefreshing(false);
  };

  const handleDeleteReview = async (id: string) => {
    if (isVisiting) return;
    if (user) {
      await deleteReviewFromSupabase(id, user.id);
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
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
              if (!url) return null;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => Linking.openURL(url).catch(() => {})}
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
                  <SocialIcon name={key} size={15} color={colors.foreground} />
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

            {/* Ídolos */}
            <TouchableOpacity
              style={[
                styles.unifiedStatItem,
                historyTab === 'idols' && {
                  backgroundColor: '#a855f718',
                  borderRadius: 10,
                },
              ]}
              onPress={() => setHistoryTab('idols')}
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
                  {
                    color:
                      historyTab === 'idols'
                        ? '#a855f7'
                        : colors.mutedForeground,
                  },
                ]}
              >
                Ídolos
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
            { key: 'idols', label: `Artistas Seguidos (${idols.length})` },
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

      {/* Histórico Completo Carregado Direto no Perfil */}
      <View style={styles.feedHistoryContainer}>
        {/* 1. Álbuns Avaliados */}
        {(historyTab === 'all' || historyTab === 'reviews') &&
          reviews.map((rev) =>
            cardMode === 'full' ? (
              <FeedStyleActivityCard
                key={`rev-${rev.id}`}
                activityType="review"
                authorName={displayProfile.name}
                authorUsername={displayProfile.username}
                authorAvatar={displayProfile.avatarUrl}
                timeAgo={rev.date}
                title={rev.albumTitle}
                subtitle={rev.artistName}
                coverUrl={rev.coverUrl}
                rating={rev.rating}
                comment={rev.comment}
                onPressTarget={() => router.push(`/album/${rev.albumId}` as any)}
                onDelete={!isVisiting ? () => handleDeleteReview(rev.id) : undefined}
              />
            ) : (
            <View
              key={`rev-${rev.id}`}
              style={[
                styles.activityItemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={styles.activityRowMain}
                onPress={() => router.push(`/album/${rev.albumId}` as any)}
                activeOpacity={0.85}
              >
                <CoverImage uri={rev.coverUrl} albumTitle={rev.albumTitle} albumArtist={rev.artistName} style={styles.activityThumb} quality="medium" />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.activityHeaderLine}>
                    <View
                      style={[
                        styles.typeTag,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                    >
                      <Star
                        size={10}
                        color={colors.primary}
                        fill={colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: colors.primary,
                        }}
                      >
                        Avaliou • {rev.rating}/10
                      </Text>
                    </View>
                    <Text
                      style={{ fontSize: 10, color: colors.mutedForeground }}
                    >
                      {rev.date}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.activityTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {rev.albumTitle}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {rev.artistName}
                  </Text>
                  <Text
                    style={[
                      styles.activityComment,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={2}
                  >
                    {`"${rev.comment}"`}
                  </Text>
                </View>

                {!isVisiting && (
                  <TouchableOpacity
                    onPress={() => handleDeleteReview(rev.id)}
                    style={styles.deleteIconBtn}
                  >
                    <Trash2 size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
            )
          )}

        {/* 2. Álbuns Favoritados */}
        {(historyTab === 'all' || historyTab === 'favorites') &&
          favorites.map((fav) =>
            cardMode === 'full' ? (
              <FeedStyleActivityCard
                key={`fav-${fav.id}`}
                activityType="favorite"
                authorName={displayProfile.name}
                authorUsername={displayProfile.username}
                authorAvatar={displayProfile.avatarUrl}
                title={fav.title}
                subtitle={fav.artist}
                coverUrl={fav.cover}
                rating={fav.rating}
                onPressTarget={() => router.push(`/album/${fav.id}` as any)}
              />
            ) : (
            <TouchableOpacity
              key={`fav-${fav.id}`}
              style={[
                styles.activityItemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/album/${fav.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.activityRowMain}>
                <CoverImage uri={fav.cover} albumTitle={fav.title} albumArtist={fav.artist} style={styles.activityThumb} quality="medium" />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.activityHeaderLine}>
                    <View
                      style={[
                        styles.typeTag,
                        { backgroundColor: `${colors.rose}18` },
                      ]}
                    >
                      <Heart size={10} color={colors.rose} fill={colors.rose} />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: colors.rose,
                        }}
                      >
                        Álbum Favoritado
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: colors.amber,
                      }}
                    >
                      ★ {fav.rating}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.activityTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {fav.title}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {fav.artist}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            )
          )}

        {/* 3. Artistas / Ídolos Seguidos */}
        {(historyTab === 'all' || historyTab === 'idols') &&
          idols.map((artist) =>
            cardMode === 'full' ? (
              <FeedStyleActivityCard
                key={`idol-${artist.id}`}
                activityType="follow_idol"
                authorName={displayProfile.name}
                authorUsername={displayProfile.username}
                authorAvatar={displayProfile.avatarUrl}
                title={artist.name}
                subtitle={artist.genre || 'Artista'}
                coverUrl={artist.imageUrl}
                artistNameForImage={artist.name}
                onPressTarget={() => router.push(`/artist/${artist.id}` as any)}
              />
            ) : (
            <TouchableOpacity
              key={`idol-${artist.id}`}
              style={[
                styles.activityItemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/artist/${artist.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.activityRowMain}>
                <CoverImage
                  uri={artist.imageUrl}
                  artistName={artist.name}
                  style={[styles.activityThumb, { borderRadius: 999 }]}
                  fallbackType="artist"
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.activityHeaderLine}>
                    <View
                      style={[
                        styles.typeTag,
                        { backgroundColor: '#a855f718' },
                      ]}
                    >
                      <Award size={10} color="#a855f7" />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#a855f7',
                        }}
                      >
                        Artista Seguido
                      </Text>
                    </View>
                    <Text
                      style={{ fontSize: 10, color: colors.mutedForeground }}
                    >
                      {artist.nbFans.toLocaleString('pt-BR')} ouvintes
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.activityTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {artist.name}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {artist.genre}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            )
          )}
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
    gap: 10,
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
