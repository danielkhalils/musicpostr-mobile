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
  Award,
  Globe,
  Sparkles,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogAlbum,
  getInstantArtistPreview,
  fetchArtistDetailsFromMusicBrainz,
  getFollowedArtistIds,
  toggleFollowArtist,
  subscribeAlbumsUpdated,
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
  const [artistGenre, setArtistGenre] = useState(
    initialPreview?.genre || 'Artista Oficial'
  );
  const [artistCountry, setArtistCountry] = useState(
    initialPreview?.country || ''
  );
  const [artistFans, setArtistFans] = useState(
    initialPreview?.nbFans || 2150
  );
  const [albums, setAlbums] = useState<CatalogAlbum[]>(
    initialPreview?.albums || []
  );
  const [epsAndSingles, setEpsAndSingles] = useState<CatalogAlbum[]>(
    initialPreview?.epsAndSingles || []
  );
  const [isLoading, setIsLoading] = useState(!initialPreview);
  const [isSyncing, setIsSyncing] = useState(false);

  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    getFollowedArtistIds()
  );

  const [visibleAlbumsCount, setVisibleAlbumsCount] = useState(10);
  const [visibleEpsCount, setVisibleEpsCount] = useState(10);

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFollowedIds(getFollowedArtistIds());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setVisibleAlbumsCount(10);
    setVisibleEpsCount(10);

    const preview = getInstantArtistPreview(id);
    if (preview) {
      setArtistName(preview.name);
      setArtistBanner(preview.bannerUrl);
      setArtistGenre(preview.genre);
      setArtistCountry(preview.country);
      setArtistFans(preview.nbFans);
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
        if (details.genre) setArtistGenre(details.genre);
        if (details.country) setArtistCountry(details.country);
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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/artists' as any);
    }
  };

  const isFollowing = Boolean(id && followedIds.includes(id));

  const handleToggleFollow = () => {
    if (!id) return;
    const next = toggleFollowArtist({
      id,
      name: artistName || 'Artista',
      imageUrl: artistBanner,
      genre: artistGenre,
      country: artistCountry,
      nbFans: artistFans,
    });
    setFollowedIds(next);
  };

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
        {/* Card do Artista com Foto de Capa (Cover Photo) */}
        <View
          style={[
            styles.artistHeroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Foto de Capa do Artista */}
          <View style={styles.coverPhotoWrapper}>
            <CoverImage
              uri={artistBanner}
              style={styles.coverPhotoImg}
              fallbackType="artist"
              quality="medium"
            />
            <View style={styles.coverPhotoOverlay} />

            {/* Botão Voltar sobre a Foto de Capa */}
            <TouchableOpacity
              style={styles.backFloatingBtn}
              onPress={handleGoBack}
              activeOpacity={0.85}
            >
              <ArrowLeft size={16} color="#fff" />
              <Text style={styles.backFloatingBtnText}>Voltar</Text>
            </TouchableOpacity>

            {/* Badge de Sincronização ou Oficial */}
            <View style={styles.coverTopRightBadge}>
              {isSyncing ? (
                <View style={styles.syncPill}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.syncPillText}>Sincronizando...</Text>
                </View>
              ) : (
                <View style={styles.verifiedPill}>
                  <Sparkles size={11} color="#fff" />
                  <Text style={styles.syncPillText}>Artista Oficial</Text>
                </View>
              )}
            </View>
          </View>

          {/* Informações e Ações do Artista abaixo da Capa */}
          <View style={styles.artistInfoBody}>
            <View style={styles.artistTitleRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={[styles.artistTitle, { color: colors.foreground }]}
                >
                  {artistName || 'Detalhes do Artista'}
                </Text>

                <View style={styles.artistMetaRow}>
                  <View
                    style={[
                      styles.genreBadge,
                      {
                        backgroundColor: `${colors.primary}18`,
                        borderColor: `${colors.primary}38`,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: colors.primary,
                      }}
                    >
                      {artistGenre}
                    </Text>
                  </View>

                  {Boolean(artistCountry) && (
                    <View
                      style={[
                        styles.countryBadge,
                        {
                          backgroundColor: colors.secondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Globe size={11} color={colors.mutedForeground} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: colors.mutedForeground,
                        }}
                      >
                        {artistCountry}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleToggleFollow}
                style={[
                  styles.followArtistBtn,
                  {
                    backgroundColor: isFollowing
                      ? colors.primary
                      : colors.secondary,
                    borderColor: isFollowing ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Award
                  size={14}
                  color={isFollowing ? '#fff' : colors.foreground}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: isFollowing ? '#fff' : colors.foreground,
                  }}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir Ídolo'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Métricas Rápidas da Discografia */}
            <View
              style={[
                styles.statsStrip,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {albums.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  Álbuns
                </Text>
              </View>

              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {epsAndSingles.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  EPs & Singles
                </Text>
              </View>

              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {artistFans.toLocaleString('pt-BR')}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  Fãs na Comunidade
                </Text>
              </View>
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
    paddingBottom: 40,
    gap: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistHeroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverPhotoWrapper: {
    height: 195,
    width: '100%',
    position: 'relative',
  },
  coverPhotoImg: {
    width: '100%',
    height: '100%',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.34)',
  },
  backFloatingBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backFloatingBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  coverTopRightBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
  },
  syncPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  artistInfoBody: {
    padding: 16,
    gap: 14,
  },
  artistTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  artistTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  artistMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  followArtistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
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
