import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, UserCheck } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogArtist,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { getUserFollowedArtists } from '@/services/profile.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 14;
const COLUMNS = 3;
const ITEM_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS
);
const AVATAR_SIZE = Math.min(96, ITEM_WIDTH - 6);

export default function IdolsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [artists, setArtists] = useState<CatalogArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadArtists = useCallback(async () => {
    try {
      if (isVisiting && username) {
        const data = await getUserFollowedArtists({ username });
        setArtists(data);
      } else if (user) {
        const data = await getUserFollowedArtists({ userId: user.id });
        setArtists(data);
      } else {
        setArtists([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isVisiting, username, user]);

  useEffect(() => {
    loadArtists();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      loadArtists();
    });
    return unsubscribe;
  }, [loadArtists]);

  useFocusEffect(
    useCallback(() => {
      loadArtists();
    }, [loadArtists])
  );

  const superfans = useMemo(
    () => artists.filter((a) => Boolean(a.isSuperfan)),
    [artists]
  );

  const regularIdols = useMemo(
    () => artists.filter((a) => !a.isSuperfan),
    [artists]
  );

  const renderCircularArtist = (artist: CatalogArtist, showGoldBadge: boolean) => (
    <TouchableOpacity
      key={artist.id}
      style={[styles.artistCircleItem, { width: ITEM_WIDTH }]}
      onPress={() => router.push(`/artist/${artist.id}` as any)}
      activeOpacity={0.82}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatarRing,
            {
              width: AVATAR_SIZE + 6,
              height: AVATAR_SIZE + 6,
              borderColor: showGoldBadge ? '#f59e0b' : colors.border,
              borderWidth: showGoldBadge ? 2 : 1,
            },
          ]}
        >
          <CoverImage
            uri={artist.imageUrl}
            artistName={artist.name}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
            }}
            fallbackType="artist"
            quality="medium"
          />
        </View>

        {showGoldBadge && (
          <View
            style={[
              styles.superfanCornerBadge,
              { borderColor: colors.background },
            ]}
          >
            <Star size={11} color="#09090b" fill="#09090b" />
          </View>
        )}
      </View>

      <Text
        style={[styles.artistName, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {artist.name}
      </Text>
    </TouchableOpacity>
  );

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
          title={isVisiting ? `Ídolos de @${username}` : 'Ídolos e Superfã'}
          subtitle="Artistas que você acompanha de perto e aqueles dos quais você é superfã."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
        />

        {isLoading && artists.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : artists.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <UserCheck size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum artista seguido ainda
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Siga seus artistas favoritos ou torne-se superfã para vê-los aqui.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 24 }}>
            {/* Seção Superfã */}
            {superfans.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View
                    style={[
                      styles.sectionIconPill,
                      { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
                    ]}
                  >
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Superfã
                  </Text>
                  <Text style={[styles.sectionCount, { color: '#f59e0b' }]}>
                    {superfans.length}
                  </Text>
                </View>

                <View style={styles.circleGrid}>
                  {superfans.map((artist) => renderCircularArtist(artist, true))}
                </View>
              </View>
            )}

            {/* Seção Ídolos (Artistas Seguidos) */}
            {regularIdols.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View
                    style={[
                      styles.sectionIconPill,
                      { backgroundColor: 'rgba(168, 85, 247, 0.16)' },
                    ]}
                  >
                    <UserCheck size={14} color="#a855f7" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Ídolos
                  </Text>
                  <Text
                    style={[styles.sectionCount, { color: colors.mutedForeground }]}
                  >
                    {regularIdols.length}
                  </Text>
                </View>

                <View style={styles.circleGrid}>
                  {regularIdols.map((artist) =>
                    renderCircularArtist(artist, false)
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 42,
    gap: 18,
  },
  loadingBox: {
    flex: 1,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconPill: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionCount: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: 18,
  },
  artistCircleItem: {
    alignItems: 'center',
    gap: 7,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superfanCornerBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15.5,
  },
});
