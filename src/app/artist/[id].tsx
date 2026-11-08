import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Disc,
  Radio,
  ChevronDown,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogAlbum,
  getInstantArtistPreview,
  fetchArtistDetailsFromMusicBrainz,
} from '@/services/musicBrainz.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();

  const initialPreview = id ? getInstantArtistPreview(id) : null;

  const [artistName, setArtistName] = useState(initialPreview?.name || '');
  const [artistBanner, setArtistBanner] = useState(
    initialPreview?.bannerUrl || ''
  );
  const [albums, setAlbums] = useState<CatalogAlbum[]>(
    initialPreview?.albums || []
  );
  const [epsAndSingles, setEpsAndSingles] = useState<CatalogAlbum[]>(
    initialPreview?.epsAndSingles || []
  );
  const [isLoading, setIsLoading] = useState(!initialPreview);
  const [isSyncing, setIsSyncing] = useState(false);

  const [visibleAlbumsCount, setVisibleAlbumsCount] = useState(10);
  const [visibleEpsCount, setVisibleEpsCount] = useState(10);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setVisibleAlbumsCount(10);
    setVisibleEpsCount(10);

    const preview = getInstantArtistPreview(id);
    if (preview) {
      setArtistName(preview.name);
      setArtistBanner(preview.bannerUrl);
      setAlbums(preview.albums);
      setEpsAndSingles(preview.epsAndSingles);
      setIsLoading(false);
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    fetchArtistDetailsFromMusicBrainz(id)
      .then((details) => {
        if (!isMounted) return;
        setArtistName(details.name);
        setArtistBanner(details.bannerUrl);
        setAlbums(details.albums);
        setEpsAndSingles(details.epsAndSingles);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MobileHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const displayedAlbums = albums.slice(0, visibleAlbumsCount);
  const displayedEps = epsAndSingles.slice(0, visibleEpsCount);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner do Artista */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
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
              Voltar para Artistas
            </Text>
          </TouchableOpacity>

          <View style={styles.bannerMainRow}>
            <CoverImage
              uri={artistBanner}
              style={styles.artistBannerAvatar}
              fallbackType="artist"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.artistTitle, { color: colors.foreground }]}
              >
                {artistName || 'Detalhes do Artista'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  marginTop: 4,
                  lineHeight: 17,
                }}
              >
                Discografia completa via MusicBrainz & Cover Art Archive
              </Text>
              {isSyncing && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.primary }}>
                    Sincronizando discografia...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Seção de Álbuns */}
        {albums.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Disc size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Álbuns de Estúdio ({albums.length})
              </Text>
            </View>

            <View style={styles.grid}>
              {displayedAlbums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={[
                    styles.releaseCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/album/${album.id}` as any)}
                  activeOpacity={0.85}
                >
                  <CoverImage
                    uri={album.cover_big || album.cover_medium}
                    style={styles.releaseCover}
                  />
                  <Text
                    style={[
                      styles.releaseTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {album.title}
                  </Text>
                  <View style={styles.releaseFooter}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.mutedForeground,
                      }}
                    >
                      {album.release_date?.substring(0, 4) || '—'}
                    </Text>
                    <View
                      style={[
                        styles.tagPill,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontWeight: '700',
                          color: colors.mutedForeground,
                        }}
                      >
                        Álbum
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {visibleAlbumsCount < albums.length && (
              <TouchableOpacity
                onPress={() => setVisibleAlbumsCount((prev) => prev + 10)}
                style={[
                  styles.loadMoreBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.foreground,
                  }}
                >
                  Ver mais álbuns
                </Text>
                <ChevronDown size={16} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Seção de EPs e Singles */}
        {epsAndSingles.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Radio size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                EPs e Singles ({epsAndSingles.length})
              </Text>
            </View>

            <View style={styles.grid}>
              {displayedEps.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.releaseCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/album/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  <CoverImage
                    uri={item.cover_big || item.cover_medium}
                    style={styles.releaseCover}
                  />
                  <Text
                    style={[
                      styles.releaseTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.releaseFooter}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.mutedForeground,
                      }}
                    >
                      {item.release_date?.substring(0, 4) || '—'}
                    </Text>
                    <View
                      style={[
                        styles.tagPill,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontWeight: '700',
                          color: colors.mutedForeground,
                        }}
                      >
                        {item.record_type?.toUpperCase() || 'SINGLE'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {visibleEpsCount < epsAndSingles.length && (
              <TouchableOpacity
                onPress={() => setVisibleEpsCount((prev) => prev + 10)}
                style={[
                  styles.loadMoreBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.foreground,
                  }}
                >
                  Ver mais EPs e Singles
                </Text>
                <ChevronDown size={16} color={colors.foreground} />
              </TouchableOpacity>
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
    gap: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  artistBannerAvatar: {
    width: 84,
    height: 84,
    borderRadius: 999,
  },
  artistTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  releaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
    gap: 6,
  },
  releaseCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  releaseTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  releaseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
});
