import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Disc,
  Mic,
  Music,
  Award,
  X,
  Radio,
  Layers,
  Building2,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type CatalogArtist,
  type CatalogAlbum,
  type CatalogTrack,
  FEATURED_ARTISTS,
  INITIAL_TOP_TRACKS,
  getInternalAlbumsStore,
  searchLocalCatalogInstant,
  searchAlbumsInMusicBrainz,
  searchArtistsInMusicBrainz,
  searchTracksInMusicBrainz,
  getFollowedArtistIds,
  toggleFollowArtist,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SearchCategory =
  | 'all'
  | 'artist'
  | 'track'
  | 'album'
  | 'ep'
  | 'genre'
  | 'label';

const MUSIC_GENRES = [
  { name: 'Pop', emoji: '🎤' },
  { name: 'Hip-Hop', emoji: '🔥' },
  { name: 'Rock', emoji: '🎸' },
  { name: 'Indie', emoji: '🎧' },
  { name: 'R&B', emoji: '🎷' },
  { name: 'Eletrônica', emoji: '⚡' },
  { name: 'MPB', emoji: '🇧🇷' },
  { name: 'Samba e Pagode', emoji: '🥁' },
  { name: 'Metal', emoji: '🤘' },
  { name: 'Jazz', emoji: '🎺' },
  { name: 'Trap', emoji: '💣' },
  { name: 'K-Pop', emoji: '✨' },
];

const RECORD_LABELS = [
  { name: 'Sony Music', desc: 'Columbia, RCA, Epic' },
  { name: 'Universal Music Group', desc: 'Interscope, Republic, Def Jam' },
  { name: 'Warner Music Group', desc: 'Atlantic, Elektra, Parlophone' },
  { name: 'Sub Pop', desc: 'Indie & Alternative' },
  { name: 'XL Recordings', desc: 'Indie, Eletrônica & Hip-Hop' },
  { name: 'Som Livre', desc: 'Nacional & MPB' },
  { name: '4AD', desc: 'Post-Punk & Dream Pop' },
  { name: 'Def Jam Recordings', desc: 'Hip-Hop & R&B Legend' },
  { name: 'Atlantic Records', desc: 'Pop, Rock & Urban' },
  { name: 'Interscope Records', desc: 'Pop, Hip-Hop & Mainstream' },
];

