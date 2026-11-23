import { CoverImage } from '@/components/CoverImage';
import { PageHeader } from '@/components/PageHeader';
import { FeedStyleActivityCard } from '@/components/FeedStyleActivityCard';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';
import { useAppTheme } from '@/context/ThemeContext';
import { formatRating } from '@/utils/rating';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import { useAuth } from '@/context/AuthContext';
import { subscribeAlbumsUpdated } from '@/services/musicBrainz.service';
import {
  getCommunityReviewsFromSupabase,
  toggleReviewLikeInSupabase,
  type CommunityReviewItem,
} from '@/services/catalog.service';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Award,
  ChevronDown,
  Clock,
  Flame,
  Heart,
  MessageSquare,
  Search,
  Share2,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type CommunityFilter = 'all' | 'recent' | 'top_rated' | 'popular' | 'album_specific';

type CommunityReviewCardItem = CommunityReviewItem;

export default function CommunityReviewsScreen() {
  const params = useLocalSearchParams<{ albumId?: string; search?: string }>();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { mode: cardMode } = useActivityCardMode();

  const [filter, setFilter] = useState<CommunityFilter>('all');
  const [searchTerm, setSearchTerm] = useState(params.search || '');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(params.albumId || null);

  useEffect(() => {
    if (params.albumId) {
      setSelectedAlbumId(params.albumId);
    }
    if (params.search !== undefined) {
      setSearchTerm(params.search);
    }
  }, [params.albumId, params.search]);
  const [visibleCount, setVisibleCount] = useState(10);

  const [allReviews, setAllReviews] = useState<CommunityReviewCardItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getCommunityReviewsFromSupabase(user?.id);
      if (active) setAllReviews(data);
    };
    load();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    setVisibleCount(10);
  }, [filter, searchTerm, selectedAlbumId]);

  const handleToggleLike = async (reviewId: string) => {
    const target = allReviews.find((item) => item.id === reviewId);
    if (!target) return;
    const prevLiked = target.isLiked;

    setAllReviews((prev) =>
      prev.map((item) =>
        item.id === reviewId
          ? {
              ...item,
              isLiked: !prevLiked,
              likesCount: Math.max(0, prevLiked ? item.likesCount - 1 : item.likesCount + 1),
            }
          : item
      )
    );

    if (user) {
      await toggleReviewLikeInSupabase(reviewId, user.id, prevLiked);
    }
  };

  const handleShareReview = async (review: CommunityReviewCardItem) => {
    try {
      await Share.share({
        title: `Review de ${review.userName}`,
        message: `Veja a review de ${review.userName} para o álbum "${review.albumTitle}" (${review.artistName}) no Musicpostr: Nota ${review.rating}/10! "${review.comment}"`,
      });
    } catch {
      // ignore
    }
  };

  // Filtragem de Reviews
  const filteredReviews = allReviews.filter((item) => {
    // Filtro por álbum específico selecionado
    if (selectedAlbumId && item.albumId !== selectedAlbumId) {
      return false;
    }

    // Busca textual por álbum, artista, usuário ou comentário
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchAlbum = item.albumTitle.toLowerCase().includes(term);
      const matchArtist = item.artistName.toLowerCase().includes(term);
      const matchUser =
        item.userName.toLowerCase().includes(term) ||
        item.username.toLowerCase().includes(term);
      const matchComment = item.comment.toLowerCase().includes(term);
      if (!matchAlbum && !matchArtist && !matchUser && !matchComment) {
        return false;
      }
    }

    // Filtros de comunidade
    if (filter === 'top_rated') {
      return item.rating >= 8.5;
    }
    if (filter === 'popular') {
      return item.likesCount >= 6;
    }
    return true;
  });

  const displayedReviews = filteredReviews.slice(0, visibleCount);

  // Lista dos álbuns que possuem reviews na comunidade para busca rápida por álbum
  const albumsWithReviews = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string; cover: string; count: number }>();
    for (const r of allReviews) {
      if (!r.albumId) continue;
      const existing = map.get(r.albumId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(r.albumId, {
          id: r.albumId,
          title: r.albumTitle,
          cover: r.albumCover,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [allReviews]);

  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getCommunityReviewsFromSupabase(user?.id);
      setAllReviews(data);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (allReviews.length > 0) {
      setIsInitialLoading(false);
    }
  }, [allReviews.length]);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading && allReviews.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onScroll={(e) => {
        if (visibleCount < filteredReviews.length && isNearScrollBottom(e)) {
          setVisibleCount((prev) =>
            Math.min(filteredReviews.length, prev + INFINITE_PAGE_SIZE)
          );
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
      {/* Título Principal da Página */}
      <PageHeader title="Comunidades" />
      {/* 1. Barra de Busca de Reviews e Álbuns */}
      <View style={styles.topSearchContainer}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            placeholder="Buscar review por álbum, artista ou usuário..."
            placeholderTextColor={colors.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

      </View>

      {/* 2. Filtros da Comunidade */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollRow}
      >
        <TouchableOpacity
          onPress={() => {
            setFilter('all');
            setSelectedAlbumId(null);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === 'all' && !selectedAlbumId
                  ? colors.primary
                  : colors.card,
              borderColor:
                filter === 'all' && !selectedAlbumId
                  ? colors.primary
                  : colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Sparkles
            size={13}
            color={filter === 'all' && !selectedAlbumId ? '#fff' : colors.mutedForeground}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filter === 'all' && !selectedAlbumId
                    ? '#fff'
                    : colors.foreground,
              },
            ]}
          >
            Todas as reviews
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setFilter('recent');
            setSelectedAlbumId(null);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === 'recent' && !selectedAlbumId
                  ? colors.primary
                  : colors.card,
              borderColor:
                filter === 'recent' && !selectedAlbumId
                  ? colors.primary
                  : colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Clock
            size={13}
            color={
              filter === 'recent' && !selectedAlbumId
                ? '#fff'
                : colors.mutedForeground
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filter === 'recent' && !selectedAlbumId
                    ? '#fff'
                    : colors.foreground,
              },
            ]}
          >
            Últimas postadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setFilter('top_rated');
            setSelectedAlbumId(null);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === 'top_rated' && !selectedAlbumId
                  ? colors.primary
                  : colors.card,
              borderColor:
                filter === 'top_rated' && !selectedAlbumId
                  ? colors.primary
                  : colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Award
            size={13}
            color={
              filter === 'top_rated' && !selectedAlbumId
                ? '#fff'
                : colors.mutedForeground
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filter === 'top_rated' && !selectedAlbumId
                    ? '#fff'
                    : colors.foreground,
              },
            ]}
          >
            Melhores notas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setFilter('popular');
            setSelectedAlbumId(null);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === 'popular' && !selectedAlbumId
                  ? colors.primary
                  : colors.card,
              borderColor:
                filter === 'popular' && !selectedAlbumId
                  ? colors.primary
                  : colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Flame
            size={13}
            color={
              filter === 'popular' && !selectedAlbumId
                ? '#fff'
                : colors.mutedForeground
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  filter === 'popular' && !selectedAlbumId
                    ? '#fff'
                    : colors.foreground,
              },
            ]}
          >
            Mais curtidas
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 3. Comunidade de álbuns (grupos dedicados por álbum) */}
      <View style={styles.albumFilterSection}>
        <View style={styles.sectionHeaderRow}>
          <Users size={16} color={colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            Comunidade de álbuns
          </Text>
          {Boolean(selectedAlbumId) && (
            <TouchableOpacity
              onPress={() => setSelectedAlbumId(null)}
              style={styles.clearAlbumFilterBtn}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                Todas as comunidades
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {albumsWithReviews.map((alb) => {
            const isSelected = selectedAlbumId === alb.id;
            return (
              <TouchableOpacity
                key={alb.id}
                onPress={() =>
                  setSelectedAlbumId(isSelected ? null : alb.id)
                }
                style={[
                  styles.albumFilterChip,
                  {
                    backgroundColor: isSelected
                      ? `${colors.primary}18`
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <CoverImage
                  uri={alb.cover}
                  style={styles.albumFilterCover}
                  quality="low"
                />
                <View style={{ flexShrink: 1 }}>
                  <Text
                    style={[
                      styles.albumFilterTitle,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {alb.title}
                  </Text>
                  <Text style={[styles.albumFilterMeta, { color: colors.mutedForeground }]}>
                    {alb.count} {alb.count === 1 ? 'membro ativo' : 'membros ativos'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Lista de Reviews da Comunidade */}
      <View style={styles.reviewsListContainer}>
        <View style={styles.sectionHeaderRow}>
          <MessageSquare size={16} color={colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {selectedAlbumId
              ? 'Reviews deste álbum'
              : filter === 'recent'
                ? 'Últimos reviews postados'
                : filter === 'top_rated'
                  ? 'Reviews com as maiores notas'
                  : filter === 'popular'
                    ? 'Reviews mais curtidas'
                    : 'Reviews da Comunidade'}{' '}
            ({filteredReviews.length})
          </Text>
        </View>

        {filteredReviews.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MessageSquare size={38} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {selectedAlbumId
                ? 'Esta comunidade ainda está vazia. Ela será criada assim que alguém publicar o primeiro comentário sobre este álbum.'
                : 'Nenhuma review encontrada com os filtros selecionados.'}
            </Text>
          </View>
        ) : (
          <>
            {displayedReviews.map((review) =>
              cardMode === 'full' ? (
                <FeedStyleActivityCard
                  key={review.id}
                  activityType="review"
                  authorName={review.userName}
                  authorUsername={review.username}
                  authorAvatar={review.userAvatar}
                  timeAgo={review.timeAgo}
                  title={review.albumTitle}
                  subtitle={review.artistName}
                  coverUrl={review.albumCover}
                  rating={review.rating}
                  comment={review.comment}
                  onPressTarget={() => router.push(`/album/${review.albumId}` as any)}
                  onPressAuthor={() => router.push(`/user/${review.username}` as any)}
                  likesCount={review.likesCount}
                  isLiked={review.isLiked}
                  onToggleLike={() => handleToggleLike(review.id)}
                  commentsCount={review.commentsCount}
                  onPressComment={() => router.push(`/album/${review.albumId}` as any)}
                  onShare={() => handleShareReview(review)}
                />
              ) : (
              <View
                key={review.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Topo do Card: Usuário + Data + Nota */}
                <View style={styles.reviewCardHeader}>
                  <TouchableOpacity
                    style={styles.userInfoRow}
                    onPress={() => router.push(`/user/${review.username}` as any)}
                    activeOpacity={0.8}
                  >
                    <CoverImage
                      uri={review.userAvatar}
                      style={styles.userAvatar}
                      fallbackType="artist"
                      quality="low"
                    />
                    <View>
                      <Text
                        style={[styles.userNameText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {review.userName}
                      </Text>
                      <View style={styles.timeRow}>
                        <Clock size={10} color={colors.mutedForeground} />
                        <Text
                          style={[styles.timeAgoText, { color: colors.mutedForeground }]}
                        >
                          {review.timeAgo}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Badge de Nota */}
                  <View
                    style={[
                      styles.ratingBadge,
                      {
                        backgroundColor:
                          review.rating >= 8
                            ? 'rgba(16, 185, 129, 0.16)'
                            : review.rating >= 6
                              ? 'rgba(234, 179, 8, 0.16)'
                              : 'rgba(239, 68, 68, 0.16)',
                        borderColor:
                          review.rating >= 8
                            ? 'rgba(16, 185, 129, 0.35)'
                            : review.rating >= 6
                              ? 'rgba(234, 179, 8, 0.35)'
                              : 'rgba(239, 68, 68, 0.35)',
                      },
                    ]}
                  >
                    <Star
                      size={12}
                      color={
                        review.rating >= 8
                          ? '#10b981'
                          : review.rating >= 6
                            ? '#eab308'
                            : '#ef4444'
                      }
                      fill={
                        review.rating >= 8
                          ? '#10b981'
                          : review.rating >= 6
                            ? '#eab308'
                            : '#ef4444'
                      }
                    />
                    <Text
                      style={[
                        styles.ratingBadgeText,
                        {
                          color:
                            review.rating >= 8
                              ? '#10b981'
                              : review.rating >= 6
                                ? '#eab308'
                                : '#ef4444',
                        },
                      ]}
                    >
                      {formatRating(review.rating)}/10
                    </Text>
                  </View>
                </View>

                {/* Corpo da Review: Comentário do Usuário */}
                <Text
                  style={[styles.reviewCommentText, { color: colors.foreground }]}
                >
                  {review.comment}
                </Text>

                {/* Anexo do Álbum Avaliado */}
                <TouchableOpacity
                  style={[
                    styles.albumAttachmentRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(39, 39, 42, 0.45)'
                        : colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/album/${review.albumId}` as any)}
                  activeOpacity={0.85}
                >
                  <CoverImage
                    uri={review.albumCover}
                    style={styles.albumAttachmentCover}
                    quality="low"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[styles.albumAttachmentTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {review.albumTitle}
                    </Text>
                    <Text
                      style={[
                        styles.albumAttachmentArtist,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {review.artistName}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                    Ver álbum →
                  </Text>
                </TouchableOpacity>

                {/* Rodapé de Ações: Curtir e Compartilhar */}
                <View style={styles.cardActionsFooter}>
                  <TouchableOpacity
                    onPress={() => handleToggleLike(review.id)}
                    style={styles.actionBtn}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={16}
                      color={review.isLiked ? colors.rose : colors.mutedForeground}
                      fill={review.isLiked ? colors.rose : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        {
                          color: review.isLiked ? colors.rose : colors.mutedForeground,
                        },
                      ]}
                    >
                      {review.likesCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareReview(review)}
                    style={[styles.actionBtn, { marginLeft: 'auto' }]}
                    accessibilityLabel="Compartilhar avaliação"
                    activeOpacity={0.7}
                  >
                    <Share2 size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
              )
            )}

            {/* Botão de carregar mais 10 publicações */}
            {visibleCount < filteredReviews.length && (
              <TouchableOpacity
                onPress={() => setVisibleCount((prev) => prev + 10)}
                style={[
                  styles.loadMoreBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '800',
                    color: colors.foreground,
                  }}
                >
                  Carregar mais avaliações (+10)
                </Text>
                <ChevronDown size={16} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 110,
    gap: 16,
  },
  pageHeaderBlock: {
    paddingVertical: 2,
    marginBottom: -4,
  },
  mainPageTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  topSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filtersScrollRow: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  albumFilterSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  clearAlbumFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  albumFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    paddingRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 190,
  },
  albumFilterCover: {
    width: 32,
    height: 32,
    borderRadius: 7,
  },
  albumFilterTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  albumFilterMeta: {
    fontSize: 10.5,
  },
  reviewsListContainer: {
    gap: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  reviewCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userNameText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeAgoText: {
    fontSize: 11,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  ratingBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  reviewCommentText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  albumAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  albumAttachmentCover: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  albumAttachmentTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  albumAttachmentArtist: {
    fontSize: 11,
  },
  cardActionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
});
