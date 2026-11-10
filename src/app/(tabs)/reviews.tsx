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
import { router, useLocalSearchParams } from 'expo-router';
import {
  Award,
  Music,
  Search,
  Calendar,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Headphones,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogAlbum,
  getInternalAlbumsStore,
  searchAlbumsInMusicBrainz,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

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

export default function ReviewsScreen() {
  const limit = 14;
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ genre?: string }>();

  const [albums, setAlbums] = useState<CatalogAlbum[]>(() =>
    getInternalAlbumsStore().slice(0, limit)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [selectedLabel, setSelectedLabel] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(
    () => getInternalAlbumsStore().length
  );

  useEffect(() => {
    if (params.genre) {
      const matched = GENRES_LIST.find(
        (g) => g.name.toLowerCase() === String(params.genre).toLowerCase()
      );
      if (matched) {
        setSelectedGenre(matched.name);
      }
    }
  }, [params.genre]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setDebouncedSearch('');
      setCurrentPage(1);
      return;
    }

    const instantMatches = getInternalAlbumsStore().filter(
      (a) =>
        a.title.toLowerCase().includes(trimmed.toLowerCase()) ||
        a.artist.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (instantMatches.length > 0) {
      setAlbums(instantMatches.slice(0, limit));
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setCurrentPage(1);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const offset = (currentPage - 1) * limit;

    if (!debouncedSearch.trim()) {
      const store = getInternalAlbumsStore();
      setAlbums(store.slice(offset, offset + limit));
      setTotalResults(store.length);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      searchAlbumsInMusicBrainz(debouncedSearch, limit, offset)
        .then(({ albums: fetched, total }) => {
          if (!isMounted) return;
          setAlbums(fetched);
          setTotalResults(total);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    const unsubscribe = subscribeAlbumsUpdated(() => {
      if (!debouncedSearch.trim()) {
        const store = getInternalAlbumsStore();
        setAlbums(store.slice(offset, offset + limit));
        setTotalResults(store.length);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [debouncedSearch, currentPage]);

  const availableYears = Array.from(
    new Set(albums.map((a) => a.release_date?.substring(0, 4)).filter(Boolean))
  )
    .sort()
    .reverse();

  const filteredAlbums = albums.filter((album) => {
    const albumYear = album.release_date?.substring(0, 4) || '';
    const matchYear = selectedYear ? albumYear === selectedYear : true;
    const matchGenre =
      selectedGenre === 'Todos' ? true : album.genreName === selectedGenre;
    const matchLabel = selectedLabel ? album.label === selectedLabel : true;
    return matchYear && matchGenre && matchLabel;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.headerBox,
          { borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.titleRow}>
          <Award size={26} color={colors.primary} />
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Avaliações da Comunidade
          </Text>
        </View>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Explore álbuns, EPs e singles no MusicBrainz, filtre por ano e gênero
          para refinar suas descobertas ({totalResults} resultados).
        </Text>

        {/* Barra de pesquisa */}
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
            placeholder="Pesquisar álbum, EP, single ou artista..."
            placeholderTextColor={colors.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtro por Gênero */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
          Filtrar por Momento ou Gênero
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {GENRES_LIST.map((item) => {
            const active = selectedGenre === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => setSelectedGenre(item.name)}
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
                  style={[
                    styles.genreChipText,
                    { color: active ? '#fff' : colors.foreground },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filtro por Ano */}
      <View style={styles.sectionBlock}>
        <View style={styles.filterHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color={colors.primary} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.foreground,
              }}
            >
              Filtrar por Ano:
            </Text>
          </View>
          {(selectedYear || selectedGenre !== 'Todos' || selectedLabel) && (
            <TouchableOpacity
              onPress={() => {
                setSelectedYear('');
                setSelectedGenre('Todos');
                setSelectedLabel('');
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.primary,
                }}
              >
                Limpar filtros
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginTop: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedYear('')}
            style={[
              styles.yearChip,
              {
                backgroundColor:
                  selectedYear === '' ? colors.primary : colors.card,
                borderColor:
                  selectedYear === '' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: selectedYear === '' ? '#fff' : colors.mutedForeground,
              }}
            >
              Todos os Anos
            </Text>
          </TouchableOpacity>
          {availableYears.map((year) => {
            const active = selectedYear === year;
            return (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(active ? '' : year)}
                style={[
                  styles.yearChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? '#fff' : colors.foreground,
                  }}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid de Álbuns */}
      {isLoading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredAlbums.length === 0 ? (
        <View style={styles.emptyBox}>
          <Music size={42} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            Nenhum álbum encontrado com os filtros selecionados.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.gridContainer}>
            {filteredAlbums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[
                  styles.card,
                  {
                    width: CARD_WIDTH,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/album/${album.id}` as any)}
                activeOpacity={0.85}
              >
                <View>
                  <View style={styles.coverWrapper}>
                    <CoverImage
                      uri={album.cover_medium || album.cover_big}
                      style={styles.coverImg}
                    />
                    <View
                      style={[
                        styles.scoreBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.scoreBadgeText}>
                        {album.communityRating.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {album.title}
                  </Text>

                  <View style={styles.metaItemRow}>
                    <User size={11} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {album.artist.name}
                    </Text>
                  </View>

                  <View style={styles.metaItemRow}>
                    <Building2 size={11} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {album.label}
                    </Text>
                  </View>

                  <View style={styles.metaItemRow}>
                    <Calendar size={11} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {album.release_date?.substring(0, 4) || '2025'} (
                      {album.genreName})
                    </Text>
                  </View>

                  <View style={styles.metaItemRow}>
                    <Headphones size={11} color={colors.primary} />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {album.listenersCount.toLocaleString('pt-BR')} ouvintes
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.cardFooter,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={{ fontSize: 10, color: colors.mutedForeground }}
                  >
                    {album.totalReviews} aval.
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                    }}
                  >
                    Detalhes →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Paginação */}
          <View style={styles.paginationRow}>
            <TouchableOpacity
              disabled={currentPage === 1 || isLoading}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: currentPage === 1 ? 0.45 : 1,
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
                {currentPage}
              </Text>
            </Text>

            <TouchableOpacity
              disabled={albums.length < limit || isLoading}
              onPress={() => setCurrentPage((p) => p + 1)}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: albums.length < limit ? 0.45 : 1,
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
    paddingBottom: 110,
  },
  headerBox: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
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
  genreChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
    justifyContent: 'space-between',
  },
  coverWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  coverImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaItemText: {
    fontSize: 10.5,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
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
