import { CoverImage } from '@/components/CoverImage';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogAlbum,
  type FeedPostItem,
  getCommunityFeedPosts,
  getInternalAlbumsStore,
  saveCommunityFeedPosts,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { router } from 'expo-router';
import {
  Award,
  ChevronDown,
  Clock,
  Flame,
  Heart,
  MessageSquare,
  Plus,
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
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type CommunityFilter = 'all' | 'recent' | 'top_rated' | 'popular' | 'album_specific';

interface CommunityReviewCardItem {
  id: string;
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

export default function CommunityReviewsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<CommunityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCommunityAlbum, setNewCommunityAlbum] = useState('');
  const [newCommunityTopic, setNewCommunityTopic] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState(false);

  const [feedPosts, setFeedPosts] = useState<FeedPostItem[]>(() =>
    getCommunityFeedPosts()
  );
  const [albumsCatalog, setAlbumsCatalog] = useState<CatalogAlbum[]>(() =>
    getInternalAlbumsStore()
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFeedPosts(getCommunityFeedPosts());
      setAlbumsCatalog(getInternalAlbumsStore());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setVisibleCount(10);
  }, [filter, searchTerm, selectedAlbumId]);

  // Coleta e normalização de todas as reviews da comunidade
  const allReviews: CommunityReviewCardItem[] = React.useMemo(() => {
    const list: CommunityReviewCardItem[] = [];
    const seenIds = new Set<string>();

    // 1. Reviews do Feed Geral
    const reviewFeedPosts = feedPosts.filter(
      (p) => !p.activityType || p.activityType === 'review'
    );
    for (const post of reviewFeedPosts) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        list.push({
          id: post.id,
          userName: post.friendName || 'Usuário da Comunidade',
          username: post.friendUsername || 'user',
          userAvatar:
            post.friendAvatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
          albumTitle: post.albumTitle,
          artistName: post.artistName,
          albumCover: post.albumCover,
          albumId: post.albumId,
          rating: post.rating,
          comment: post.comment,
          timeAgo: post.timeAgo || 'Recente',
          likesCount: post.likesCount || 0,
          isLiked: Boolean(post.isLiked),
          commentsCount: post.comments?.length || 0,
        });
      }
    }

    // 2. Reviews internas anexadas a álbuns no catálogo
    for (const alb of albumsCatalog) {
      if (alb.reviews && alb.reviews.length > 0) {
        for (const rev of alb.reviews) {
          const revId = `alb-rev-${alb.id}-${rev.id}`;
          if (!seenIds.has(revId)) {
            seenIds.add(revId);
            list.push({
              id: revId,
              userName: rev.user || 'Crítico Musical',
              username: rev.username || rev.user.toLowerCase().replace(/\s+/g, '_'),
              userAvatar:
                rev.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=150',
              albumTitle: alb.title,
              artistName: alb.artist.name,
              albumCover: alb.cover_medium || alb.cover_big,
              albumId: alb.id,
              rating: rev.rating,
              comment: rev.comment,
              timeAgo: rev.date || 'Há alguns dias',
              likesCount: rev.likes || 4,
              isLiked: Boolean(rev.likedByMe),
              commentsCount: 0,
            });
          }
        }
      }
    }

    return list;
  }, [feedPosts, albumsCatalog]);

  const handleToggleLike = (reviewId: string) => {
    // Atualiza feedPosts se existir lá
    const updatedFeed = feedPosts.map((item) => {
      if (item.id === reviewId) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
        };
      }
      return item;
    });
    setFeedPosts(updatedFeed);
    saveCommunityFeedPosts(updatedFeed);
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

  const handleCreateCommunity = () => {
    if (!newCommunityAlbum.trim()) return;
    setCreateSuccessMsg(true);
    setTimeout(() => {
      setCreateSuccessMsg(false);
      setIsCreateModalOpen(false);
      setNewCommunityAlbum('');
      setNewCommunityTopic('');
    }, 1500);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Título Principal da Página */}
      <View style={styles.pageHeaderBlock}>
        <Text style={[styles.mainPageTitle, { color: colors.foreground }]}>
          Comunidades
        </Text>
      </View>
      {/* 1. Barra de Busca de Reviews e Álbuns + Botão de Criar Comunidade */}
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

        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={[
            styles.createCommunityBtn,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.85}
          accessibilityLabel="Criar uma comunidade"
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
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
              Nenhuma review encontrada com os filtros selecionados.
            </Text>
          </View>
        ) : (
          <>
            {displayedReviews.map((review) => (
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
                      {review.rating.toFixed(1)}/10
                    </Text>
                  </View>
                </View>

                {/* Corpo da Review: Comentário do Usuário */}
                <Text
                  style={[styles.reviewCommentText, { color: colors.foreground }]}
                >
                  {`"${review.comment}"`}
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
                    style={styles.actionBtn}
                    activeOpacity={0.7}
                  >
                    <Share2 size={16} color={colors.mutedForeground} />
                    <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>
                      Compartilhar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

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

      {/* Modal para Criar uma Comunidade */}
      <Modal
        visible={isCreateModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Users size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: colors.foreground,
                  }}
                >
                  Criar uma comunidade
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
              Crie um espaço de debate dedicado aos fãs de um álbum específico para conversas, curiosidades e análises de faixas.
            </Text>

            {createSuccessMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  🎉 Comunidade criada com sucesso!
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  placeholder="Nome do álbum (ex: HIT ME HARD AND SOFT)"
                  placeholderTextColor={colors.mutedForeground}
                  value={newCommunityAlbum}
                  onChangeText={setNewCommunityAlbum}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />

                <TextInput
                  multiline
                  placeholder="Tópico de discussão inicial ou descrição da comunidade..."
                  placeholderTextColor={colors.mutedForeground}
                  value={newCommunityTopic}
                  onChangeText={setNewCommunityTopic}
                  style={[
                    styles.modalTextarea,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={handleCreateCommunity}
                  style={[
                    styles.createSubmitBtn,
                    {
                      backgroundColor: newCommunityAlbum.trim()
                        ? colors.primary
                        : colors.muted,
                    },
                  ]}
                  disabled={!newCommunityAlbum.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                    Criar Comunidade do Álbum
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  createCommunityBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  modalTextarea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  createSubmitBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  successBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
  },
  successText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 13,
  },
});
