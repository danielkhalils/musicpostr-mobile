import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Award,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogArtist,
  FEATURED_ARTISTS,
  searchArtistsInMusicBrainz,
  getFollowedArtistIds,
  toggleFollowArtist,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

export default function ArtistsScreen() {
  const ITEMS_PER_PAGE = 18;
  const { colors } = useAppTheme();

  const [artists, setArtists] = useState<CatalogArtist[]>(() =>
    FEATURED_ARTISTS.slice(0, ITEMS_PER_PAGE)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    getFollowedArtistIds()
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFollowedIds(getFollowedArtistIds());
    });
    return unsubscribe;
  }, []);

  const handleToggleFollow = (artist: CatalogArtist) => {
    const nextIds = toggleFollowArtist(artist);
    setFollowedIds(nextIds);
  };

  useEffect(() => {
    let isMounted = true;
    const trimmed = searchQuery.trim();
    const offset = (page - 1) * ITEMS_PER_PAGE;

    if (!trimmed && page === 1) {
      setArtists(FEATURED_ARTISTS.slice(0, ITEMS_PER_PAGE));
      setHasMore(true);
      setIsLoading(false);
      return;
    }

    if (trimmed && page === 1) {
      const instantMatches = FEATURED_ARTISTS.filter((a) =>
        a.name.toLowerCase().includes(trimmed.toLowerCase())
      );
      if (instantMatches.length > 0) {
        setArtists(instantMatches);
      }
    }

    const timeoutId = setTimeout(
      async () => {
        if (
          !trimmed ||
          FEATURED_ARTISTS.filter((a) =>
            a.name.toLowerCase().includes(trimmed.toLowerCase())
          ).length === 0
        ) {
          setIsLoading(true);
        }
        try {
          const { artists: fetchedArtists, total } =
            await searchArtistsInMusicBrainz(
              searchQuery,
              ITEMS_PER_PAGE,
              offset
            );
          if (!isMounted) return;
          setArtists(fetchedArtists);
          setHasMore(
            offset + fetchedArtists.length < total &&
              fetchedArtists.length >= ITEMS_PER_PAGE
          );
        } catch {
          // ignore network errors
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      },
      trimmed ? 250 : 0
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, page]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.headerBox,
          { borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Buscar Artistas
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Pesquise e toque em um artista para ver o banner, discografia, álbuns,
          EPs e singles oficiais.
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="Digite o nome de um artista ou banda..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : artists.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            {`Nenhum artista encontrado para "${searchQuery}".`}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.gridContainer}>
            {artists.map((artist) => {
              const isFollowing = followedIds.includes(artist.id);
              return (
                <View
                  key={artist.id}
                  style={[
                    styles.artistCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.artistTouchArea}
                    onPress={() => router.push(`/artist/${artist.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={artist.imageUrl}
                      style={styles.artistAvatar}
                      fallbackType="artist"
                    />
                    <Text
                      style={[
                        styles.artistName,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {artist.name}
                    </Text>
                    <Text
                      style={[
                        styles.artistFans,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {artist.nbFans
                        ? `${artist.nbFans.toLocaleString('pt-BR')} ouvintes`
                        : artist.genre || 'Artista'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleFollow(artist)}
                    style={[
                      styles.followBtn,
                      {
                        backgroundColor: isFollowing
                          ? colors.primary
                          : colors.secondary,
                        borderColor: isFollowing
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Award
                      size={12}
                      color={isFollowing ? '#fff' : colors.foreground}
                      fill={isFollowing ? '#fff' : 'transparent'}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isFollowing ? '#fff' : colors.foreground,
                      }}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.paginationRow}>
            <TouchableOpacity
              disabled={page === 1 || isLoading}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: page === 1 ? 0.45 : 1,
                },
              ]}
            >
              <ChevronLeft size={16} color={colors.foreground} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Página{' '}
              <Text style={{ fontWeight: '800', color: colors.foreground }}>
                {page}
              </Text>
            </Text>

            <TouchableOpacity
              disabled={!hasMore || isLoading}
              onPress={() => setPage((p) => p + 1)}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: !hasMore ? 0.45 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }}>
                Próxima
              </Text>
              <ChevronRight size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </>
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  artistCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  artistTouchArea: {
    alignItems: 'center',
    width: '100%',
  },
  artistAvatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    marginBottom: 10,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  artistFans: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 24,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
