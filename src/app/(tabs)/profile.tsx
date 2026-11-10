import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Star,
  Heart,
  Globe,
  Camera,
  Users,
  Award,
  ListMusic,
  Share2,
  Check,
  Settings,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type MyReviewRecord,
  type FavoriteAlbumRecord,
  type CatalogArtist,
  type UserListRecord,
  getUserProfile,
  getMyReviews,
  deleteMyReview,
  getFavoriteAlbums,
  getFollowedArtists,
  getFollowedArtistIds,
  getUserLists,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_PILL_WIDTH = (SCREEN_WIDTH - 76) / 3;

type ProfileHistoryTab = 'all' | 'reviews' | 'favorites' | 'idols' | 'lists';

export function ProfileView({
  visitingUsername,
}: {
  visitingUsername?: string;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isVisiting = Boolean(
    visitingUsername && visitingUsername !== 'anabeat'
  );

  const [copied, setCopied] = useState(false);
  const [historyTab, setHistoryTab] = useState<ProfileHistoryTab>('all');

  const [profile, setProfile] = useState(() => getUserProfile());
  const [reviews, setReviews] = useState<MyReviewRecord[]>(() =>
    getMyReviews()
  );
  const [favorites, setFavorites] = useState<FavoriteAlbumRecord[]>(() =>
    getFavoriteAlbums()
  );
  const [idols, setIdols] = useState<CatalogArtist[]>(() =>
    getFollowedArtists()
  );
  const [idolsCount, setIdolsCount] = useState(
    () => getFollowedArtistIds().length
  );
  const [lists, setLists] = useState<UserListRecord[]>(() => getUserLists());

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setProfile(getUserProfile());
      setReviews(getMyReviews());
      setFavorites(getFavoriteAlbums());
      setIdols(getFollowedArtists());
      setIdolsCount(getFollowedArtistIds().length);
      setLists(getUserLists());
    });
    return unsubscribe;
  }, []);

  const handleDeleteReview = (id: string) => {
    if (isVisiting) return;
    const updated = deleteMyReview(id);
    setReviews(updated);
  };

  const displayProfile = isVisiting
    ? {
        name:
          visitingUsername === 'lucas_snd'
            ? 'Lucas Sound'
            : visitingUsername === 'beatcritic'
              ? 'Beat Critic'
              : `Usuário @${visitingUsername}`,
        username: visitingUsername || 'user',
        email: `${visitingUsername}@musicpostr.com`,
        bio: 'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.',
        avatarUrl:
          visitingUsername === 'lucas_snd'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150'
            : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
        bannerUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=500&auto=format&fit=crop',
        stats: {
          reviews: visitingUsername === 'lucas_snd' ? 34 : 51,
          favorites: 14,
          avgRating: 9.1,
          friends: 38,
          idols: 12,
          lists: 4,
        },
        socials: profile.socials,
      }
    : {
        ...profile,
        stats: {
          reviews: reviews.length,
          favorites: favorites.length,
          avgRating:
            reviews.length > 0
              ? Number(
                  (
                    reviews.reduce((acc, r) => acc + r.rating, 0) /
                    reviews.length
                  ).toFixed(1)
                )
              : 9.2,
          friends: 42,
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

  const socialLabels: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'X / Twitter',
    threads: 'Threads',
    discord: 'Discord',
    lastfm: 'Last.fm',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    website: 'Site',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Foto de Capa com Botão de Configurações no Topo */}
      <View style={styles.bannerBox}>
        <CoverImage
          uri={displayProfile.bannerUrl}
          style={styles.bannerImg}
          quality="high"
        />
        <View style={styles.bannerOverlay} />

        {/* Ações no topo da tela (Engrenagem de Configurações e Compartilhar) */}
        <View
          style={[
            styles.topHeaderBar,
            { top: Math.max(insets.top + 8, 14) },
          ]}
        >
          {isVisiting && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.topCircleBtn}
              accessibilityLabel="Voltar"
              activeOpacity={0.85}
            >
              <ArrowLeft size={18} color="#fff" />
            </TouchableOpacity>
          )}

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
          <View
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
            {!isVisiting && (
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Camera size={11} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

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

        {/* Redes Conectadas */}
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
                    styles.socialPill,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Globe size={11} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    {socialLabels[key] || key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Cards Compactos e Otimizados de Avaliações, Favoritos, Média, Amigos, Ídolos e Listas */}
        <View style={styles.compactStatsGrid}>
          <TouchableOpacity
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor:
                  historyTab === 'reviews'
                    ? `${colors.primary}20`
                    : colors.secondary,
                borderColor:
                  historyTab === 'reviews' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setHistoryTab('reviews')}
          >
            <View style={styles.compactStatHeader}>
              <Star size={12} color={colors.primary} fill={colors.primary} />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.reviews}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Avaliações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor:
                  historyTab === 'favorites'
                    ? `${colors.rose}20`
                    : colors.secondary,
                borderColor:
                  historyTab === 'favorites' ? colors.rose : colors.border,
              },
            ]}
            onPress={() => setHistoryTab('favorites')}
          >
            <View style={styles.compactStatHeader}>
              <Heart size={12} color={colors.rose} fill={colors.rose} />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.favorites}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Favoritos
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.compactStatHeader}>
              <Award size={12} color={colors.amber} />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.avgRating}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Média
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor:
                  historyTab === 'idols' ? '#a855f720' : colors.secondary,
                borderColor:
                  historyTab === 'idols' ? '#a855f7' : colors.border,
              },
            ]}
            onPress={() => setHistoryTab('idols')}
          >
            <View style={styles.compactStatHeader}>
              <User size={12} color="#a855f7" />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.idols}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Ídolos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor:
                  historyTab === 'lists'
                    ? `${colors.emerald}20`
                    : colors.secondary,
                borderColor:
                  historyTab === 'lists' ? colors.emerald : colors.border,
              },
            ]}
            onPress={() => setHistoryTab('lists')}
          >
            <View style={styles.compactStatHeader}>
              <ListMusic size={12} color={colors.emerald} />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.lists}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Listas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.compactStatCard,
              {
                width: STAT_PILL_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/friends' as any,
                params: isVisiting ? { username: displayProfile.username } : {},
              })
            }
          >
            <View style={styles.compactStatHeader}>
              <Users size={12} color="#3b82f6" />
              <Text
                style={[styles.compactStatValue, { color: colors.foreground }]}
              >
                {displayProfile.stats.friends}
              </Text>
            </View>
            <Text
              style={[
                styles.compactStatLabel,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              Amigos
            </Text>
          </TouchableOpacity>
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
            { key: 'lists', label: `Listas (${lists.length})` },
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
          reviews.map((rev) => (
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
                <CoverImage uri={rev.coverUrl} style={styles.activityThumb} />
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
          ))}

        {/* 2. Álbuns Favoritados */}
        {(historyTab === 'all' || historyTab === 'favorites') &&
          favorites.map((fav) => (
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
                <CoverImage uri={fav.cover} style={styles.activityThumb} />
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
          ))}

        {/* 3. Artistas / Ídolos Seguidos */}
        {(historyTab === 'all' || historyTab === 'idols') &&
          idols.map((artist) => (
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
          ))}

        {/* 4. Listas Criadas */}
        {(historyTab === 'all' || historyTab === 'lists') &&
          lists.map((list) => (
            <TouchableOpacity
              key={`list-${list.id}`}
              style={[
                styles.activityItemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/lists' as any,
                  params: isVisiting
                    ? { username: displayProfile.username }
                    : {},
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.activityRowMain}>
                <View
                  style={[
                    styles.listIconBox,
                    { backgroundColor: `${colors.emerald}18` },
                  ]}
                >
                  <ListMusic size={20} color={colors.emerald} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.activityHeaderLine}>
                    <View
                      style={[
                        styles.typeTag,
                        { backgroundColor: `${colors.emerald}18` },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: colors.emerald,
                        }}
                      >
                        Lista Musical • {list.count} álbuns
                      </Text>
                    </View>
                    <Text
                      style={{ fontSize: 10, color: colors.mutedForeground }}
                    >
                      {list.createdAt}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.activityTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {list.title}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {list.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
      </View>
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
    height: 195,
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
    right: 12,
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
    marginTop: -26,
    marginHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: -38,
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 3.5,
    borderRadius: 999,
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 999,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRightCol: {
    flex: 1,
    paddingBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
  },
  handleText: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 1,
  },
  bioText: {
    fontSize: 12.5,
    lineHeight: 18,
    opacity: 0.92,
  },
  socialsRow: {
    gap: 6,
    paddingTop: 2,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  compactStatCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  compactStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactStatValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  compactStatLabel: {
    fontSize: 10,
    fontWeight: '700',
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
});
