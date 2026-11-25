import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Send, Trash2, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { type FeedPostItem } from '@/services/musicBrainz.service';
import { CoverImage } from './CoverImage';
import { KeyboardAwareSheetModal } from './KeyboardAwareSheetModal';
import { ShareableReviewCard } from './ShareableReviewCard';

interface FeedCommentInputProps {
  postId: string;
  avatarUrl?: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onAddComment: (postId: string, text: string) => Promise<boolean>;
  onCommentPosted?: () => void;
}

function FeedCommentInput({
  postId,
  avatarUrl,
  colors,
  onAddComment,
  onCommentPosted,
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
        onCommentPosted?.();
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
        placeholder="Adicione um comentário..."
        placeholderTextColor={colors.mutedForeground}
        value={text}
        onChangeText={setText}
        editable={!isSubmitting}
        multiline
        maxLength={500}
        returnKeyType="send"
        blurOnSubmit={false}
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
              text.trim() && !isSubmitting
                ? colors.primary
                : `${colors.primary}66`,
          },
        ]}
        onPress={handleSend}
        activeOpacity={0.85}
        disabled={!text.trim() || isSubmitting}
        accessibilityLabel="Enviar comentário"
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

export interface FeedCommentsModalProps {
  post: FeedPostItem | null;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  deletingCommentId: string | null;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => Promise<boolean>;
  onDeleteComment: (postId: string, commentId: string) => void;
}

export function FeedCommentsModal({
  post,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  deletingCommentId,
  onClose,
  onAddComment,
  onDeleteComment,
}: FeedCommentsModalProps) {
  const { colors } = useAppTheme();
  const commentsScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  return (
    <KeyboardAwareSheetModal
      visible={Boolean(post)}
      onClose={onClose}
      backgroundColor={colors.card}
      borderColor={colors.border}
      maxHeightRatio={0.86}
    >
      {({ maxSheetHeight }) =>
        post ? (
          <View style={{ gap: 10 }}>
            <View style={styles.sheetModalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.sheetModalTitle, { color: colors.foreground }]}
                >
                  Comentários ({post.comments.length})
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  @{post.friendUsername} • {post.albumTitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.sheetCloseBtn}
                accessibilityLabel="Fechar comentários"
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={commentsScrollRef}
              style={{ maxHeight: Math.max(150, maxSheetHeight - 155) }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {post.comments.length === 0 ? (
                <View style={styles.emptyCommentsBox}>
                  <MessageSquare
                    size={26}
                    color={colors.mutedForeground}
                    style={{ opacity: 0.55 }}
                  />
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '700',
                      color: colors.foreground,
                      textAlign: 'center',
                    }}
                  >
                    Nenhum comentário ainda
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      textAlign: 'center',
                    }}
                  >
                    Seja o primeiro a comentar nesta publicação!
                  </Text>
                </View>
              ) : (
                post.comments.map((comment) => {
                  const isPostOwner = Boolean(
                    currentUserId &&
                      ((post.userId && post.userId === currentUserId) ||
                        (currentUsername &&
                          post.friendUsername.toLowerCase() ===
                            currentUsername.toLowerCase()))
                  );
                  const isCommentAuthor = Boolean(
                    currentUserId &&
                      comment.userId &&
                      comment.userId === currentUserId
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
                              fontSize: 12.5,
                              fontWeight: '800',
                              color: colors.foreground,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {comment.author}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10.5,
                                color: colors.mutedForeground,
                              }}
                            >
                              {comment.time}
                            </Text>
                            {canDeleteComment && (
                              <TouchableOpacity
                                onPress={() =>
                                  onDeleteComment(post.id, comment.id)
                                }
                                disabled={isDeletingThis}
                                hitSlop={{
                                  top: 6,
                                  bottom: 6,
                                  left: 6,
                                  right: 6,
                                }}
                                style={{ opacity: isDeletingThis ? 0.6 : 1 }}
                                accessibilityLabel="Excluir comentário"
                              >
                                {isDeletingThis ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={colors.mutedForeground}
                                  />
                                ) : (
                                  <Trash2
                                    size={13}
                                    color={colors.mutedForeground}
                                  />
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.foreground,
                            opacity: 0.92,
                            marginTop: 3,
                            lineHeight: 18,
                          }}
                        >
                          {comment.text}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View
              style={[
                styles.commentsFooterBar,
                { borderTopColor: colors.border },
              ]}
            >
              <FeedCommentInput
                postId={post.id}
                avatarUrl={currentUserAvatar || ''}
                colors={colors}
                onAddComment={onAddComment}
                onCommentPosted={() => {
                  setTimeout(() => {
                    commentsScrollRef.current?.scrollToEnd({ animated: true });
                  }, 80);
                }}
              />
            </View>
          </View>
        ) : null
      }
    </KeyboardAwareSheetModal>
  );
}

export interface FeedShareModalProps {
  post: FeedPostItem | null;
  onClose: () => void;
}

export function FeedShareModal({ post, onClose }: FeedShareModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(post)}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.sheetModalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetModalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
            },
          ]}
        >
          <View style={styles.sheetModalDragIndicator} />

          <View style={styles.sheetModalHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.sheetModalTitle, { color: colors.foreground }]}
              >
                {post?.activityType === 'review' || !post?.activityType
                  ? 'Compartilhar Nota'
                  : 'Compartilhar Atividade'}
              </Text>
              {post && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {post.activityType === 'follow_idol' ||
                  post.activityType === 'superfan'
                    ? post.albumTitle
                    : `${post.albumTitle} • ${post.artistName}`}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sheetCloseBtn}
              accessibilityLabel="Fechar"
            >
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {post && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 540 }}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              <ShareableReviewCard
                albumTitle={post.albumTitle}
                artistName={post.artistName}
                albumCover={post.albumCover}
                rating={post.rating}
                comment={post.comment}
                username={post.friendUsername}
                userName={post.friendName}
                userAvatar={post.friendAvatar}
                activityType={post.activityType || 'review'}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  commentsFooterBar: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInputUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    marginBottom: 3,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetModalContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  sheetModalDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
