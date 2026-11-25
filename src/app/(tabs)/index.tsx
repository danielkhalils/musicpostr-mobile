import { FeedPostCard } from '@/components/FeedPostCard';
import { FeedCommentsModal, FeedShareModal } from '@/components/FeedPostModals';
import { MobileHeader } from '@/components/MobileHeader';
import { ScreenLoader } from '@/components/ScreenLoader';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';
import { useHeaderVisibility } from '@/context/HeaderVisibilityContext';
import { useAppTheme } from '@/context/ThemeContext';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import { useAuth } from '@/context/AuthContext';
import {
  consumeTimelineIntroOnce,
  type FeedPostItem,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import {
  getFeedPostsFromSupabase,
  ensureFeedPostInSupabase,
  toggleFeedPostLikeInSupabase,
  addFeedPostCommentInSupabase,
  deleteFeedPostCommentInSupabase,
} from '@/services/catalog.service';
import { router, useFocusEffect } from 'expo-router';
import { Disc, Sparkles, Star, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { user, profile: authProfile } = useAuth();
  const { setIsHeaderVisible } = useHeaderVisibility();
  const { mode: cardMode } = useActivityCardMode();
  const lastScrollY = useRef(0);

  const [feedItems, setFeedItems] = useState<FeedPostItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(INFINITE_PAGE_SIZE);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showTimelineIntro, setShowTimelineIntro] = useState<boolean>(() =>
    consumeTimelineIntroOnce()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [sharePostItem, setSharePostItem] = useState<FeedPostItem | null>(null);

  const activeCommentPost = useMemo(
    () => feedItems.find((item) => item.id === activeCommentPostId) ?? null,
    [feedItems, activeCommentPostId]
  );

  const loadFeed = useCallback(async () => {
    if (!user?.id) {
      setFeedItems([]);
      setIsInitialLoading(false);
      return;
    }
    try {
      const posts = await getFeedPostsFromSupabase(user.id);
      setFeedItems(posts);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setVisibleCount(INFINITE_PAGE_SIZE);
      await loadFeed();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  const handleTimelineScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (visibleCount < feedItems.length && isNearScrollBottom(event)) {
        setVisibleCount((prev) => Math.min(feedItems.length, prev + INFINITE_PAGE_SIZE));
      }
    },
    [visibleCount, feedItems.length]
  );

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
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    if (currentScrollY <= 25) {
      setIsHeaderVisible(true);
    } else if (diff > 20 && currentScrollY > 70) {
      setIsHeaderVisible(false);
    } else if (diff < -15) {
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
      const realPostId = await ensureFeedPostInSupabase(target);
      if (!realPostId) return;
      if (realPostId !== id) {
        setFeedItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, id: realPostId } : item))
        );
        setActiveCommentPostId((prev) => (prev === id ? realPostId : prev));
      }
      await toggleFeedPostLikeInSupabase(realPostId, user.id, prevLiked);
    }
  };

  const handleSharePost = (item: FeedPostItem) => {
    setSharePostItem(item);
  };

  const handleOpenComments = (id: string) => {
    setActiveCommentPostId(id);
  };

  const handleAddComment = async (id: string, commentText: string): Promise<boolean> => {
    const text = commentText.trim();
    if (!text) return false;
    if (!user) {
      setActiveCommentPostId(null);
      router.push('/login' as any);
      return false;
    }

    const target = feedItems.find((item) => item.id === id);
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
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === id || item.id === realPostId
            ? {
                ...item,
                id: realPostId,
                comments: [...item.comments, created],
              }
            : item
        )
      );
      if (realPostId !== id) {
        setActiveCommentPostId((prev) => (prev === id ? realPostId : prev));
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

  if (isInitialLoading && feedItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MobileHeader />
        <ScreenLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          handleScroll(e);
          handleTimelineScroll(e);
        }}
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
              { backgroundColor: colors.card, borderColor: colors.border, gap: 10 },
            ]}
          >
            <Disc size={44} color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '900',
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              Sua timeline ainda está vazia
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                textAlign: 'center',
                lineHeight: 19,
              }}
            >
              Que tal dar o primeiro play? Publique sua primeira avaliação de álbum e compartilhe seu gosto musical com a comunidade!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/artists' as any)}
              activeOpacity={0.85}
              style={{
                marginTop: 6,
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 11,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Star size={15} color="#fff" fill="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                Avaliar meu primeiro álbum
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feedList}>
            {feedItems.slice(0, visibleCount).map((item) => {
              const isArtistActivity =
                item.activityType === 'follow_idol' ||
                item.activityType === 'superfan';
              const targetRoute = isArtistActivity
                ? `/artist/${item.artistId || ''}`
                : `/album/${item.albumId}`;
              const authorRoute =
                item.friendUsername === 'anabeat' ||
                (authProfile?.username &&
                  item.friendUsername.toLowerCase() ===
                    authProfile.username.toLowerCase())
                  ? '/(tabs)/profile'
                  : `/user/${item.friendUsername}`;
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
                  item={item}
                  cardMode={cardMode}
                  isCommentsOpen={activeCommentPostId === item.id}
                  canShare={canShare}
                  onPressAuthor={() => router.push(authorRoute as any)}
                  onPressTarget={() => router.push(targetRoute as any)}
                  onToggleLike={() => handleToggleLike(item.id)}
                  onPressComment={() => handleOpenComments(item.id)}
                  onShare={() => handleSharePost(item)}
                />
              );
            })}
          </View>
        )}
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
});
