import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Mail,
  Star,
  Heart,
  Edit3,
  Globe,
  Camera,
  Users,
  Award,
  ListMusic,
  Share2,
  Check,
  Settings,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  getUserProfile,
  getMyReviews,
  getFavoriteAlbums,
  getFollowedArtistIds,
  getUserLists,
  subscribeAlbumsUpdated,
} from '@/services/musicBrainz.service';
import { CoverImage } from '@/components/CoverImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 64) / 2;

export function ProfileView({ visitingUsername }: { visitingUsername?: string }) {
  const { colors } = useAppTheme();
  const isVisiting = Boolean(
    visitingUsername && visitingUsername !== 'anabeat'
  );

  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(() => getUserProfile());
  const [reviewsCount, setReviewsCount] = useState(
    () => getMyReviews().length + 26
  );
  const [favoritesCount, setFavoritesCount] = useState(
    () => getFavoriteAlbums().length
  );
  const [idolsCount, setIdolsCount] = useState(
    () => getFollowedArtistIds().length
  );
  const [listsCount, setListsCount] = useState(() => getUserLists().length);

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setProfile(getUserProfile());
      setReviewsCount(getMyReviews().length + 26);
      setFavoritesCount(getFavoriteAlbums().length);
      setIdolsCount(getFollowedArtistIds().length);
      setListsCount(getUserLists().length);
    });
    return unsubscribe;
  }, []);

  const displayProfile = isVisiting
    ? {
        name:
          visitingUsername === 'lucas_snd'
            ? 'Lucas Sound'
            : visitingUsername === 'beatcritic'
              ? 'Beat Critic'
              : `Usuário @${visitingUsername}`,
        username: visitingUsername || 'user',
        email: `${visitingUsername}@musicpostr.com`,
        bio: 'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.',
        avatarUrl:
          visitingUsername === 'lucas_snd'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
            : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200',
        bannerUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop',
        stats: {
          reviews: visitingUsername === 'lucas_snd' ? 34 : 51,
          favorites: 14,
          avgRating: 9.1,
          friends: 38,
          idols: 12,
          lists: 4,
        },
        socials: profile.socials,
      }
    : {
        ...profile,
        stats: {
          reviews: reviewsCount,
          favorites: favoritesCount,
          avgRating: 9.2,
          friends: 42,
          idols: idolsCount,
          lists: listsCount,
        },
      };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        title: `Perfil de ${displayProfile.name} no Musicpostr`,
        message: `Confira o perfil musical de ${displayProfile.name} (@${displayProfile.username}) no Musicpostr!`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const socialLabels: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'X / Twitter',
    threads: 'Threads',
    discord: 'Discord',
    lastfm: 'Last.fm',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    website: 'Site',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.bannerBox}>
        <CoverImage
          uri={displayProfile.bannerUrl}
          style={styles.bannerImg}
        />
      </View>

      {/* Card Principal */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.avatarWrapper,
              { borderColor: colors.card },
            ]}
          >
            <CoverImage
              uri={displayProfile.avatarUrl}
              style={styles.avatarImg}
              fallbackType="artist"
            />
            {!isVisiting && (
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Camera size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionBtnsRow}>
            <TouchableOpacity
              onPress={handleShareProfile}
              style={[
                styles.outlineBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              {copied ? (
                <>
                  <Check size={14} color={colors.emerald} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.emerald,
                    }}
                  >
                    Compartilhado
                  </Text>
                </>
              ) : (
                <>
                  <Share2 size={14} color={colors.foreground} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Compartilhar
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {!isVisiting && (
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={[
                  styles.outlineBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Edit3 size={14} color={colors.foreground} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.foreground,
                  }}
                >
                  Editar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Identidade e Bio */}
        <View style={styles.identitySection}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {displayProfile.name}
          </Text>
          <View style={styles.handleRow}>
            <Text style={[styles.handleText, { color: colors.primary }]}>
              @{displayProfile.username}
            </Text>
            <Text style={{ color: colors.mutedForeground }}>•</Text>
            <Mail size={12} color={colors.mutedForeground} />
            <Text
              style={[styles.emailText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {displayProfile.email}
            </Text>
          </View>

          <Text style={[styles.bioText, { color: colors.foreground }]}>
            {displayProfile.bio}
          </Text>

          {/* Links de Redes Sociais */}
          {displayProfile.socials && (
            <View style={styles.socialsRow}>
              {Object.entries(displayProfile.socials).map(([key, url]) => {
                if (!url) return null;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => Linking.openURL(url).catch(() => {})}
                    style={[
                      styles.socialPill,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Globe size={12} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: colors.foreground,
                      }}
                    >
                      {socialLabels[key] || key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Painel de 6 Estatísticas */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}45`,
              },
            ]}
            onPress={() => router.push('/my-reviews' as any)}
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Avaliações
              </Text>
              <Star size={15} color={colors.primary} fill={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.reviews}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Discos avaliados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/favorites' as any,
                params: isVisiting ? { username: displayProfile.username } : {},
              })
            }
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Favoritos
              </Text>
              <Heart size={15} color={colors.rose} fill={colors.rose} />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.favorites}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              No acervo pessoal
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Média
              </Text>
              <Award size={15} color={colors.amber} />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.avgRating}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Nota geral dada
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/friends' as any,
                params: isVisiting ? { username: displayProfile.username } : {},
              })
            }
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Amigos
              </Text>
              <Users size={15} color="#3b82f6" />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.friends}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Conectados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/idols' as any,
                params: isVisiting ? { username: displayProfile.username } : {},
              })
            }
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Ídolos
              </Text>
              <User size={15} color="#a855f7" />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.idols}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Artistas seguidos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                width: STAT_CARD_WIDTH,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/lists' as any,
                params: isVisiting ? { username: displayProfile.username } : {},
              })
            }
          >
            <View style={styles.statTopRow}>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Listas
              </Text>
              <ListMusic size={15} color={colors.emerald} />
            </View>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {displayProfile.stats.lists}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Playlists criadas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards de Acesso Rápido */}
      <View style={{ gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          style={[
            styles.shortcutCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push('/my-reviews' as any)}
        >
          <View
            style={[
              styles.shortcutIconBox,
              { backgroundColor: `${colors.primary}18` },
            ]}
          >
            <Star size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.shortcutTitle, { color: colors.foreground }]}
            >
              Histórico de Avaliações
            </Text>
            <Text
              style={[
                styles.shortcutSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              Veja o histórico completo das notas publicadas.
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: colors.primary,
            }}
          >
            Ver →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.shortcutCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push('/favorites' as any)}
        >
          <View
            style={[
              styles.shortcutIconBox,
              { backgroundColor: `${colors.amber}18` },
            ]}
          >
            <Heart size={20} color={colors.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.shortcutTitle, { color: colors.foreground }]}
            >
              Álbuns Favoritos
            </Text>
            <Text
              style={[
                styles.shortcutSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              Gerencie e visualize a lista de discos prediletos.
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: colors.amber,
            }}
          >
            Ver →
          </Text>
        </TouchableOpacity>

        {!isVisiting && (
          <TouchableOpacity
            style={[
              styles.shortcutCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/settings' as any)}
          >
            <View
              style={[
                styles.shortcutIconBox,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Settings size={20} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.shortcutTitle, { color: colors.foreground }]}
              >
                Configurações da Conta
              </Text>
              <Text
                style={[
                  styles.shortcutSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Edite seu perfil, redes sociais, privacidade e notificações.
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: colors.primary,
              }}
            >
              Abrir →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return <ProfileView />;
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 36,
  },
  bannerBox: {
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  mainCard: {
    marginTop: -28,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -42,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 4,
    borderRadius: 999,
  },
  avatarImg: {
    width: 82,
    height: 82,
    borderRadius: 999,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  identitySection: {
    gap: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emailText: {
    fontSize: 12,
    flex: 1,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    opacity: 0.9,
  },
  socialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  shortcutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  shortcutSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
