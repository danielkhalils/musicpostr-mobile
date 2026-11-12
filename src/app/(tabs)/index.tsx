import { CoverImage } from '@/components/CoverImage';
import { MobileHeader } from '@/components/MobileHeader';
import { useHeaderVisibility } from '@/context/HeaderVisibilityContext';
import { useAppTheme } from '@/context/ThemeContext';
import {
  consumeTimelineIntroOnce,
  type FeedPostItem,
  getCommunityFeedPosts,
  getUserProfile,
  saveCommunityFeedPosts,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Award,
  Clock,
  Disc,
  Heart,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { setIsHeaderVisible } = useHeaderVisibility();
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    return () => {
      setIsHeaderVisible(true);
    };
  }, [setIsHeaderVisible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Se estiver no topo da tela, sempre mostra o header
    if (currentScrollY <= 20) {
      setIsHeaderVisible(true);
    } else if (diff > 12) {
      // Rolando para baixo: oculta o header
      setIsHeaderVisible(false);
    } else if (diff < -15) {
      // Rolando para cima: mostra o header novamente
      setIsHeaderVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

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

  const getScoreColor = (rating: number) => {
    if (rating >= 8.5) return '#10b981';
    if (rating >= 7.0) return '#84cc16';
    if (rating >= 5.0) return '#eab308';
    if (rating >= 3.0) return '#f97316';
    return '#ef4444';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

                {/* 2. CARD DE MÍDIA DESTACADO (Hero da Postagem Estilo Instagram) */}
                <TouchableOpacity
                  style={styles.heroMediaContainer}
                  onPress={() => router.push(targetRoute as any)}
                  activeOpacity={0.92}
                >
                  <CoverImage
                    uri={item.albumCover}
                    style={styles.heroMediaImage}
                    fallbackType={isIdolActivity ? 'artist' : 'album'}
                    quality="high"
                  />

                  {/* Círculo de Nota de Destaque Estilo Musicpostr / Tela de Álbuns */}
                  {!isIdolActivity && item.rating > 0 ? (
                    <View
                      style={[
                        styles.musicpostrHeroBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(18, 18, 20, 0.94)'
                            : 'rgba(255, 255, 255, 0.96)',
                          borderColor: getScoreColor(item.rating),
                          shadowColor: getScoreColor(item.rating),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.musicpostrScoreText,
                          { color: colors.foreground },
                        ]}
                      >
                        {item.rating.toFixed(1)}
                      </Text>
                      <Text
                        style={[
                          styles.musicpostrScoreLabel,
                          { color: getScoreColor(item.rating) },
                        ]}
                      >
                        NOTA
                      </Text>
                    </View>
                  ) : isIdolActivity ? (
                    <View
                      style={[
                        styles.musicpostrHeroBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(18, 18, 20, 0.94)'
                            : 'rgba(255, 255, 255, 0.96)',
                          borderColor: '#a855f7',
                          shadowColor: '#a855f7',
                        },
                      ]}
                    >
                      <Award size={22} color="#a855f7" />
                      <Text
                        style={[
                          styles.musicpostrScoreLabel,
                          { color: '#a855f7' },
                        ]}
                      >
                        ÍDOLO
                      </Text>
                    </View>
                  ) : isFavoriteActivity ? (
                    <View
                      style={[
                        styles.musicpostrHeroBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(18, 18, 20, 0.94)'
                            : 'rgba(255, 255, 255, 0.96)',
                          borderColor: colors.rose,
                          shadowColor: colors.rose,
                        },
                      ]}
                    >
                      <Heart size={20} color={colors.rose} fill={colors.rose} />
                      <Text
                        style={[
                          styles.musicpostrScoreLabel,
                          { color: colors.rose },
                        ]}
                      >
                        FAVORITO
                      </Text>
                    </View>
                  ) : null}

                  {/* Gradiente Inferior com Título do Álbum e Artista */}
                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(0, 0, 0, 0.35)',
                      'rgba(0, 0, 0, 0.88)',
                    ]}
                    locations={[0, 0.45, 1]}
                    style={styles.heroGradientOverlay}
                  >
                    <View style={styles.heroMediaInfo}>
                      <View style={styles.heroMediaTypePill}>
                        <Disc size={11} color="#ffffff" />
                        <Text style={styles.heroMediaTypeText}>
                          {isIdolActivity ? 'ARTISTA' : 'ÁLBUM'}
                        </Text>
                      </View>
                      <Text style={styles.heroMediaTitle} numberOfLines={1}>
                        {item.albumTitle}
                      </Text>
                      <Text style={styles.heroMediaArtist} numberOfLines={1}>
                        {item.artistName}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 3. BARRA DE INTERAÇÃO ESTILO INSTAGRAM (Curtir, Comentar, Compartilhar) */}
                <View style={styles.instagramActionBar}>
                  {/* Botão Curtir */}
                  <TouchableOpacity
                    style={styles.instagramActionBtn}
                    onPress={() => handleToggleLike(item.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Curtir publicação"
                  >
                    <Heart
                      size={22}
                      color={
                        item.isLiked ? colors.rose : colors.foreground
                      }
                      fill={item.isLiked ? colors.rose : 'transparent'}
                    />
                    {item.likesCount > 0 && (
                      <Text
                        style={[
                          styles.instagramActionCount,
                          {
                            color: item.isLiked
                              ? colors.rose
                              : colors.foreground,
                          },
                        ]}
                      >
                        {item.likesCount}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Botão Comentar */}
                  <TouchableOpacity
                    style={styles.instagramActionBtn}
                    onPress={() => handleToggleCommentSection(item.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Comentários"
                  >
                    <MessageSquare
                      size={21}
                      color={
                        isCommentsOpen
                          ? colors.primary
                          : colors.foreground
                      }
                    />
                    {item.comments.length > 0 && (
                      <Text
                        style={[
                          styles.instagramActionCount,
                          {
                            color: isCommentsOpen
                              ? colors.primary
                              : colors.foreground,
                          },
                        ]}
                      >
                        {item.comments.length}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Botão Compartilhar */}
                  <TouchableOpacity
                    style={styles.instagramActionBtn}
                    onPress={() => handleSharePost(item)}
                    activeOpacity={0.7}
                    accessibilityLabel="Compartilhar publicação"
                  >
                    <Share2 size={21} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* 4. CAPTION DO USUÁRIO ESTILO INSTAGRAM (username + comentário) */}
                {Boolean(item.comment) && (
                  <View style={styles.instagramCaptionContainer}>
                    <Text
                      style={[
                        styles.instagramCaptionText,
                        { color: colors.foreground },
                      ]}
                    >
                      <Text
                        style={[
                          styles.instagramCaptionUsername,
                          { color: colors.foreground },
                        ]}
                        onPress={() => router.push(authorRoute as any)}
                      >
                        {item.friendUsername}{' '}
                      </Text>
                      {item.comment}
                    </Text>
                  </View>
                )}

                {/* 6. PRÉVIA DO ÚLTIMO COMENTÁRIO (quando fechado) */}
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
    </View>
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
  heroMediaContainer: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  heroMediaImage: {
    width: '100%',
    height: '100%',
  },
  musicpostrHeroBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  musicpostrScoreText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  musicpostrScoreLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    justifyContent: 'flex-end',
    padding: 10,
  },
  heroMediaInfo: {
    gap: 2,
  },
  heroMediaTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 1,
  },
  heroMediaTypeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroMediaTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMediaArtist: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instagramActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  instagramActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  instagramActionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  instagramCaptionContainer: {
    paddingHorizontal: 2,
  },
  instagramCaptionText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  instagramCaptionUsername: {
    fontSize: 13.5,
    fontWeight: '800',
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
