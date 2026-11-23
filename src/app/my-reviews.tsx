import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import {
  Trash2,
  Music,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import { CoverImage } from '@/components/CoverImage';
import { FeedStyleActivityCard } from '@/components/FeedStyleActivityCard';
import { useActivityCardMode } from '@/hooks/use-activity-card-mode';
import {
  type MyReviewRecord,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import {
  getUserReviews,
  deleteReviewFromSupabase,
} from '@/services/profile.service';

export default function MyReviewsScreen() {
  const { colors } = useAppTheme();
  const { user, profile: authProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { mode: cardMode } = useActivityCardMode();
  const [reviews, setReviews] = useState<MyReviewRecord[]>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!user) {
          setReviews([]);
          return;
        }
        const data = await getUserReviews({ userId: user.id });
        if (active) setReviews(data);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const executeDelete = async (id: string) => {
    if (deletingReviewId) return;
    setDeletingReviewId(id);
    try {
      const ok = user ? await deleteReviewFromSupabase(id, user.id) : true;
      if (ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        Alert.alert(
          'Erro ao excluir',
          'Não foi possível excluir esta avaliação. Tente novamente.'
        );
      }
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleDelete = (id: string, albumTitle?: string) => {
    if (deletingReviewId) return;
    const message = albumTitle
      ? `Tem certeza que deseja excluir sua avaliação de "${albumTitle}"? Ela também será removida da timeline.`
      : 'Tem certeza que deseja excluir esta avaliação? Ela também será removida da timeline.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(message);
      if (confirmed) {
        executeDelete(id);
      }
      return;
    }

    Alert.alert('Excluir avaliação', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => executeDelete(id),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Minhas Avaliações"
          subtitle="Gerencie, visualize ou remova as notas e opiniões que você compartilhou na comunidade."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
        />

        {isLoading && reviews.length === 0 ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.foreground} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Music size={42} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Você ainda não publicou nenhuma avaliação.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {reviews.map((rev) =>
              cardMode === 'full' ? (
                <FeedStyleActivityCard
                  key={rev.id}
                  activityType="review"
                  authorName={authProfile?.full_name || authProfile?.username || 'Você'}
                  authorUsername={authProfile?.username || 'user'}
                  authorAvatar={authProfile?.avatar_url || ''}
                  timeAgo={rev.date}
                  title={rev.albumTitle}
                  subtitle={rev.artistName}
                  coverUrl={rev.coverUrl}
                  rating={rev.rating}
                  comment={rev.comment}
                  onPressTarget={() => router.push(`/album/${rev.albumId}` as any)}
                  onDelete={() => handleDelete(rev.id, rev.albumTitle)}
                  isDeleting={deletingReviewId === rev.id}
                />
              ) : (
              <View
                key={rev.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.topRow}>
                  <CoverImage uri={rev.coverUrl} albumTitle={rev.albumTitle} albumArtist={rev.artistName} style={styles.thumb} quality="medium" />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.titleScoreRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.albumTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {rev.albumTitle}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.mutedForeground,
                          }}
                          numberOfLines={1}
                        >
                          {rev.artistName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.scoreBadge,
                          {
                            backgroundColor: `${colors.primary}18`,
                            borderColor: `${colors.primary}40`,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '900',
                            color: colors.primary,
                          }}
                        >
                          {rev.rating}/10
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 10.5,
                        color: colors.mutedForeground,
                      }}
                    >
                      {rev.date}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.commentText,
                    { color: colors.foreground },
                  ]}
                >
                  {rev.comment}
                </Text>

                <View
                  style={[
                    styles.footerRow,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/album/${rev.albumId}` as any)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: colors.primary,
                      }}
                    >
                      Ver Álbum →
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(rev.id, rev.albumTitle)}
                    disabled={deletingReviewId === rev.id}
                    style={[
                      styles.deleteBtn,
                      { opacity: deletingReviewId === rev.id ? 0.6 : 1 },
                    ]}
                  >
                    {deletingReviewId === rev.id ? (
                      <ActivityIndicator size="small" color={colors.destructive} />
                    ) : (
                      <Trash2 size={14} color={colors.destructive} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.destructive,
                      }}
                    >
                      {deletingReviewId === rev.id ? 'Excluindo...' : 'Excluir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 36,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBlock: {
    gap: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  titleScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  commentText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
