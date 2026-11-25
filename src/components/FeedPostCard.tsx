import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  Disc,
  Heart,
  MessageSquare,
  Share2,
  Star,
  Trash2,
  UserCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { type FeedPostItem } from '@/services/musicBrainz.service';
import { type ActivityCardMode } from '@/services/settings.service';
import { formatRating } from '@/utils/rating';
import { CoverImage } from './CoverImage';

export interface FeedPostCardProps {
  item: FeedPostItem;
  cardMode: ActivityCardMode;
  isCommentsOpen?: boolean;
  canShare?: boolean;
  onPressAuthor?: () => void;
  onPressTarget: () => void;
  onToggleLike: () => void;
  onPressComment: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function getScoreColor(rating: number) {
  if (rating >= 8.5) return '#10b981';
  if (rating >= 7.0) return '#84cc16';
  if (rating >= 5.0) return '#eab308';
  if (rating >= 3.0) return '#f97316';
  return '#ef4444';
}

function getActivityActionText(item: FeedPostItem) {
  const type = item.activityType || 'review';
  if (type === 'favorite') return 'favoritou um álbum';
  if (type === 'superfan') return 'se tornou superfã de';
  if (type === 'follow_idol') return 'seguiu um novo ídolo';
  return item.isEdited ? 'editou uma avaliação' : 'publicou uma avaliação';
}

export function FeedPostCard({
  item,
  cardMode,
  isCommentsOpen = false,
  canShare = false,
  onPressAuthor,
  onPressTarget,
  onToggleLike,
  onPressComment,
  onShare,
  onDelete,
  isDeleting = false,
}: FeedPostCardProps) {
  const { colors, isDark } = useAppTheme();
  const isSuperfanActivity = item.activityType === 'superfan';
  const isIdolActivity = item.activityType === 'follow_idol' || isSuperfanActivity;
  const isFavoriteActivity = item.activityType === 'favorite';
  const showShareButton =
    Boolean(canShare && onShare) && item.activityType !== 'follow_idol';

  const renderActivityBadge = () => {
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
          <Text style={[styles.activityTypeBadgeText, { color: colors.rose }]}>
            Favoritado
          </Text>
        </View>
      );
    }

    if (type === 'superfan') {
      return (
        <View
          style={[
            styles.activityTypeBadge,
            {
              backgroundColor: 'rgba(245, 158, 11, 0.16)',
              borderColor: 'rgba(245, 158, 11, 0.45)',
            },
          ]}
        >
          <Star size={11} color="#f59e0b" fill="#f59e0b" />
          <Text style={[styles.activityTypeBadgeText, { color: '#f59e0b' }]}>
            Superfã
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
          <Text style={[styles.activityTypeBadgeText, { color: '#a855f7' }]}>
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
        <Text style={[styles.activityTypeBadgeText, { color: colors.primary }]}>
          Review
        </Text>
      </View>
    );
  };

  return (
    <View
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
          onPress={onPressAuthor}
          disabled={!onPressAuthor}
          activeOpacity={onPressAuthor ? 0.8 : 1}
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
                style={[styles.authorName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.friendName}
              </Text>
              <Text
                style={[styles.authorHandle, { color: colors.primary }]}
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
              {Boolean(item.timeAgo) && (
                <>
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
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightCol}>
          {renderActivityBadge()}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              disabled={isDeleting}
              style={{ padding: 4, opacity: isDeleting ? 0.6 : 1 }}
              accessibilityLabel="Excluir avaliação"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              ) : (
                <Trash2 size={14} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. MÍDIA DO POST: COMPLETA (HERO) OU COMPACTA */}
      {cardMode === 'compact' ? (
        <TouchableOpacity
          style={styles.compactMediaRow}
          onPress={onPressTarget}
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
            {!isIdolActivity && (
              <Text
                style={[styles.compactArtist, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {item.artistName}
              </Text>
            )}
            {Boolean(item.comment) && (
              <Text
                style={[styles.compactComment, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {item.comment}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.heroMediaContainer}
          onPress={onPressTarget}
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

          {/* Círculo de Nota de Destaque Estilo Musicpostr */}
          {!isIdolActivity && !isFavoriteActivity && item.rating > 0 ? (
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
          ) : null}

          {/* Gradiente Inferior com Título do Álbum e Artista */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0.4)',
              'rgba(0, 0, 0, 0.9)',
            ]}
            locations={[0, 0.45, 0.72, 1]}
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
              {!isIdolActivity && (
                <Text style={styles.heroMediaArtist} numberOfLines={1}>
                  {item.artistName}
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* 3. BARRA DE INTERAÇÃO ESTILO INSTAGRAM (Curtir, Comentar, Compartilhar) */}
      <View style={styles.instagramActionBar}>
        {/* Botão Curtir */}
        <TouchableOpacity
          style={styles.instagramActionBtn}
          onPress={onToggleLike}
          activeOpacity={0.7}
          accessibilityLabel="Curtir publicação"
        >
          <Heart
            size={22}
            color={item.isLiked ? colors.rose : colors.foreground}
            fill={item.isLiked ? colors.rose : 'transparent'}
          />
          {item.likesCount > 0 && (
            <Text
              style={[
                styles.instagramActionCount,
                {
                  color: item.isLiked ? colors.rose : colors.foreground,
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
          onPress={onPressComment}
          activeOpacity={0.7}
          accessibilityLabel="Comentários"
        >
          <MessageSquare
            size={21}
            color={isCommentsOpen ? colors.primary : colors.foreground}
          />
          {item.comments.length > 0 && (
            <Text
              style={[
                styles.instagramActionCount,
                {
                  color: isCommentsOpen ? colors.primary : colors.foreground,
                },
              ]}
            >
              {item.comments.length}
            </Text>
          )}
        </TouchableOpacity>

        {/* Botão Compartilhar (apenas para publicações próprias, exceto seguir artista) */}
        {showShareButton && onShare && (
          <TouchableOpacity
            style={[styles.instagramActionBtn, { marginLeft: 'auto' }]}
            onPress={onShare}
            activeOpacity={0.7}
            accessibilityLabel="Compartilhar publicação"
          >
            <Share2 size={21} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. CAPTION DO USUÁRIO ESTILO INSTAGRAM */}
      {cardMode === 'full' && Boolean(item.comment) && (
        <View style={styles.instagramCaptionContainer}>
          <Text
            style={[styles.instagramCaptionText, { color: colors.foreground }]}
          >
            <Text
              style={[
                styles.instagramCaptionUsername,
                { color: colors.foreground },
              ]}
              onPress={onPressAuthor}
            >
              {item.friendUsername}{' '}
            </Text>
            {item.comment}
          </Text>
        </View>
      )}

      {/* 5. PRÉVIA DO ÚLTIMO COMENTÁRIO (abre o bottom sheet estilo rede social) */}
      {item.comments.length > 0 && (
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
          onPress={onPressComment}
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
          {item.comments.length > 1 && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.primary,
              }}
            >
              Ver {item.comments.length}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    gap: 12,
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
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  heroMediaContainer: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#09090b',
  },
  heroMediaImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    top: 0,
    left: -1,
    right: -1,
    bottom: -2,
    justifyContent: 'flex-end',
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 12,
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
});
