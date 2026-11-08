import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Star,
  Trash2,
  Music,
  ArrowLeft,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type MyReviewRecord,
  getMyReviews,
  deleteMyReview,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';

export default function MyReviewsScreen() {
  const { colors } = useAppTheme();
  const [reviews, setReviews] = useState<MyReviewRecord[]>(() =>
    getMyReviews()
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setReviews(getMyReviews());
    });
    return unsubscribe;
  }, []);

  const handleDelete = (id: string) => {
    const updated = deleteMyReview(id);
    setReviews(updated);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={15} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
            }}
          >
            Voltar ao Perfil
          </Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Star size={24} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Minhas Avaliações
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            Gerencie, visualize ou remova as notas e opiniões que você
            compartilhou na comunidade.
          </Text>
        </View>

        {reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Music size={42} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Você ainda não publicou nenhuma avaliação.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {reviews.map((rev) => (
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
                  <CoverImage uri={rev.coverUrl} style={styles.thumb} />
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
                  {`"${rev.comment}"`}
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
                    onPress={() => handleDelete(rev.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={14} color={colors.destructive} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.destructive,
                      }}
                    >
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