export default function GlobalSearchScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [artists, setArtists] = useState<CatalogArtist[]>(() =>
    FEATURED_ARTISTS.slice(0, 10)
  );
  const [releases, setReleases] = useState<CatalogAlbum[]>(() =>
    getInternalAlbumsStore()
  );
  const [tracks, setTracks] = useState<CatalogTrack[]>(() =>
    INITIAL_TOP_TRACKS.slice(0, 10)
  );

  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    getFollowedArtistIds()
  );

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

  const handleSelectGenre = (genre: string) => {
    if (selectedGenre === genre) {
      setSelectedGenre(null);
      setSearchQuery('');
    } else {
      setSelectedGenre(genre);
      setSelectedLabel(null);
      setSearchQuery(genre);
    }
  };

  const handleSelectLabel = (label: string) => {
    if (selectedLabel === label) {
      setSelectedLabel(null);
      setSearchQuery('');
    } else {
      setSelectedLabel(label);
      setSelectedGenre(null);
      setSearchQuery(label);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setArtists(FEATURED_ARTISTS.slice(0, 10));
      setReleases(getInternalAlbumsStore());
      setTracks(INITIAL_TOP_TRACKS.slice(0, 10));
      setIsLoading(false);
      return;
    }

    // Resultados instantâneos locais
    const local = searchLocalCatalogInstant(trimmed);
    setArtists(local.artists);
    setReleases(local.albums);
    setTracks(local.tracks);

    const hasInstant =
      local.artists.length > 0 ||
      local.albums.length > 0 ||
      local.tracks.length > 0;
    setIsLoading(!hasInstant);

    const timer = setTimeout(async () => {
      try {
        const shouldSearchArtists =
          activeCategory === 'all' ||
          activeCategory === 'artist' ||
          activeCategory === 'genre' ||
          activeCategory === 'label';
        const shouldSearchReleases =
          activeCategory === 'all' ||
          activeCategory === 'album' ||
          activeCategory === 'ep' ||
          activeCategory === 'genre';
        const shouldSearchTracks =
          activeCategory === 'all' || activeCategory === 'track';

        const [artistRes, albumRes, trackRes] = await Promise.all([
          shouldSearchArtists
            ? searchArtistsInMusicBrainz(trimmed, 14, 0)
            : Promise.resolve({ artists: local.artists, total: 0 }),
          shouldSearchReleases
            ? searchAlbumsInMusicBrainz(trimmed, 18, 0)
            : Promise.resolve({ albums: local.albums, total: 0 }),
          shouldSearchTracks
            ? searchTracksInMusicBrainz(trimmed, 10)
            : Promise.resolve(local.tracks),
        ]);

        if (!isMounted) return;

        // Mesclar artistas
        const artistMap = new Map<string, CatalogArtist>();
        local.artists.forEach((a) => artistMap.set(a.id, a));
        artistRes.artists.forEach((a) => artistMap.set(a.id, a));
        setArtists(Array.from(artistMap.values()));

        // Mesclar álbuns / EPs
        const releaseMap = new Map<string, CatalogAlbum>();
        local.albums.forEach((r) => releaseMap.set(r.id, r));
        albumRes.albums.forEach((r) => releaseMap.set(r.id, r));
        setReleases(Array.from(releaseMap.values()));

        // Mesclar músicas
        const trackMap = new Map<string, CatalogTrack>();
        local.tracks.forEach((t) => trackMap.set(t.id, t));
        trackRes.forEach((t) => trackMap.set(t.id, t));
        setTracks(Array.from(trackMap.values()));
      } catch {
        // ignore network errors
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 260);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeCategory]);

  const filteredAlbums = releases.filter((r) => r.record_type === 'album');
  const filteredEps = releases.filter((r) => r.record_type === 'ep');

  const showArtists =
    (activeCategory === 'all' ||
      activeCategory === 'artist' ||
      activeCategory === 'genre' ||
      activeCategory === 'label') &&
    artists.length > 0;
  const showTracks =
    (activeCategory === 'all' || activeCategory === 'track') &&
    tracks.length > 0;
  const showAlbums =
    (activeCategory === 'all' || activeCategory === 'album') &&
    (activeCategory === 'album'
      ? releases.length > 0
      : filteredAlbums.length > 0);
  const showEps =
    (activeCategory === 'all' || activeCategory === 'ep') &&
    filteredEps.length > 0;
  const showGenres =
    activeCategory === 'all' || activeCategory === 'genre';
  const showLabels =
    activeCategory === 'all' || activeCategory === 'label';

  const hasAnyResult =
    showArtists ||
    showTracks ||
    showAlbums ||
    showEps ||
    showGenres ||
    showLabels;

  const albumsToRender =
    activeCategory === 'album'
      ? filteredAlbums.length > 0
        ? filteredAlbums
        : releases
      : filteredAlbums;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Título Principal da Página */}
      <View style={styles.pageHeaderBlock}>
        <Text style={[styles.mainPageTitle, { color: colors.foreground }]}>
          Pesquisar
        </Text>
      </View>
      {/* Barra de pesquisa e Filtros no topo (Sem sessão de introdução) */}
      <View style={styles.topFilterBar}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            placeholder="Buscar artistas, músicas, álbuns, EPs, gêneros..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text) {
                setSelectedGenre(null);
                setSelectedLabel(null);
              }
            }}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedGenre(null);
                setSelectedLabel(null);
              }}
            >
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Abas / Filtros de Categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {(
            [
              { key: 'all', label: 'Tudo' },
              { key: 'artist', label: 'Artistas' },
              { key: 'track', label: 'Músicas' },
              { key: 'album', label: 'Álbuns' },
              { key: 'ep', label: 'EPs' },
              { key: 'genre', label: 'Gêneros' },
              { key: 'label', label: 'Gravadoras' },
            ] as const
          ).map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? '#fff' : colors.foreground,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !hasAnyResult ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Pesquisando no catálogo...
          </Text>
        </View>
      ) : !hasAnyResult ? (
        <View style={styles.emptyBox}>
          <Search size={36} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {`Nenhum resultado encontrado para "${searchQuery}".`}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          {/* 1. Artistas em alta */}
          {showArtists && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Mic size={17} color={colors.amber} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {searchQuery
                    ? `Artistas (${artists.length})`
                    : 'Artistas em alta'}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {artists
                  .slice(0, activeCategory === 'artist' ? 24 : 6)
                  .map((artist) => {
                    const isFollowing = followedIds.includes(artist.id);
                    return (
                      <View
                        key={artist.id}
                        style={[
                          styles.itemRowCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.itemLeftTouch}
                          onPress={() =>
                            router.push(`/artist/${artist.id}` as any)
                          }
                          activeOpacity={0.85}
                        >
                          <CoverImage
                            uri={artist.imageUrl}
                            style={[styles.thumb, { borderRadius: 999 }]}
                            fallbackType="artist"
                            quality="low"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.itemTitle,
                                { color: colors.foreground },
                              ]}
                              numberOfLines={1}
                            >
                              {artist.name}
                            </Text>
                            <Text
                              style={[
                                styles.itemSubtitle,
                                { color: colors.mutedForeground },
                              ]}
                              numberOfLines={1}
                            >
                              Artista • {artist.genre || 'Oficial'}
                            </Text>
                          </View>
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
                        >
                          <Award
                            size={12}
                            color={isFollowing ? '#fff' : colors.foreground}
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
            </View>
          )}

          {/* 2. Musicas em alta */}
          {showTracks && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Music size={17} color={colors.emerald} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {searchQuery
                    ? `Músicas (${tracks.length})`
                    : 'Musicas em alta'}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {tracks
                  .slice(0, activeCategory === 'track' ? 24 : 6)
                  .map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      style={[
                        styles.itemRowCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() =>
                        router.push(
                          track.album?.id
                            ? (`/album/${track.album.id}` as any)
                            : (`/artist/${track.artist?.id || ''}` as any)
                        )
                      }
                      activeOpacity={0.85}
                    >
                      <CoverImage
                        uri={track.album?.cover_medium}
                        style={styles.thumb}
                        quality="low"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {track.title}
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          Música • {track.artist?.name} • {track.album?.title}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.primary,
                        }}
                      >
                        Ouvir →
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {/* 3. Álbuns */}
          {showAlbums && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Disc size={17} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {searchQuery
                    ? `Álbuns (${albumsToRender.length})`
                    : 'Álbuns em destaque'}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {albumsToRender
                  .slice(0, activeCategory === 'album' ? 24 : 6)
                  .map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={[
                        styles.itemRowCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => router.push(`/album/${album.id}` as any)}
                      activeOpacity={0.85}
                    >
                      <CoverImage
                        uri={album.cover_medium || album.cover_big}
                        style={styles.thumb}
                        quality="low"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {album.title}
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          Álbum • {album.artist?.name} •{' '}
                          {album.release_date?.substring(0, 4) || '2025'}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.primary,
                        }}
                      >
                        Ver álbum →
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {/* 4. EPS em alta */}
          {showEps && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Radio size={17} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {searchQuery ? `EPs (${filteredEps.length})` : 'EPS em alta'}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {filteredEps.slice(0, 6).map((ep) => (
                  <TouchableOpacity
                    key={ep.id}
                    style={[
                      styles.itemRowCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => router.push(`/album/${ep.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={ep.cover_medium || ep.cover_big}
                      style={styles.thumb}
                      quality="low"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.itemTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {ep.title}
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        EP • {ep.artist?.name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.primary,
                      }}
                    >
                      Ver EP →
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 5. Gênero Musical (antes de Buscar por gravadora) */}
          {showGenres && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Layers size={17} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Gênero musical
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}
              >
                {MUSIC_GENRES.map((item) => {
                  const isSelected = selectedGenre === item.name;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      onPress={() => handleSelectGenre(item.name)}
                      style={[
                        styles.genreChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.card,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.genreEmoji}>{item.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isSelected ? '#fff' : colors.foreground,
                        }}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 6. Buscar por gravadora (ao final da página) */}
          {showLabels && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Building2 size={17} color={colors.amber} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Buscar por gravadora
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollRow}
              >
                {RECORD_LABELS.map((item) => {
                  const isSelected = selectedLabel === item.name;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      onPress={() => handleSelectLabel(item.name)}
                      style={[
                        styles.labelCard,
                        {
                          backgroundColor: isSelected
                            ? `${colors.primary}22`
                            : colors.card,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.labelHeaderRow}>
                        <Building2
                          size={13}
                          color={
                            isSelected
                              ? colors.primary
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={[
                            styles.labelCardTitle,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.foreground,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.labelCardDesc,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 110,
    gap: 16,
  },
  pageHeaderBlock: {
    paddingVertical: 2,
    marginBottom: -4,
  },
  mainPageTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  topFilterBar: {
    gap: 12,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  categoriesRow: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipsScrollRow: {
    gap: 8,
    paddingVertical: 2,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  genreEmoji: {
    fontSize: 13,
  },
  labelCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 145,
    gap: 3,
  },
  labelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  labelCardDesc: {
    fontSize: 10.5,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemLeftTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
  },
});
