import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
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
import { formatRating } from '@/utils/rating';
import { CoverImage } from './CoverImage';

export interface FeedStyleActivityCardProps {
  activityType: 'review' | 'favorite' | 'follow_idol';
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  timeAgo?: string;
  title: string;
  subtitle: string;
  coverUrl?: string;
  artistNameForImage?: string;
  rating?: number;
  comment?: string;
  onPressTarget: () => void;
  onPressAuthor?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
  commentsCount?: number;
  onPressComment?: () => void;
  onShare?: () => void;
}

function getScoreColor(rating: number) {
  if (rating >= 8.5) return '#10b981';
  if (rating >= 7.0) return '#84cc16';
  if (rating >= 5.0) return '#eab308';
  if (rating >= 3.0) return '#f97316';
  return '#ef4444';
}

export function FeedStyleActivityCard({
  activityType,
  authorName,
  authorUsername,
  authorAvatar,
  timeAgo,
  title,
  subtitle,
  coverUrl,
  artistNameForImage,
  rating = 0,
  comment,
  onPressTarget,
  onPressAuthor,
  onDelete,
  isDeleting = false,
  likesCount = 0,
  isLiked = false,
  onToggleLike,
  commentsCount = 0,
  onPressComment,
  onShare,
}: FeedStyleActivityCardProps) {
  const { colors, isDark } = useAppTheme();
  const isIdol = activityType === 'follow_idol';
  const isFavorite = activityType === 'favorite';

  const actionText = isIdol
    ? 'passou a seguir'
    : isFavorite
      ? 'favoritou um álbum'
      : 'avaliou um álbum';

  return (
    <View
      style={[
        styles.postCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0.32 : 0.06,
        },
      ]}
    >
      {/* 1. Cabeçalho do Post */}
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
              uri={authorAvatar}
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
                {authorName}
              </Text>
              <Text
                style={[styles.authorHandle, { color: colors.primary }]}
                numberOfLines={1}
              >
                @{authorUsername}
              </Text>
            </View>

            <View style={styles.authorSubLine}>
              <Text
                style={[styles.authorActionLabel, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {actionText}
              </Text>
              {Boolean(timeAgo) && (
                <>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>•</Text>
                  <View style={styles.timeLine}>
                    <Clock size={10} color={colors.mutedForeground} />
                    <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                      {timeAgo}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isIdol ? (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: '#a855f718', borderColor: '#a855f738' },
              ]}
            >
              <UserCheck size={11} color="#a855f7" />
              <Text style={[styles.typeBadgeText, { color: '#a855f7' }]}>Ídolo</Text>
            </View>
          ) : isFavorite ? (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${colors.rose}18`, borderColor: `${colors.rose}38` },
              ]}
            >
              <Heart size={11} color={colors.rose} fill={colors.rose} />
              <Text style={[styles.typeBadgeText, { color: colors.rose }]}>Favorito</Text>
            </View>
          ) : (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}38` },
              ]}
            >
              <Star size={11} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>Review</Text>
            </View>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              disabled={isDeleting}
              style={{ padding: 4, opacity: isDeleting ? 0.6 : 1 }}
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

      {/* 2. Hero Media igual ao Feed */}
      <TouchableOpacity
        style={styles.heroMediaContainer}
        onPress={onPressTarget}
        activeOpacity={0.92}
      >
        <CoverImage
          uri={coverUrl}
          artistName={isIdol ? artistNameForImage || title : undefined}
          albumTitle={!isIdol ? title : undefined}
          albumArtist={!isIdol ? subtitle : undefined}
          style={styles.heroMediaImage}
          fallbackType={isIdol ? 'artist' : 'album'}
          quality="high"
        />

        {!isIdol && rating > 0 ? (
          <View
            style={[
              styles.heroScoreBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 18, 20, 0.94)'
                  : 'rgba(255, 255, 255, 0.96)',
                borderColor: getScoreColor(rating),
                shadowColor: getScoreColor(rating),
              },
            ]}
          >
            <Text style={[styles.heroScoreText, { color: colors.foreground }]}>
              {formatRating(rating)}
            </Text>
            <Text style={[styles.heroScoreLabel, { color: getScoreColor(rating) }]}>
              NOTA
            </Text>
          </View>
        ) : isIdol ? (
          <View
            style={[
              styles.heroScoreBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 18, 20, 0.94)'
                  : 'rgba(255, 255, 255, 0.96)',
                borderColor: '#a855f7',
                shadowColor: '#a855f7',
              },
            ]}
          >
            <Award size={20} color="#a855f7" />
            <Text style={[styles.heroScoreLabel, { color: '#a855f7' }]}>ÍDOLO</Text>
          </View>
        ) : isFavorite ? (
          <View
            style={[
              styles.heroScoreBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 18, 20, 0.94)'
                  : 'rgba(255, 255, 255, 0.96)',
                borderColor: colors.rose,
                shadowColor: colors.rose,
              },
            ]}
          >
            <Heart size={18} color={colors.rose} fill={colors.rose} />
            <Text style={[styles.heroScoreLabel, { color: colors.rose }]}>FAVORITO</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.88)']}
          locations={[0, 0.45, 1]}
          style={styles.heroGradientOverlay}
        >
          <View style={styles.heroMediaInfo}>
            <View style={styles.heroMediaTypePill}>
              <Disc size={11} color="#ffffff" />
              <Text style={styles.heroMediaTypeText}>
                {isIdol ? 'ARTISTA' : 'ÁLBUM'}
              </Text>
            </View>
            <Text style={styles.heroMediaTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.heroMediaArtist} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* 3. Barra de interações (quando fornecida) */}
      {(onToggleLike || onPressComment || onShare) && (
        <View style={styles.actionBar}>
          {onToggleLike && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onToggleLike}
              activeOpacity={0.7}
            >
              <Heart
                size={21}
                color={isLiked ? colors.rose : colors.foreground}
                fill={isLiked ? colors.rose : 'transparent'}
              />
              {likesCount > 0 && (
                <Text
                  style={[
                    styles.actionCount,
                    { color: isLiked ? colors.rose : colors.foreground },
                  ]}
                >
                  {likesCount}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {onPressComment && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onPressComment}
              activeOpacity={0.7}
            >
              <MessageSquare size={20} color={colors.foreground} />
              {commentsCount > 0 && (
                <Text style={[styles.actionCount, { color: colors.foreground }]}>
                  {commentsCount}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {onShare && (
            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 'auto' }]}
              onPress={onShare}
              activeOpacity={0.7}
            >
              <Share2 size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Caption estilo Feed */}
      {Boolean(comment) && (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: colors.foreground }]}>
            <Text
              style={[styles.captionUsername, { color: colors.foreground }]}
              onPress={onPressAuthor}
            >
              {authorUsername}{' '}
            </Text>
            {comment}
          </Text>
        </View>
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
    elevation: 4,
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeBadgeText: {
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
  heroScoreBadge: {
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
  heroScoreText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  heroScoreLabel: {
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
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 1,
  },
  heroMediaTypeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroMediaTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  heroMediaArtist: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  captionContainer: {
    paddingTop: 2,
  },
  captionText: {
    fontSize: 13,
    lineHeight: 19,
  },
  captionUsername: {
    fontWeight: '800',
  },
});
