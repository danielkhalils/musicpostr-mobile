import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import {
  ArrowLeft,
  Disc,
  Headphones,
  Search,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogAlbum,
  getPopularAlbumsByInternalActivity,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

const GENRES = [
  'Todos',
  'Pop',
  'Rock',
  'Hip-Hop',
  'Eletrônica',
  'Indie',
  'R&B',
  'Samba e pagode',
];

export default function TopAlbunsScreen() {
  const { colors } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [allAlbums, setAllAlbums] = useState<CatalogAlbum[]>(() =>
    getPopularAlbumsByInternalActivity(30)
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setAllAlbums(getPopularAlbumsByInternalActivity(30));
    });
    return unsubscribe;
  }, []);

  const filteredAlbums = allAlbums.filter((album) => {
    const matchesSearch =
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre =
      selectedGenre === 'Todos' ||
      album.genreName.toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => safeGoBack('/(tabs)/profile')}
        >
          <ArrowLeft size={15} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
            }}
          >
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Disc size={24} color={colors.primary} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Álbuns Populares do Momento
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            Ranking baseado nas avaliações internas dos usuários e na quantidade
            de ouvintes na comunidade.
          </Text>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              placeholder="Buscar por álbum ou artista..."
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginTop: 10 }}
          >
            {GENRES.map((genre) => {
              const active = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={genre}
                  onPress={() => setSelectedGenre(genre)}
                  style={[
                    styles.genreChip,
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
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.grid}>
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
              <View style={{ position: 'relative', marginBottom: 8 }}>
                <CoverImage
                  uri={album.cover_big || album.cover_medium}
                  style={styles.cover}
                />
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: 'rgba(9,9,11,0.88)' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: colors.primary,
                    }}
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
                style={{ fontSize: 11, color: colors.mutedForeground }}
                numberOfLines={1}
              >
                {album.artist.name}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Headphones size={11} color={colors.primary} />
                <Text
                  style={{ fontSize: 10, color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {album.listenersCount.toLocaleString('pt-BR')} •{' '}
                  {album.totalReviews} aval.
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
    paddingBottom: 36,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBlock: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
});
