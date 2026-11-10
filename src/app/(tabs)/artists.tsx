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
  User,
  Award,
  X,
  Star,
  Radio,
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

type SearchCategory =
  | 'all'
  | 'artist'
  | 'album'
  | 'ep'
  | 'single'
  | 'track'
  | 'user';

interface CommunityUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  route: string;
}

const COMMUNITY_USERS: CommunityUser[] = [
  {
    id: 'user-1',
    name: 'Ana Beatriz',
    username: 'anabeat',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=250&auto=format&fit=crop',
    bio: 'Amante de música pop, indie e crítica sonora.',
    route: '/(tabs)/profile',
  },
  {
    id: 'user-2',
    name: 'Lucas Sound',
    username: 'lucas_snd',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
    bio: 'Entusiasta de álbuns conceituais e vinil.',
    route: '/user/lucas_snd',
  },
  {
    id: 'user-3',
    name: 'Beat Critic',
    username: 'beatcritic',
    avatar:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
    bio: 'Crítico de música eletrônica, rock e hip-hop.',
    route: '/user/beatcritic',
  },
];

export default function GlobalSearchScreen() {
  const { colors } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
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
  const [users, setUsers] = useState<CommunityUser[]>(COMMUNITY_USERS);

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

  useEffect(() => {
    let isMounted = true;
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setArtists(FEATURED_ARTISTS.slice(0, 10));
      setReleases(getInternalAlbumsStore());
      setTracks(INITIAL_TOP_TRACKS.slice(0, 10));
      setUsers(COMMUNITY_USERS);
      setIsLoading(false);
      return;
    }

    // Resultados instantâneos locais
    const local = searchLocalCatalogInstant(trimmed);
    const matchedUsers = COMMUNITY_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        u.username.toLowerCase().includes(trimmed.toLowerCase()) ||
        u.bio.toLowerCase().includes(trimmed.toLowerCase())
    );

    setArtists(local.artists);
    setReleases(local.albums);
    setTracks(local.tracks);
    setUsers(matchedUsers);

    const hasInstant =
      local.artists.length > 0 ||
      local.albums.length > 0 ||
      local.tracks.length > 0 ||
      matchedUsers.length > 0;
    setIsLoading(!hasInstant);

    const timer = setTimeout(async () => {
      try {
        const shouldSearchArtists =
          activeCategory === 'all' || activeCategory === 'artist';
        const shouldSearchReleases =
          activeCategory === 'all' ||
          activeCategory === 'album' ||
          activeCategory === 'ep' ||
          activeCategory === 'single';
        const shouldSearchTracks =
          activeCategory === 'all' || activeCategory === 'track';

        const [artistRes, albumRes, trackRes] = await Promise.all([
          shouldSearchArtists
            ? searchArtistsInMusicBrainz(trimmed, 12, 0)
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

        // Mesclar álbuns / EPs / singles
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
  const filteredSingles = releases.filter((r) => r.record_type === 'single');

  const showArtists =
    (activeCategory === 'all' || activeCategory === 'artist') &&
    artists.length > 0;
  const showAlbums =
    (activeCategory === 'all' || activeCategory === 'album') &&
    (activeCategory === 'album' ? releases.length > 0 : filteredAlbums.length > 0);
  const showEps =
    (activeCategory === 'all' || activeCategory === 'ep') &&
    filteredEps.length > 0;
  const showSingles =
    (activeCategory === 'all' || activeCategory === 'single') &&
    filteredSingles.length > 0;
  const showTracks =
    (activeCategory === 'all' || activeCategory === 'track') &&
    tracks.length > 0;
  const showUsers =
    (activeCategory === 'all' || activeCategory === 'user') &&
    users.length > 0;

  const hasAnyResult =
    showArtists ||
    showAlbums ||
    showEps ||
    showSingles ||
    showTracks ||
    showUsers;

  const albumsToRender =
    activeCategory === 'album'
      ? filteredAlbums.length > 0
        ? filteredAlbums
        : releases
      : filteredAlbums;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header de Busca Unificada */}
      <View
        style={[
          styles.headerBox,
          { borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Buscar no Musicpostr
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Encontre artistas, músicas, usuários, álbuns, EPs e singles em todo o
          catálogo e comunidade.
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
          <Search size={17} color={colors.mutedForeground} />
          <TextInput
            placeholder="Buscar artistas, músicas, álbuns, EPs, singles ou usuários..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Abas de Categoria */}
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
              { key: 'single', label: 'Singles' },
              { key: 'user', label: 'Usuários' },
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
            Pesquisando no catálogo e na comunidade...
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
            {`Nenhum resultado encontrado para "${searchQuery}" nesta categoria.`}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          {/* 1. Artistas */}
          {showArtists && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Mic size={17} color={colors.amber} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Artistas ({artists.length})
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {artists
                  .slice(0, activeCategory === 'artist' ? 24 : 5)
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
                              Artista • {artist.genre || 'Catálogo'}
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

          {/* 2. Músicas */}
          {showTracks && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Music size={17} color={colors.emerald} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Músicas ({tracks.length})
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {tracks
                  .slice(0, activeCategory === 'track' ? 24 : 5)
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
                  Álbuns ({albumsToRender.length})
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
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: `${colors.primary}18` },
                        ]}
                      >
                        <Star
                          size={11}
                          color={colors.primary}
                          fill={colors.primary}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: colors.primary,
                          }}
                        >
                          {album.communityRating.toFixed(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {/* 4. EPs */}
          {showEps && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Radio size={17} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  EPs ({filteredEps.length})
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {filteredEps.map((ep) => (
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

          {/* 5. Singles */}
          {showSingles && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Radio size={17} color={colors.amber} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Singles ({filteredSingles.length})
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {filteredSingles.map((single) => (
                  <TouchableOpacity
                    key={single.id}
                    style={[
                      styles.itemRowCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => router.push(`/album/${single.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={single.cover_medium || single.cover_big}
                      style={styles.thumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.itemTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {single.title}
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        Single • {single.artist?.name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.primary,
                      }}
                    >
                      Ver Single →
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 6. Usuários */}
          {showUsers && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <User size={17} color="#3b82f6" />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Usuários ({users.length})
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.itemRowCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => router.push(user.route as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={user.avatar}
                      style={[styles.thumb, { borderRadius: 999 }]}
                      fallbackType="artist"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.itemTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {user.name}
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        @{user.username} • {user.bio}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.primary,
                      }}
                    >
                      Perfil →
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  },
  headerBox: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
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
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
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
    fontSize: 16,
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
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
