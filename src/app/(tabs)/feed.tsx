import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type FeedPostItem,
  getCommunityFeedPosts,
  saveCommunityFeedPosts,
  getUserProfile,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

export default function FeedScreen() {
  const { colors } = useAppTheme();

  const [feedItems, setFeedItems] = useState<FeedPostItem[]>(() =>
    getCommunityFeedPosts()
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
    });
    return unsubscribe;
  }, []);

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
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header da Timeline */}
      <View
        style={[
          styles.headerBox,
          { borderBottomColor: colors.border },
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
              Timeline da Rede
            </Text>
            <Text
              style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
            >
              Acompanhe as críticas, notas e descobertas dos seus amigos na
              comunidade.
            </Text>
          </View>
        </View>
      </View>

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
            Sua timeline está silenciosa. Siga mais amigos para ver avaliações
            aqui!
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {feedItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.feedCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Autor */}
              <View
                style={[
                  styles.authorRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.authorLeft}
                  onPress={() =>
                    router.push(
                      item.friendUsername === 'anabeat'
                        ? '/(tabs)/profile'
                        : (`/user/${item.friendUsername}` as any)
                    )
                  }
                >
                  <CoverImage
                    uri={item.friendAvatar}
                    style={styles.authorAvatar}
                    fallbackType="artist"
                  />
                  <View style={{ flex: 1 }}>
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
                        styles.authorMeta,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      @{item.friendUsername} • {item.timeAgo}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View
                  style={[
                    styles.activityTypeBadge,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: colors.mutedForeground,
                    }}
                  >
                    Review de Álbum
                  </Text>
                </View>
              </View>

              {/* Card do Álbum Avaliado */}
              <View style={styles.albumBox}>
                <TouchableOpacity
                  onPress={() => router.push(`/album/${item.albumId}` as any)}
                >
                  <CoverImage
                    uri={item.albumCover}
                    style={styles.albumCover}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={styles.albumTopRow}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        router.push(`/album/${item.albumId}` as any)
                      }
                    >
                      <Text
                        style={[
                          styles.albumTitle,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.albumTitle}
                      </Text>
                      <Text
                        style={[
                          styles.artistName,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.artistName}
                      </Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.ratingPill,
                        {
                          backgroundColor: `${colors.primary}20`,
                          borderColor: `${colors.primary}45`,
                        },
                      ]}
                    >
                      <Star
                        size={12}
                        color={colors.primary}
                        fill={colors.primary}
                      />
                      <Text
                        style={[
                          styles.ratingPillText,
                          { color: colors.primary },
                        ]}
                      >
                        {item.rating}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.quoteBox,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quoteText,
                        { color: colors.foreground },
                      ]}
                    >
                      {`"${item.comment}"`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Barra de Ações */}
              <View
                style={[
                  styles.actionsRow,
                  { borderTopColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleLike(item.id)}
                >
                  <Heart
                    size={16}
                    color={
                      item.isLiked ? colors.rose : colors.mutedForeground
                    }
                    fill={item.isLiked ? colors.rose : 'transparent'}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: item.isLiked
                        ? colors.rose
                        : colors.mutedForeground,
                    }}
                  >
                    {item.likesCount}{' '}
                    {item.likesCount === 1 ? 'curtida' : 'curtidas'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleCommentSection(item.id)}
                >
                  <MessageSquare size={16} color={colors.mutedForeground} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.mutedForeground,
                    }}
                  >
                    {item.comments.length}{' '}
                    {item.comments.length === 1
                      ? 'comentário'
                      : 'comentários'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Seção de Comentários */}
              {activeCommentSection[item.id] && (
                <View
                  style={[
                    styles.commentsSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {item.comments.map((comment) => (
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
                              fontWeight: '700',
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
                            color: colors.mutedForeground,
                            marginTop: 2,
                          }}
                        >
                          {comment.text}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.commentInputRow}>
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
                    >
                      <Send size={15} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 36,
  },
  headerBox: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 21,
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
  feedCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  authorMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  activityTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  albumBox: {
    flexDirection: 'row',
    gap: 12,
  },
  albumCover: {
    width: 78,
    height: 78,
    borderRadius: 12,
  },
  albumTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  artistName: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  quoteBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentAvatar: {
    width: 28,
    height: 28,
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
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
