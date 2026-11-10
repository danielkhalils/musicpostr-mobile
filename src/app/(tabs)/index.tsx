import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Star,
  Heart,
  MessageSquare,
  Send,
  Disc,
  Sparkles,
  Award,
  UserCheck,
  Share2,
  Bookmark,
  ChevronRight,
  Clock,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type FeedPostItem,
  getCommunityFeedPosts,
  saveCommunityFeedPosts,
  getUserProfile,
  subscribeAlbumsUpdated,
  consumeTimelineIntroOnce,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();

  const [feedItems, setFeedItems] = useState<FeedPostItem[]>(() =>
    getCommunityFeedPosts()
  );
  const [userProfile, setUserProfile] = useState(() => getUserProfile());
  const [showTimelineIntro, setShowTimelineIntro] = useState<boolean>(() =>
    consumeTimelineIntroOnce()
  );
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [activeCommentSection, setActiveCommentSection] = useState<{
    [key: string]: boolean;
  }>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFeedItems(getCommunityFeedPosts());
      setUserProfile(getUserProfile());
      if (consumeTimelineIntroOnce()) {
        setShowTimelineIntro(true);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!showTimelineIntro) return;
    const timer = setTimeout(() => {
      setShowTimelineIntro(false);
    }, 6500);
    return () => clearTimeout(timer);
  }, [showTimelineIntro]);

  const handleToggleLike = (id: string) => {
    setFeedItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked
              ? item.likesCount - 1
              : item.likesCount + 1,
          };
        }
        return item;
      });
      saveCommunityFeedPosts(next);
      return next;
    });
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSharePost = async (item: FeedPostItem) => {
    try {
      const actionDesc =
        item.activityType === 'follow_idol'
          ? `passou a seguir ${item.albumTitle}`
          : item.activityType === 'favorite'
            ? `favoritou o álbum "${item.albumTitle}" de ${item.artistName}`
            : `avaliou "${item.albumTitle}" de ${item.artistName} com nota ${item.rating}/10`;

      await Share.share({
        title: `Publicação de ${item.friendName} no Musicpostr`,
        message: `${item.friendName} (@${item.friendUsername}) ${actionDesc} no Musicpostr:\n"${item.comment}"`,
      });
    } catch {
      // ignore
    }
  };

  const handleToggleCommentSection = (id: string) => {
    setActiveCommentSection((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;

    const profile = getUserProfile();

    setFeedItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const newComment = {
            id: Date.now().toString(),
            author: profile.name,
            avatar: profile.avatarUrl,
            text,
            time: 'Agora mesmo',
          };
          return {
            ...item,
            comments: [...item.comments, newComment],
          };
        }
        return item;
      });
      saveCommunityFeedPosts(next);
      return next;
    });

    setCommentInputs((prev) => ({ ...prev, [id]: '' }));
    setActiveCommentSection((prev) => ({ ...prev, [id]: true }));
  };

  const getActivityActionText = (item: FeedPostItem) => {
    const type = item.activityType || 'review';
    if (type === 'favorite') return 'favoritou um álbum';
    if (type === 'follow_idol') return 'seguiu um novo ídolo';
    return 'publicou uma avaliação';
  };

  const renderActivityBadge = (item: FeedPostItem) => {
    const type = item.activityType || 'review';
    if (type === 'favorite') {
      return (
        <View
          style={[
            styles.activityTypeBadge,
            {
              backgroundColor: `${colors.rose}16`,
              borderColor: `${colors.rose}38`,
            },
          ]}
        >
          <Heart size={11} color={colors.rose} fill={colors.rose} />
          <Text
            style={[
              styles.activityTypeBadgeText,
              { color: colors.rose },
            ]}
          >
            Favoritado
          </Text>
        </View>
      );
    }

    if (type === 'follow_idol') {
      return (
        <View
          style={[
            styles.activityTypeBadge,
            {
              backgroundColor: '#a855f716',
              borderColor: '#a855f738',
            },
          ]}
        >
          <UserCheck size={11} color="#a855f7" />
          <Text
            style={[
              styles.activityTypeBadgeText,
              { color: '#a855f7' },
            ]}
          >
            Novo Ídolo
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.activityTypeBadge,
          {
            backgroundColor: `${colors.primary}16`,
            borderColor: `${colors.primary}38`,
          },
        ]}
      >
        <Star size={11} color={colors.primary} fill={colors.primary} />
        <Text
          style={[
            styles.activityTypeBadgeText,
            { color: colors.primary },
          ]}
        >
          Review
        </Text>
      </View>
    );
  };

  const renderStarRatingBar = (rating: number) => {
    const filledStars = Math.round(rating / 2);
    return (
      <View style={styles.starsInlineRow}>
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFilled = starIdx <= filledStars;
          return (
            <Star
              key={starIdx}
              size={11}
              color={isFilled ? colors.amber : colors.mutedForeground}
              fill={isFilled ? colors.amber : 'transparent'}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Sessão "Timeline de Atividades" - exibida apenas uma vez quando o usuário se cadastra e depois some */}
      {showTimelineIntro && (
        <View
          style={[
            styles.headerBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: `${colors.primary}18`,
                  borderColor: `${colors.primary}35`,
                },
              ]}
            >
              <Sparkles size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                Timeline de Atividades
              </Text>
              <Text
                style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
              >
                Veja álbuns favoritados, notas compartilhadas por amigos e por
                você, ídolos seguidos, curta e comente!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTimelineIntro(false)}
              style={styles.dismissIntroBtn}
              accessibilityLabel="Fechar boas-vindas"
            >
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {feedItems.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Disc size={44} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            Nenhuma atividade encontrada. Avalie ou favorite álbuns para
            movimentar sua timeline!
          </Text>
        </View>
      ) : (
        <View style={styles.feedList}>
          {feedItems.map((item) => {
            const isIdolActivity = item.activityType === 'follow_idol';
            const isFavoriteActivity = item.activityType === 'favorite';
            const isBookmarked = Boolean(bookmarkedPosts[item.id]);
            const isCommentsOpen = Boolean(activeCommentSection[item.id]);
            const targetRoute = isIdolActivity
              ? `/artist/${item.artistId || ''}`
              : `/album/${item.albumId}`;
            const authorRoute =
              item.friendUsername === 'anabeat'
                ? '/(tabs)/profile'
                : `/user/${item.friendUsername}`;

            return (
              <View
                key={item.id}
                style={[
                  styles.postCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowOpacity: isDark ? 0.35 : 0.06,
                  },
                ]}
              >
                {/* 1. CABEÇALHO DO POST (Autor + Ação + Tempo + Badge) */}
                <View style={styles.postHeader}>
                  <TouchableOpacity
                    style={styles.authorTouchArea}
                    onPress={() => router.push(authorRoute as any)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.avatarRing,
                        { borderColor: `${colors.primary}55` },
                      ]}
                    >
                      <CoverImage
                        uri={item.friendAvatar}
                        style={styles.authorAvatar}
                        fallbackType="artist"
                      />
                    </View>

                    <View style={styles.authorInfoCol}>
                      <View style={styles.authorNameLine}>
                        <Text
                          style={[
                            styles.authorName,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {item.friendName}
                        </Text>
                        <Text
                          style={[
                            styles.authorHandle,
                            { color: colors.primary },
                          ]}
                          numberOfLines={1}
                        >
                          @{item.friendUsername}
                        </Text>
                      </View>

                      <View style={styles.authorSubLine}>
                        <Text
                          style={[
                            styles.authorActionLabel,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          {getActivityActionText(item)}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
                          •
                        </Text>
                        <View style={styles.timeLine}>
                          <Clock size={10} color={colors.mutedForeground} />
                          <Text
                            style={[
                              styles.timeText,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {item.timeAgo}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {renderActivityBadge(item)}
                </View>

                {/* 2. TEXTO / PUBLICAÇÃO DO USUÁRIO (Caption de Rede Social) */}
                {Boolean(item.comment) && (
                  <View style={styles.captionContainer}>
                    <Text
                      style={[
                        styles.captionText,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.comment}
                    </Text>
                  </View>
                )}

                {/* 3. CARD DE MÍDIA DESTACADO (Álbum Avaliado / Favoritado / Ídolo) */}
                <TouchableOpacity
                  style={[
                    styles.mediaAttachmentCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(39, 39, 42, 0.55)'
                        : colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(targetRoute as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.mediaCoverWrapper}>
                    <CoverImage
                      uri={item.albumCover}
                      style={[
                        styles.mediaCover,
                        isIdolActivity && { borderRadius: 999 },
                      ]}
                      fallbackType={isIdolActivity ? 'artist' : 'album'}
                    />
                  </View>

                  <View style={styles.mediaDetailsCol}>
                    <View style={styles.mediaTopMetaRow}>
                      <View
                        style={[
                          styles.mediaTypeTag,
                          {
                            backgroundColor: isIdolActivity
                              ? '#a855f720'
                              : `${colors.primary}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.mediaTypeTagText,
                            {
                              color: isIdolActivity
                                ? '#a855f7'
                                : colors.primary,
                            },
                          ]}
                        >
                          {isIdolActivity ? 'ARTISTA / ÍDOLO' : 'ÁLBUM MUSICAL'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.mediaTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.albumTitle}
                    </Text>

                    <Text
                      style={[
                        styles.mediaSubtitle,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.artistName}
                    </Text>

                    {/* Rodapé do Card de Mídia: Nota + Estrelas ou Status + Link */}
                    <View style={styles.mediaBottomRow}>
                      {isIdolActivity ? (
                        <View style={styles.mediaStatusPill}>
                          <Award size={13} color="#a855f7" />
                          <Text
                            style={{
                              fontSize: 11.5,
                              fontWeight: '800',
                              color: '#a855f7',
                            }}
                          >
                            Seguindo na Comunidade
                          </Text>
                        </View>
                      ) : isFavoriteActivity ? (
                        <View style={styles.mediaStatusPill}>
                          <Heart
                            size={12}
                            color={colors.rose}
                            fill={colors.rose}
                          />
                          <Text
                            style={{
                              fontSize: 11.5,
                              fontWeight: '800',
                              color: colors.rose,
                            }}
                          >
                            Salvo nos Favoritos • ★ {item.rating.toFixed(1)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.ratingScoreContainer}>
                          <View
                            style={[
                              styles.scoreHighlightBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text style={styles.scoreHighlightNumber}>
                              {item.rating.toFixed(1)}
                            </Text>
                            <Text style={styles.scoreHighlightMax}>/10</Text>
                          </View>
                          {renderStarRatingBar(item.rating)}
                        </View>
                      )}

                      <View style={styles.mediaActionHint}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: colors.mutedForeground,
                          }}
                        >
                          Ver
                        </Text>
                        <ChevronRight size={13} color={colors.mutedForeground} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 4. BARRA DE INTERAÇÃO DE REDE SOCIAL (Curtir, Comentar, Compartilhar, Salvar) */}
                <View
                  style={[
                    styles.socialActionBar,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.socialActionsLeft}>
                    {/* Botão Curtir */}
                    <TouchableOpacity
                      style={[
                        styles.socialActionPill,
                        {
                          backgroundColor: item.isLiked
                            ? `${colors.rose}16`
                            : colors.secondary,
                          borderColor: item.isLiked
                            ? `${colors.rose}40`
                            : colors.border,
                        },
                      ]}
                      onPress={() => handleToggleLike(item.id)}
                      activeOpacity={0.8}
                    >
                      <Heart
                        size={15}
                        color={
                          item.isLiked ? colors.rose : colors.mutedForeground
                        }
                        fill={item.isLiked ? colors.rose : 'transparent'}
                      />
                      <Text
                        style={[
                          styles.socialActionText,
                          {
                            color: item.isLiked
                              ? colors.rose
                              : colors.foreground,
                          },
                        ]}
                      >
                        {item.likesCount}
                      </Text>
                    </TouchableOpacity>

                    {/* Botão Comentar */}
                    <TouchableOpacity
                      style={[
                        styles.socialActionPill,
                        {
                          backgroundColor: isCommentsOpen
                            ? `${colors.primary}16`
                            : colors.secondary,
                          borderColor: isCommentsOpen
                            ? `${colors.primary}40`
                            : colors.border,
                        },
                      ]}
                      onPress={() => handleToggleCommentSection(item.id)}
                      activeOpacity={0.8}
                    >
                      <MessageSquare
                        size={15}
                        color={
                          isCommentsOpen
                            ? colors.primary
                            : colors.mutedForeground
                        }
                      />
                      <Text
                        style={[
                          styles.socialActionText,
                          {
                            color: isCommentsOpen
                              ? colors.primary
                              : colors.foreground,
                          },
                        ]}
                      >
                        {item.comments.length}
                      </Text>
                    </TouchableOpacity>

                    {/* Botão Compartilhar */}
                    <TouchableOpacity
                      style={[
                        styles.socialActionPill,
                        {
                          backgroundColor: colors.secondary,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleSharePost(item)}
                      activeOpacity={0.8}
                    >
                      <Share2 size={14} color={colors.mutedForeground} />
                      <Text
                        style={[
                          styles.socialActionText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Compartilhar
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botão Salvar / Bookmark */}
                  <TouchableOpacity
                    style={[
                      styles.bookmarkBtn,
                      {
                        backgroundColor: isBookmarked
                          ? `${colors.amber}18`
                          : colors.secondary,
                        borderColor: isBookmarked
                          ? `${colors.amber}45`
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleToggleBookmark(item.id)}
                    accessibilityLabel="Salvar publicação"
                    activeOpacity={0.8}
                  >
                    <Bookmark
                      size={15}
                      color={
                        isBookmarked ? colors.amber : colors.mutedForeground
                      }
                      fill={isBookmarked ? colors.amber : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {/* 5. PRÉVIA DO ÚLTIMO COMENTÁRIO (quando fechado) */}
                {!isCommentsOpen && item.comments.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.commentPreviewBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(39, 39, 42, 0.35)'
                          : colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleToggleCommentSection(item.id)}
                    activeOpacity={0.8}
                  >
                    <CoverImage
                      uri={item.comments[item.comments.length - 1].avatar}
                      style={styles.commentPreviewAvatar}
                      fallbackType="artist"
                    />
                    <Text
                      style={[
                        styles.commentPreviewText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      <Text
                        style={{
                          fontWeight: '800',
                          color: colors.foreground,
                        }}
                      >
                        {item.comments[item.comments.length - 1].author}:{' '}
                      </Text>
                      {item.comments[item.comments.length - 1].text}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 6. SEÇÃO EXPANDIDA DE COMENTÁRIOS */}
                {isCommentsOpen && (
                  <View
                    style={[
                      styles.commentsSection,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    {item.comments.length === 0 ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.mutedForeground,
                          textAlign: 'center',
                          paddingVertical: 6,
                        }}
                      >
                        Seja o primeiro a comentar nesta publicação!
                      </Text>
                    ) : (
                      item.comments.map((comment) => (
                        <View
                          key={comment.id}
                          style={[
                            styles.commentItem,
                            {
                              backgroundColor: colors.secondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <CoverImage
                            uri={comment.avatar}
                            style={styles.commentAvatar}
                            fallbackType="artist"
                          />
                          <View style={{ flex: 1 }}>
                            <View style={styles.commentHeader}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '800',
                                  color: colors.foreground,
                                }}
                              >
                                {comment.author}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: colors.mutedForeground,
                                }}
                              >
                                {comment.time}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.foreground,
                                opacity: 0.9,
                                marginTop: 3,
                                lineHeight: 17,
                              }}
                            >
                              {comment.text}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}

                    {/* Input de Comentário com Avatar do Usuário Logado */}
                    <View style={styles.commentInputRow}>
                      <CoverImage
                        uri={userProfile.avatarUrl}
                        style={styles.commentInputUserAvatar}
                        fallbackType="artist"
                      />
                      <TextInput
                        placeholder="Escreva um comentário..."
                        placeholderTextColor={colors.mutedForeground}
                        value={commentInputs[item.id] || ''}
                        onChangeText={(val) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [item.id]: val,
                          }))
                        }
                        style={[
                          styles.commentInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.foreground,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleAddComment(item.id)}
                        activeOpacity={0.85}
                      >
                        <Send size={15} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 110,
  },
  headerBox: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dismissIntroBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  feedList: {
    gap: 16,
  },
  postCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
  },
  authorInfoCol: {
    flex: 1,
    gap: 2,
  },
  authorNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  authorHandle: {
    fontSize: 12,
    fontWeight: '700',
  },
  authorSubLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorActionLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
  },
  activityTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  activityTypeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  captionContainer: {
    paddingHorizontal: 2,
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400',
  },
  mediaAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  mediaCoverWrapper: {
    position: 'relative',
  },
  mediaCover: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  mediaDetailsCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 3,
  },
  mediaTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaTypeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaTypeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mediaTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  mediaSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    gap: 8,
  },
  mediaStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreHighlightBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreHighlightNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  scoreHighlightMax: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9.5,
    fontWeight: '700',
    marginLeft: 1,
  },
  starsInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  mediaActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  socialActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 11,
    borderTopWidth: 1,
    gap: 8,
  },
  socialActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  socialActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  socialActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bookmarkBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentPreviewAvatar: {
    width: 20,
    height: 20,
    borderRadius: 999,
  },
  commentPreviewText: {
    flex: 1,
    fontSize: 11.5,
  },
  commentsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 9,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInputUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
