import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Flame,
  TrendingUp,
  Award,
  Headphones,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogAlbum,
  getTopRatedAlbumsByInternalReviews,
  getPopularAlbumsByInternalActivity,
  getInitialNewReleases,
  fetchNewReleasesFromMusicBrainz,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';
import { TabHeader } from '@/components/TabHeader';

interface RankingAlbum extends CatalogAlbum {
  rank: number;
}

const GENRES_LIST = [
  { name: 'Todos', emoji: '🌟' },
  { name: 'Pop', emoji: '🎤' },
  { name: 'Hip-Hop', emoji: '🔥' },
  { name: 'Rock', emoji: '🎸' },
  { name: 'Indie', emoji: '🎧' },
  { name: 'Eletrônica', emoji: '⚡' },
  { name: 'R&B', emoji: '🎷' },
  { name: 'Samba e pagode', emoji: '🥁' },
];

type RankingFilterMode = 'top-rated' | 'popular' | 'releases';

function computeInitialRankings(mode: RankingFilterMode): RankingAlbum[] {
  const base =
    mode === 'releases'
      ? getInitialNewReleases(20)
      : mode === 'popular'
        ? getPopularAlbumsByInternalActivity(30)
        : getTopRatedAlbumsByInternalReviews(30);
  return base.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

export default function RankingsScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [filterMode, setFilterMode] = useState<RankingFilterMode>('top-rated');
  const [rankings, setRankings] = useState<RankingAlbum[]>(() =>
    computeInitialRankings('top-rated')
  );
  const [activeGenre, setActiveGenre] = useState<string>('Todos');

  useEffect(() => {
    if (
      params.filter &&
      ['top-rated', 'popular', 'releases'].includes(params.filter)
    ) {
      setFilterMode(params.filter as RankingFilterMode);
    }
  }, [params.filter]);

  useEffect(() => {
    let isMounted = true;
    setRankings(computeInitialRankings(filterMode));

    if (filterMode === 'releases') {
      fetchNewReleasesFromMusicBrainz(20)
        .then((freshReleases) => {
          if (isMounted && freshReleases.length > 0) {
            setRankings(
              freshReleases.map((item, idx) => ({ ...item, rank: idx + 1 }))
            );
          }
        })
        .catch(() => {});
    }

    const unsubscribe = subscribeAlbumsUpdated(() => {
      if (filterMode !== 'releases') {
        setRankings(computeInitialRankings(filterMode));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [filterMode]);

  const filteredRankings =
    activeGenre === 'Todos'
      ? rankings
      : rankings.filter(
          (r) =>
            (r.genreName ?? '').toLowerCase() === activeGenre.toLowerCase()
        );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TabHeader title="Rankings" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      {/* Filtros de Ranking no Topo */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setFilterMode('top-rated')}
            style={[
              styles.modePill,
              {
                backgroundColor:
                  filterMode === 'top-rated' ? colors.primary : colors.card,
                borderColor:
                  filterMode === 'top-rated' ? colors.primary : colors.border,
              },
            ]}
          >
            <Award
              size={14}
              color={
                filterMode === 'top-rated' ? '#fff' : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.modePillText,
                {
                  color:
                    filterMode === 'top-rated' ? '#fff' : colors.foreground,
                },
              ]}
            >
              Mais Bem Avaliados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('popular')}
            style={[
              styles.modePill,
              {
                backgroundColor:
                  filterMode === 'popular' ? colors.primary : colors.card,
                borderColor:
                  filterMode === 'popular' ? colors.primary : colors.border,
              },
            ]}
          >
            <TrendingUp
              size={14}
              color={
                filterMode === 'popular' ? '#fff' : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.modePillText,
                {
                  color: filterMode === 'popular' ? '#fff' : colors.foreground,
                },
              ]}
            >
              Populares
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('releases')}
            style={[
              styles.modePill,
              {
                backgroundColor:
                  filterMode === 'releases' ? colors.primary : colors.card,
                borderColor:
                  filterMode === 'releases' ? colors.primary : colors.border,
              },
            ]}
          >
            <Flame
              size={14}
              color={
                filterMode === 'releases' ? '#fff' : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.modePillText,
                {
                  color: filterMode === 'releases' ? '#fff' : colors.foreground,
                },
              ]}
            >
              Novos Lançamentos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Top 3 Pódio */}
      {rankings.length >= 3 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <Flame size={18} color="#f97316" />
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              Top 3 em Destaque
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {rankings.slice(0, 3).map((album, idx) => {
              const badgeColors = ['#f59e0b', '#94a3b8', '#d97706'];
              return (
                <TouchableOpacity
                  key={album.id}
                  style={[
                    styles.podiumCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        idx === 0 ? `${colors.amber}80` : colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/album/${album.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.podiumBadge,
                      { backgroundColor: badgeColors[idx] || colors.primary },
                    ]}
                  >
                    <Text style={styles.podiumBadgeText}>#{idx + 1}</Text>
                  </View>
                  <CoverImage
                    uri={album.cover_medium || album.cover_big}
                    style={styles.podiumCover}
                  />
                  <Text
                    style={[styles.podiumTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {album.title}
                  </Text>
                  <Text
                    style={[
                      styles.podiumArtist,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {album.artist.name}
                  </Text>
                  <View style={styles.podiumScoreRow}>
                    <Award size={14} color={colors.primary} />
                    <Text
                      style={[styles.podiumScoreText, { color: colors.primary }]}
                    >
                      {album.communityRating.toFixed(1)} / 10
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filtro de Gênero */}
      <View style={styles.sectionBlock}>
        <Text
          style={[
            styles.sectionHeading,
            { color: colors.foreground, marginBottom: 8 },
          ]}
        >
          Momentos e Gêneros
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {GENRES_LIST.map((item) => {
            const active = activeGenre === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => setActiveGenre(item.name)}
                style={[
                  styles.genreChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? '#fff' : colors.foreground,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista / Tabela de Rankings */}
      <View
        style={[
          styles.tableContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {filteredRankings.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.rankingRow,
              index < filteredRankings.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => router.push(`/album/${item.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={styles.rankPosCol}>
              <Text
                style={[
                  styles.rankPosNumber,
                  {
                    color:
                      item.rank <= 3 ? colors.amber : colors.mutedForeground,
                  },
                ]}
              >
                #{item.rank}
              </Text>
              <TrendingUp size={11} color={colors.emerald} />
            </View>

            <CoverImage
              uri={item.cover_medium || item.cover_big}
              style={styles.rowThumb}
            />

            <View style={styles.rowInfoCol}>
              <Text
                style={[styles.rowAlbumTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.rowArtistName,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {item.artist.name}
              </Text>
              <View style={styles.rowSubMeta}>
                <View
                  style={[
                    styles.genreMiniTag,
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
                    {item.genreName || 'Geral'}
                  </Text>
                </View>
                <Headphones size={10} color={colors.primary} />
                <Text
                  style={{ fontSize: 10, color: colors.mutedForeground }}
                >
                  {item.listenersCount.toLocaleString('pt-BR')} •{' '}
                  {item.totalReviews} aval.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.scoreCellBadge,
                {
                  backgroundColor: `${colors.primary}18`,
                  borderColor: `${colors.primary}40`,
                },
              ]}
            >
              <Text style={[styles.scoreCellText, { color: colors.primary }]}>
                {item.communityRating.toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 110,
    gap: 16,
  },
  filterBarContainer: {
    marginBottom: 4,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  podiumCard: {
    width: 155,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    position: 'relative',
  },
  podiumBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  podiumBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  podiumCover: {
    width: '100%',
    height: 135,
    borderRadius: 12,
    marginBottom: 8,
  },
  podiumTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  podiumArtist: {
    fontSize: 11,
    marginTop: 2,
  },
  podiumScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  podiumScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tableContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  rankPosCol: {
    width: 34,
    alignItems: 'center',
    gap: 2,
  },
  rankPosNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  rowThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  rowInfoCol: {
    flex: 1,
    gap: 2,
  },
  rowAlbumTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowArtistName: {
    fontSize: 11,
  },
  rowSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  genreMiniTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  scoreCellBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  scoreCellText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
