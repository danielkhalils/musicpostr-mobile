import { CoverImage } from '@/components/CoverImage';
import { MobileHeader } from '@/components/MobileHeader';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';
import { useHeaderVisibility } from '@/context/HeaderVisibilityContext';
import { useAppTheme } from '@/context/ThemeContext';
import { formatRating } from '@/utils/rating';
import { useAuth } from '@/context/AuthContext';
import {
  consumeTimelineIntroOnce,
  type FeedPostItem,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import {
  getFeedPostsFromSupabase,
  toggleFeedPostLikeInSupabase,
  addFeedPostCommentInSupabase,
  deleteFeedPostCommentInSupabase,
} from '@/services/catalog.service';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
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
  Trash2,
  UserCheck,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FeedCommentInputProps {
  postId: string;
  avatarUrl?: string;
  colors: any;
  onAddComment: (postId: string, text: string) => Promise<boolean>;
  onFocusChange?: (focused: boolean) => void;
}

function FeedCommentInput({
  postId,
  avatarUrl,
  colors,
  onAddComment,
  onFocusChange,
}: FeedCommentInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await onAddComment(postId, trimmed);
      if (ok) {
        setText('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.commentInputRow}>
      <CoverImage
        uri={avatarUrl}
        style={styles.commentInputUserAvatar}
        fallbackType="artist"
      />
      <TextInput
        placeholder="Escreva um comentário..."
        placeholderTextColor={colors.mutedForeground}
        value={text}
        onChangeText={setText}
        editable={!isSubmitting}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        style={[
          styles.commentInput,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.foreground,
            opacity: isSubmitting ? 0.7 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.sendBtn,
          {
            backgroundColor:
              text.trim() && !isSubmitting ? colors.primary : `${colors.primary}66`,
          },
        ]}
        onPress={handleSend}
        activeOpacity={0.85}
        disabled={!text.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Send size={15} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, profile: authProfile } = useAuth();
  const { setIsHeaderVisible } = useHeaderVisibility();
  const { mode: cardMode } = useActivityCardMode();
  const lastScrollY = useRef(0);
  const isTypingRef = useRef(false);

  const [feedItems, setFeedItems] = useState<FeedPostItem[]>([]);
  const [showTimelineIntro, setShowTimelineIntro] = useState<boolean>(() =>
    consumeTimelineIntroOnce()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentSection, setActiveCommentSection] = useState<{
    [key: string]: boolean;
  }>({});
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    const posts = await getFeedPostsFromSupabase(user?.id);
    setFeedItems(posts);
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  useEffect(() => {
    loadFeed();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      loadFeed();
      if (consumeTimelineIntroOnce()) {
        setShowTimelineIntro(true);
      }
    });
    return unsubscribe;
  }, [loadFeed]);

  // Atualiza a timeline sempre que o usuário volta para a aba Início
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

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
    if (isTypingRef.current) {
      return;
    }
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Se estiver no topo da tela, sempre mostra o header
    if (currentScrollY <= 25) {
      setIsHeaderVisible(true);
    } else if (diff > 20 && currentScrollY > 70) {
      // Rolando para baixo firmemente: oculta o header de forma suave
      setIsHeaderVisible(false);
    } else if (diff < -15) {
      // Rolando para cima: mostra o header novamente
      setIsHeaderVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  const handleToggleLike = async (id: string) => {
    const target = feedItems.find((item) => item.id === id);
    if (!target) return;
    const prevLiked = target.isLiked;

    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !prevLiked,
              likesCount: Math.max(0, prevLiked ? item.likesCount - 1 : item.likesCount + 1),
            }
          : item
      )
    );

    if (user) {
      await toggleFeedPostLikeInSupabase(id, user.id, prevLiked);
    }
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

  const handleAddComment = async (id: string, commentText: string): Promise<boolean> => {
    const text = commentText.trim();
    if (!text) return false;
    if (!user) {
      router.push('/login' as any);
      return false;
    }

    const authorName = authProfile?.full_name || authProfile?.username || 'Usuário';
    const authorAvatar = authProfile?.avatar_url || '';

    const created = await addFeedPostCommentInSupabase({
      postId: id,
      userId: user.id,
      author: authorName,
      avatar: authorAvatar,
      text,
    });

    if (created) {
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                comments: [...item.comments, created],
              }
            : item
        )
      );
      setActiveCommentSection((prev) => ({ ...prev, [id]: true }));
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
        setFeedItems((prev) =>
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

  const getActivityActionText = (item: FeedPostItem) => {
    const type = item.activityType || 'review';
    if (type === 'favorite') return 'favoritou um álbum';
    if (type === 'follow_idol') return 'seguiu um novo ídolo';
    return item.isEdited ? 'editou uma avaliação' : 'publicou uma avaliação';
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
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
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

                {/* 2. MÍDIA DO POST: COMPLETA (HERO) OU COMPACTA */}
                {cardMode === 'compact' ? (
                  <TouchableOpacity
                    style={styles.compactMediaRow}
                    onPress={() => router.push(targetRoute as any)}
                    activeOpacity={0.88}
                  >
                    <CoverImage
                      uri={item.albumCover}
                      artistName={isIdolActivity ? item.albumTitle : undefined}
                      albumTitle={!isIdolActivity ? item.albumTitle : undefined}
                      albumArtist={!isIdolActivity ? item.artistName : undefined}
                      style={[
                        styles.compactMediaThumb,
                        isIdolActivity && { borderRadius: 999 },
                      ]}
                      fallbackType={isIdolActivity ? 'artist' : 'album'}
                      quality="medium"
                    />
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.compactTitleLine}>
                        <Text
                          style={[styles.compactTitle, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {item.albumTitle}
                        </Text>
                        {!isIdolActivity && item.rating > 0 && (
                          <View
                            style={[
                              styles.compactScorePill,
                              {
                                backgroundColor: `${getScoreColor(item.rating)}20`,
                                borderColor: `${getScoreColor(item.rating)}55`,
                              },
                            ]}
                          >
                            <Star
                              size={10}
                              color={getScoreColor(item.rating)}
                              fill={getScoreColor(item.rating)}
                            />
                            <Text
                              style={[
                                styles.compactScoreText,
                                { color: getScoreColor(item.rating) },
                              ]}
                            >
                              {formatRating(item.rating)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.compactArtist, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {item.artistName}
                      </Text>
                      {Boolean(item.comment) && (
                        <Text
                          style={[styles.compactComment, { color: colors.foreground }]}
                          numberOfLines={2}
                        >
                          {`"${item.comment}"`}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.heroMediaContainer}
                    onPress={() => router.push(targetRoute as any)}
                    activeOpacity={0.92}
                  >
                    <CoverImage
                      uri={item.albumCover}
                      artistName={isIdolActivity ? item.albumTitle : undefined}
                      albumTitle={!isIdolActivity ? item.albumTitle : undefined}
                      albumArtist={!isIdolActivity ? item.artistName : undefined}
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
                          {formatRating(item.rating)}
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
                )}

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
                    style={[styles.instagramActionBtn, { marginLeft: 'auto' }]}
                    onPress={() => handleSharePost(item)}
                    activeOpacity={0.7}
                    accessibilityLabel="Compartilhar publicação"
                  >
                    <Share2 size={21} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* 4. CAPTION DO USUÁRIO ESTILO INSTAGRAM (exibido no modo completo; no compacto já aparece ao lado da capa) */}
                {cardMode === 'full' && Boolean(item.comment) && (
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
                      item.comments.map((comment) => {
                        const isPostOwner = Boolean(
                          user &&
                            ((item.userId && item.userId === user.id) ||
                              (authProfile?.username &&
                                item.friendUsername.toLowerCase() ===
                                  authProfile.username.toLowerCase()))
                        );
                        const isCommentAuthor = Boolean(
                          user && comment.userId && comment.userId === user.id
                        );
                        const canDeleteComment = isPostOwner || isCommentAuthor;
                        const isDeletingThis = deletingCommentId === comment.id;

                        return (
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
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {comment.author}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: colors.mutedForeground,
                                    }}
                                  >
                                    {comment.time}
                                  </Text>
                                  {canDeleteComment && (
                                    <TouchableOpacity
                                      onPress={() => handleDeleteComment(item.id, comment.id)}
                                      disabled={isDeletingThis}
                                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                      style={{ opacity: isDeletingThis ? 0.6 : 1 }}
                                      accessibilityLabel="Excluir comentário"
                                    >
                                      {isDeletingThis ? (
                                        <ActivityIndicator size="small" color={colors.mutedForeground} />
                                      ) : (
                                        <Trash2 size={13} color={colors.mutedForeground} />
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
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
                        );
                      })
                    )}

                    {/* Input de Comentário isolado com Avatar do Usuário Logado */}
                    <FeedCommentInput
                      postId={item.id}
                      avatarUrl={authProfile?.avatar_url || ''}
                      colors={colors}
                      onAddComment={handleAddComment}
                      onFocusChange={(focused) => {
                        isTypingRef.current = focused;
                        if (focused) setIsHeaderVisible(true);
                      }}
                    />
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
  viewModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  viewModeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  compactMediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  compactTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  compactScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  compactScoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  compactArtist: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  compactComment: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    opacity: 0.9,
  },
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
