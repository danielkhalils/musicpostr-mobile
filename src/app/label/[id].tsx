import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Disc,
  Globe,
  Info,
  Layers,
  MapPin,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { CoverImage } from '@/components/CoverImage';
import { PageHeader } from '@/components/PageHeader';
import { RecordLabelLogo } from '@/components/RecordLabelLogo';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import {
  getFollowedArtistIdsFromSupabase,
  getRecordLabelDetails,
  toggleFollowArtistInSupabase,
  type RecordLabelFullDetails,
} from '@/services/catalog.service';
import { resolveDeezerArtistProfile } from '@/services/artistImage.service';
import { type CatalogArtist } from '@/services/musicBrainz.service';
import { safeGoBack } from '@/utils/navigation';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';

export default function RecordLabelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();

  const [details, setDetails] = useState<RecordLabelFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artistQuery, setArtistQuery] = useState('');
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [visibleArtistsCount, setVisibleArtistsCount] = useState(INFINITE_PAGE_SIZE);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const loadLabelPage = async () => {
      const data = await getRecordLabelDetails(id || '');
      if (!active) return;
      setDetails(data);
      setIsLoading(false);

      // Enriquece informações atualizadas dos artistas via Deezer (IDs, fotos HD e fãs)
      const enriched = await Promise.all(
        data.artists.map(async (art) => {
          try {
            const profile = await resolveDeezerArtistProfile(art.name);
            if (!profile) return art;
            return {
              ...art,
              imageUrl: art.imageUrl || profile.imageUrl || '',
              nbFans: art.nbFans > 0 ? art.nbFans : profile.nbFans || 0,
            };
          } catch {
            return art;
          }
        })
      );

      if (active) {
        setDetails((prev) => (prev ? { ...prev, artists: enriched } : prev));
      }
    };

    loadLabelPage();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setFollowedIds([]);
      return;
    }
    getFollowedArtistIdsFromSupabase(user.id).then((ids) => {
      if (active) setFollowedIds(ids);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleToggleFollow = async (artist: CatalogArtist) => {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const isFollowing = followedIds.includes(artist.id);
    setFollowedIds((prev) =>
      isFollowing ? prev.filter((item) => item !== artist.id) : [...prev, artist.id]
    );
    await toggleFollowArtistInSupabase(user.id, artist, isFollowing);
  };

  if (isLoading || !details) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const normalizedQuery = artistQuery.trim().toLowerCase();
  const filteredArtists = normalizedQuery
    ? details.artists.filter(
        (a) =>
          a.name.toLowerCase().includes(normalizedQuery) ||
          (a.genre || '').toLowerCase().includes(normalizedQuery) ||
          (a.country || '').toLowerCase().includes(normalizedQuery)
      )
    : details.artists;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={32}
      onScroll={(e) => {
        if (visibleArtistsCount < filteredArtists.length && isNearScrollBottom(e)) {
          setVisibleArtistsCount((prev) =>
            Math.min(filteredArtists.length, prev + INFINITE_PAGE_SIZE)
          );
        }
      }}
    >
      <PageHeader
        title="Gravadora Oficial"
        subtitle="Catálogo, história e elenco de artistas vinculados ao selo."
        onBack={() => safeGoBack('/(tabs)/artists')}
        backLabel="Voltar"
      />

      {/* Hero Card da Gravadora com Logo Oficial */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.heroTopRow}>
          <RecordLabelLogo name={details.name} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleBadgeRow}>
              <Text
                style={[styles.labelTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {details.name}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Check size={10} color="#fff" strokeWidth={3.5} />
              </View>
            </View>
            <Text
              style={[styles.labelSubtitle, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {details.desc}
            </Text>
          </View>
        </View>

        {/* Ficha Técnica / Informações da Gravadora */}
        <View style={styles.factsGrid}>
          <View
            style={[
              styles.factBox,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Calendar size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.factLabel, { color: colors.mutedForeground }]}>
                Fundação
              </Text>
              <Text
                style={[styles.factValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {details.founded}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.factBox,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <MapPin size={14} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.factLabel, { color: colors.mutedForeground }]}>
                Sede Principal
              </Text>
              <Text
                style={[styles.factValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {details.headquarters}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.factBox,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Building2 size={14} color={colors.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.factLabel, { color: colors.mutedForeground }]}>
                Grupo / Distribuição
              </Text>
              <Text
                style={[styles.factValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {details.parentGroup}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.factBox,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Users size={14} color="#38bdf8" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.factLabel, { color: colors.mutedForeground }]}>
                Artistas Vinculados
              </Text>
              <Text
                style={[styles.factValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {details.artists.length} {details.artists.length === 1 ? 'artista' : 'artistas'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sobre a Gravadora */}
        <View style={styles.aboutBlock}>
          <View style={styles.aboutHeaderRow}>
            <Info size={14} color={colors.primary} />
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              Sobre {details.name}
            </Text>
          </View>
          <Text style={[styles.aboutBio, { color: colors.mutedForeground }]}>
            {details.bio}
          </Text>
        </View>

        {/* Gêneros principais da gravadora */}
        {details.genres.length > 0 && (
          <View style={styles.genresRow}>
            <Layers size={13} color={colors.primary} />
            {details.genres.map((g) => (
              <View
                key={g}
                style={[
                  styles.genrePill,
                  {
                    backgroundColor: `${colors.primary}18`,
                    borderColor: `${colors.primary}38`,
                  },
                ]}
              >
                <Text style={[styles.genrePillText, { color: colors.primary }]}>
                  {g}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Seção: Artistas Vinculados à Gravadora */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Users size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Artistas Vinculados ({filteredArtists.length})
          </Text>
        </View>

        {/* Busca rápida no elenco da gravadora */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={15} color={colors.mutedForeground} />
          <TextInput
            value={artistQuery}
            onChangeText={setArtistQuery}
            placeholder={`Filtrar artistas em ${details.name}...`}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {artistQuery.length > 0 && (
            <TouchableOpacity onPress={() => setArtistQuery('')}>
              <X size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {filteredArtists.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              Nenhum artista encontrado com &ldquo;{artistQuery}&rdquo;.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredArtists.slice(0, visibleArtistsCount).map((artist) => {
              const isFollowing = followedIds.includes(artist.id);
              return (
                <TouchableOpacity
                  key={artist.id || artist.name}
                  style={[
                    styles.artistCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/artist/${artist.id}` as any)}
                  activeOpacity={0.85}
                >
                  <CoverImage
                    uri={artist.imageUrl}
                    artistName={artist.name}
                    style={styles.artistAvatar}
                    fallbackType="artist"
                    quality="medium"
                  />

                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.artistNameRow}>
                      <Text
                        style={[styles.artistName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {artist.name}
                      </Text>
                      <View
                        style={[
                          styles.verifiedMiniBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Check size={8} color="#fff" strokeWidth={3.5} />
                      </View>
                    </View>

                    <Text
                      style={[styles.artistMeta, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {artist.genre || 'Artista'}
                    </Text>

                    <View style={styles.artistSubMetaRow}>
                      {Boolean(artist.country) && (
                        <View style={styles.artistSubMetaItem}>
                          <Globe size={10} color={colors.mutedForeground} />
                          <Text
                            style={[
                              styles.artistSubMetaText,
                              { color: colors.mutedForeground },
                            ]}
                            numberOfLines={1}
                          >
                            {artist.country}
                          </Text>
                        </View>
                      )}
                      {artist.nbFans > 0 && (
                        <Text
                          style={[
                            styles.artistSubMetaText,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {artist.country ? '• ' : ''}
                          {artist.nbFans >= 1000
                            ? `${(artist.nbFans / 1000).toFixed(1)}k fãs`
                            : `${artist.nbFans} fãs`}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleToggleFollow(artist)}
                    style={[
                      styles.followBtn,
                      {
                        backgroundColor: isFollowing
                          ? colors.secondary
                          : colors.primary,
                        borderColor: isFollowing
                          ? colors.border
                          : colors.primary,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {isFollowing ? (
                      <Check size={12} color={colors.foreground} />
                    ) : (
                      <UserPlus size={12} color="#fff" />
                    )}
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: isFollowing ? colors.foreground : '#fff',
                      }}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </Text>
                  </TouchableOpacity>

                  <ChevronRight size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Seção: Álbuns e Lançamentos da Gravadora no Catálogo */}
      {details.albums.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Disc size={18} color={colors.amber} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Lançamentos do Selo ({details.albums.length})
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {details.albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[
                  styles.albumCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => router.push(`/album/${album.id}` as any)}
                activeOpacity={0.85}
              >
                <CoverImage
                  uri={album.cover_medium || album.cover_big}
                  albumTitle={album.title}
                  albumArtist={album.artist?.name}
                  style={styles.albumCover}
                  quality="medium"
                />
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 96,
    gap: 20,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  labelTitle: {
    fontSize: 20,
    fontWeight: '900',
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factBox: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  factValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  aboutBlock: {
    gap: 5,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  aboutBio: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  genresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  genrePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 17,
    fontWeight: '900',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  artistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  verifiedMiniBadge: {
    width: 14,
    height: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  artistSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artistSubMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  artistSubMetaText: {
    fontSize: 11,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  albumCard: {
    width: 138,
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  albumCover: {
    width: 118,
    height: 118,
    borderRadius: 10,
  },
  albumTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2,
  },
  albumArtist: {
    fontSize: 11,
  },
});
