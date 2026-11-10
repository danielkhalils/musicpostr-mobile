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
import { Award, ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogArtist,
  getFollowedArtists,
  toggleFollowArtist,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 42) / 2;

export default function IdolsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();

  const [idols, setIdols] = useState<CatalogArtist[]>(() =>
    getFollowedArtists()
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setIdols(getFollowedArtists());
    });
    return unsubscribe;
  }, []);

  const handleUnfollow = (artist: CatalogArtist) => {
    if (isVisiting) return;
    toggleFollowArtist(artist);
    setIdols(getFollowedArtists());
  };

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
            <Award size={24} color={colors.amber} />
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              {isVisiting ? `Ídolos de @${username}` : 'Meus Ídolos Musicais'}
            </Text>
          </View>
          <Text
            style={[styles.pageSubtitle, { color: colors.mutedForeground }]}
          >
            Artistas que você segue e acompanha de perto no cenário musical.
          </Text>
        </View>

        <View style={styles.grid}>
          {idols.map((artist) => (
            <View
              key={artist.id}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.cardTouch}
                onPress={() => router.push(`/artist/${artist.id}` as any)}
                activeOpacity={0.85}
              >
                <CoverImage
                  uri={artist.imageUrl}
                  style={styles.avatar}
                  fallbackType="artist"
                />
                <Text
                  style={[styles.artistName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {artist.name}
                </Text>
                <Text
                  style={{ fontSize: 11, color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {artist.genre}
                </Text>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  {artist.nbFans.toLocaleString('pt-BR')} ouvintes
                </Text>
              </TouchableOpacity>

              {!isVisiting && (
                <TouchableOpacity
                  onPress={() => handleUnfollow(artist)}
                  style={[
                    styles.followingBtn,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Seguindo ✓
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  cardTouch: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  followingBtn: {
    marginTop: 10,
    width: '100%',
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
