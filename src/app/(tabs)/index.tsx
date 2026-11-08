import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  Star,
  Play,
  Disc,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Mail,
  Flame,
  Award,
  Music,
  Compass,
  Headphones,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogAlbum,
  type CatalogTrack,
  getHighlightAlbums,
  getPopularAlbumsByInternalActivity,
  getTopRatedAlbumsByInternalReviews,
  getInitialNewReleases,
  fetchNewReleasesFromMusicBrainz,
  subscribeAlbumsUpdated,
  INITIAL_TOP_TRACKS,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

const GENRES = [
  { id: 'Pop', name: 'Pop', bg: '#db2777' },
  { id: 'Rock', name: 'Rock', bg: '#b91c1c' },
  { id: 'Hip-Hop', name: 'Hip-Hop', bg: '#6d28d9' },
  { id: 'Eletrônica', name: 'Eletrônica', bg: '#0284c7' },
  { id: 'Indie', name: 'Indie / Alt', bg: '#059669' },
  { id: 'R&B', name: 'R&B', bg: '#d97706' },
];

export default function HomeScreen() {
  const { colors } = useAppTheme();

  const [highlights, setHighlights] = useState<CatalogAlbum[]>(() =>
    getHighlightAlbums(10)
  );
  const [popularAlbums, setPopularAlbums] = useState<CatalogAlbum[]>(() =>
    getPopularAlbumsByInternalActivity(8)
  );
  const [newReleases, setNewReleases] = useState<CatalogAlbum[]>(() =>
    getInitialNewReleases(8)
  );
  const [topRatedAlbums, setTopRatedAlbums] = useState<CatalogAlbum[]>(() =>
    getTopRatedAlbumsByInternalReviews(8)
  );
  const [topTracks] = useState<CatalogTrack[]>(INITIAL_TOP_TRACKS);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setHighlights(getHighlightAlbums(10));
      setPopularAlbums(getPopularAlbumsByInternalActivity(8));
      setTopRatedAlbums(getTopRatedAlbumsByInternalReviews(8));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchNewReleasesFromMusicBrainz(8)
      .then((mbNewReleases) => {
        if (isMounted && mbNewReleases.length > 0) {
          setNewReleases(mbNewReleases);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const currentAlbum = highlights[activeIndex] || popularAlbums[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HERO BANNER DE DESTAQUES */}
      {currentAlbum && (
        <View
          style={[
            styles.heroSection,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <CoverImage
              uri={currentAlbum.cover_big || currentAlbum.cover_medium}
              style={styles.heroCoverImg}
            />
            <View style={styles.heroTextCol}>
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: `${colors.primary}40`,
                  },
                ]}
              >
                <Sparkles size={12} color={colors.primary} />
                <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                  Destaque da Crítica
                </Text>
              </View>

              <Text
                style={[styles.heroTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {currentAlbum.title}
              </Text>
              <Text
                style={[styles.heroArtist, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                por{' '}
                <Text style={{ color: colors.primary, fontWeight: '800' }}>
                  {currentAlbum.artist?.name}
                </Text>
              </Text>

              <View style={styles.heroMetaRow}>
                <View
                  style={[
                    styles.ratingPill,
                    { backgroundColor: `${colors.amber}25` },
                  ]}
                >
                  <Star size={12} color={colors.amber} fill={colors.amber} />
                  <Text style={[styles.ratingPillText, { color: colors.amber }]}>
                    {currentAlbum.communityRating.toFixed(1)} / 10
                  </Text>
                </View>
                <Text
                  style={[styles.metaDot, { color: colors.mutedForeground }]}
                >
                  •
                </Text>
                <Text
                  style={[styles.metaYear, { color: colors.mutedForeground }]}
                >
                  {currentAlbum.release_date?.substring(0, 4) || '2026'}
                </Text>
              </View>

              <View style={styles.listenersRow}>
                <Headphones size={12} color={colors.primary} />
                <Text
                  style={[
                    styles.listenersText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {currentAlbum.listenersCount.toLocaleString('pt-BR')} ouvintes
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.heroButtonsRow}>
            <TouchableOpacity
              style={[
                styles.primaryHeroBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push(`/album/${currentAlbum.id}` as any)}
              activeOpacity={0.85}
            >
              <Play size={14} color="#fff" fill="#fff" />
              <Text style={styles.primaryHeroBtnText}>Ouvir e Avaliar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryHeroBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push('/(tabs)/reviews')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.secondaryHeroBtnText,
                  { color: colors.foreground },
                ]}
              >
                Ver Comunidade
              </Text>
            </TouchableOpacity>
          </View>

          {/* Barra horizontal de miniaturas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbScrollContent}
          >
            {highlights.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveIndex(idx)}
                  style={[
                    styles.thumbCard,
                    {
                      borderColor: isSelected
                        ? colors.primary
                        : 'transparent',
                      opacity: isSelected ? 1 : 0.65,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <CoverImage
                    uri={item.cover_medium || item.cover_big}
                    style={styles.thumbImg}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 2. ÁLBUNS POPULARES DO MOMENTO */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Álbuns Populares
            </Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/top-albuns' as any)}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Ver lista completa
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.albumGrid}>
          {popularAlbums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={[
                styles.albumCard,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push(`/album/${album.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.coverBox}>
                <CoverImage
                  uri={album.cover_big || album.cover_medium}
                  style={styles.albumCover}
                />
                <View
                  style={[
                    styles.scoreFloatingBadge,
                    { backgroundColor: 'rgba(9,9,11,0.88)' },
                  ]}
                >
                  <Text style={[styles.scoreFloatingText, { color: colors.primary }]}>
                    ★ {album.communityRating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.albumTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {album.title}
              </Text>
              <Text
                style={[styles.albumArtist, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {album.artist?.name}
              </Text>
              <View style={styles.albumStatsLine}>
                <Headphones size={11} color={colors.primary} />
                <Text
                  style={[
                    styles.albumStatsText,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {album.listenersCount.toLocaleString('pt-BR')} •{' '}
                  {album.totalReviews} aval.
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. NOVOS LANÇAMENTOS */}
      {newReleases.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Flame size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Novos Lançamentos
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/rankings',
                  params: { filter: 'releases' },
                })
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Ver todos
              </Text>
              <ArrowRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {newReleases.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[
                  styles.horizontalAlbumCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/album/${album.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.coverBox}>
                  <CoverImage
                    uri={album.cover_big || album.cover_medium}
                    style={styles.horizontalCover}
                  />
                  <View
                    style={[
                      styles.newReleaseTag,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.newReleaseTagText}>
                      NOVO • {album.release_date?.substring(0, 4) || '2026'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.albumTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
                <Text
                  style={[
                    styles.albumArtist,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {album.artist?.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 4. MAIS BEM AVALIADOS PELA COMUNIDADE */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Award size={18} color={colors.amber} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Mais Bem Avaliados
            </Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/rankings',
                params: { filter: 'top-rated' },
              })
            }
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Ver ranking
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {topRatedAlbums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={[
                styles.horizontalAlbumCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push(`/album/${album.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.coverBox}>
                <CoverImage
                  uri={album.cover_big || album.cover_medium}
                  style={styles.horizontalCover}
                />
                <View
                  style={[
                    styles.scoreFloatingBadge,
                    { backgroundColor: colors.amber },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreFloatingText,
                      { color: '#000', fontWeight: '900' },
                    ]}
                  >
                    ★ {album.communityRating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.albumTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {album.title}
              </Text>
              <Text
                style={[styles.albumArtist, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {album.artist?.name}
              </Text>
              <Text
                style={[
                  styles.albumStatsText,
                  { color: colors.mutedForeground, marginTop: 2 },
                ]}
              >
                {album.totalReviews} avaliações
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. EXPLORAR POR GÊNERO */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Compass size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Explorar por Gênero
            </Text>
          </View>
        </View>

        <View style={styles.genreGrid}>
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreCard,
                {
                  width: CARD_WIDTH,
                  backgroundColor: genre.bg,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/reviews',
                  params: { genre: genre.id },
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.genreCardName}>{genre.name}</Text>
              <View style={{ alignSelf: 'flex-end', opacity: 0.85 }}>
                <Music size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 6. TOP MÚSICAS GLOBAIS */}
      {topTracks.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Music size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Top Músicas
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {topTracks.slice(0, 8).map((track, idx) => (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.trackRowCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/album/${track.album.id}` as any)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.trackRankNum,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {idx + 1}
                </Text>
                <CoverImage
                  uri={track.album?.cover_medium}
                  style={styles.trackThumb}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.trackTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text
                    style={[
                      styles.trackArtist,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {track.artist?.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.trackPlayBtn,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Play size={14} color={colors.primary} fill={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 7. FOOTER INSTITUCIONAL */}
      <View
        style={[
          styles.footerBox,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.footerBrandRow}>
          <View
            style={[
              styles.footerLogoIcon,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Disc size={18} color={colors.primary} />
          </View>
          <Text style={[styles.footerBrandName, { color: colors.foreground }]}>
            Musicpostr
          </Text>
        </View>
        <Text
          style={[styles.footerDesc, { color: colors.mutedForeground }]}
        >
          Sua rede social definitiva para diário de escuta, críticas sonoras e
          compartilhamento de notas musicais.
        </Text>

        <View style={styles.footerLinksRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Feed da Comunidade
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colors.mutedForeground }}>•</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/rankings')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Rankings e Notas
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colors.mutedForeground }}>•</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/artists')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Artistas em Alta
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.footerBottomRow,
            { borderTopColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Mail size={13} color={colors.mutedForeground} />
            <Text
              style={{ fontSize: 11, color: colors.mutedForeground }}
            >
              suporte@musicpostr.com
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} color={colors.emerald} />
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              v1.2.0-mobile • © 2026 Musicpostr
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroCoverImg: {
    width: 115,
    height: 115,
    borderRadius: 16,
  },
  heroTextCol: {
    flex: 1,
    gap: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 2,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  heroArtist: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaDot: {
    fontSize: 12,
  },
  metaYear: {
    fontSize: 12,
    fontWeight: '600',
  },
  listenersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  listenersText: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 999,
  },
  primaryHeroBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryHeroBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryHeroBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  thumbScrollContent: {
    gap: 8,
    paddingTop: 2,
  },
  thumbCard: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    paddingHorizontal: 14,
    paddingTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  albumCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
  },
  coverBox: {
    position: 'relative',
    marginBottom: 8,
  },
  albumCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  scoreFloatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  scoreFloatingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  albumArtist: {
    fontSize: 11,
    marginTop: 2,
  },
  albumStatsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  albumStatsText: {
    fontSize: 10,
  },
  horizontalAlbumCard: {
    width: 148,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
  },
  horizontalCover: {
    width: '100%',
    height: 132,
    borderRadius: 12,
  },
  newReleaseTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newReleaseTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    height: 82,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  genreCardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  trackRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  trackRankNum: {
    width: 20,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackArtist: {
    fontSize: 11,
    marginTop: 2,
  },
  trackPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBox: {
    marginTop: 28,
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogoIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBrandName: {
    fontSize: 16,
    fontWeight: '900',
  },
  footerDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerBottomRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    gap: 6,
  },
});
