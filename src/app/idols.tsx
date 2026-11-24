import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import { CoverImage } from '@/components/CoverImage';
import { type CatalogArtist } from '@/services/musicBrainz.service';
import { getUserFollowedArtists } from '@/services/profile.service';
import { toggleFollowArtistInSupabase } from '@/services/catalog.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

export default function IdolsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [idols, setIdols] = useState<CatalogArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INFINITE_PAGE_SIZE);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (isVisiting && username) {
          const data = await getUserFollowedArtists({ username });
          if (active) setIdols(data);
        } else if (user) {
          const data = await getUserFollowedArtists({ userId: user.id });
          if (active) setIdols(data);
        } else {
          setIdols([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isVisiting, username, user]);

  const handleUnfollow = async (artist: CatalogArtist) => {
    if (isVisiting) return;
    if (user) {
      await toggleFollowArtistInSupabase(user.id, artist, true);
    }
    setIdols((prev) => prev.filter((item) => item.id !== artist.id));
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
        scrollEventThrottle={32}
        onScroll={(e) => {
          if (visibleCount < idols.length && isNearScrollBottom(e)) {
            setVisibleCount((prev) => Math.min(idols.length, prev + INFINITE_PAGE_SIZE));
          }
        }}
      >
        <PageHeader
          title={isVisiting ? `Ídolos de @${username}` : 'Ídolos'}
          subtitle="Artistas que você segue e acompanha de perto no cenário musical."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
        />

        {isLoading && idols.length === 0 ? (
          <View style={{ flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <View style={styles.grid}>
          {idols.slice(0, visibleCount).map((artist) => (
            <View
              key={artist.id}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.cardTouch}
                onPress={() => router.push(`/artist/${artist.id}` as any)}
                activeOpacity={0.85}
              >
                <CoverImage
                  uri={artist.imageUrl}
                  artistName={artist.name}
                  style={styles.avatar}
                  fallbackType="artist"
                />
                <Text
                  style={[styles.artistName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {artist.name}
                </Text>
                <Text
                  style={{ fontSize: 11, color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {artist.genre}
                </Text>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  {artist.nbFans.toLocaleString('pt-BR')} ouvintes
                </Text>
              </TouchableOpacity>

              {!isVisiting && (
                <TouchableOpacity
                  onPress={() => handleUnfollow(artist)}
                  style={[
                    styles.followingBtn,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Seguindo ✓
                  </Text>
                </TouchableOpacity>
              )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  cardTouch: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  followingBtn: {
    marginTop: 10,
    width: '100%',
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
