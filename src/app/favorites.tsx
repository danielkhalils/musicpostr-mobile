import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { Heart, Disc, ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type FavoriteAlbumRecord,
  getFavoriteAlbums,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

export default function FavoritesScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();

  const [favorites, setFavorites] = useState<FavoriteAlbumRecord[]>(() =>
    getFavoriteAlbums()
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFavorites(getFavoriteAlbums());
    });
    return unsubscribe;
  }, []);

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
            Voltar ao Perfil
          </Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Heart size={24} color={colors.rose} fill={colors.rose} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              {isVisiting
                ? `Favoritos de @${username}`
                : 'Meus Álbuns Favoritos'}
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            {isVisiting
              ? `Discos prediletos selecionados por @${username}.`
              : 'Sua seleção definitiva de discos prediletos.'}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Disc size={44} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Nenhum álbum favoritado ainda.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((album) => (
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
                <CoverImage uri={album.cover} style={styles.cover} />
                <Text
                  style={[styles.title, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
                <Text
                  style={{ fontSize: 11, color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {album.artist}
                </Text>
                <View style={styles.footerRow}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: colors.amber,
                    }}
                  >
                    ★ {album.rating}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBlock: {
    gap: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
    gap: 4,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  footerRow: {
    marginTop: 2,
  },
});
