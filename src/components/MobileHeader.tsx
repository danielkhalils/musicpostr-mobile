import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Music,
  Search,
  Heart,
  User,
  Sun,
  Moon,
  X,
  Disc,
  Mic,
  Settings,
  Star,
  LogOut,
  Users,
  Award,
  ListMusic,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  searchLocalCatalogInstant,
  searchAlbumsInMusicBrainz,
  searchArtistsInMusicBrainz,
  searchTracksInMusicBrainz,
} from '@/services/musicBrainz.service';
import { CoverImage } from './CoverImage';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'album' | 'artist' | 'track' | 'user';
  image?: string;
  route: string;
}

const COMMUNITY_USERS: SearchResult[] = [
  {
    id: 'user-1',
    title: 'Ana Beatriz',
    subtitle: '@anabeat • Usuário',
    type: 'user',
    route: '/(tabs)/profile',
  },
  {
    id: 'user-2',
    title: 'Lucas Sound',
    subtitle: '@lucas_snd • Usuário',
    type: 'user',
    route: '/user/lucas_snd',
  },
  {
    id: 'user-3',
    title: 'Beat Critic',
    subtitle: '@beatcritic • Usuário',
    type: 'user',
    route: '/user/beatcritic',
  },
];

export function MobileHeader() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'album' | 'artist' | 'track' | 'user'
  >('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const local = searchLocalCatalogInstant(trimmed);
    const matchedUsers = COMMUNITY_USERS.filter(
      (u) =>
        u.title.toLowerCase().includes(trimmed.toLowerCase()) ||
        u.subtitle.toLowerCase().includes(trimmed.toLowerCase())
    );

    const instantResults: SearchResult[] = [
      ...local.albums.map((item) => ({
        id: `album-${item.id}`,
        title: item.title,
        subtitle: `Álbum • ${item.artist.name}`,
        type: 'album' as const,
        image: item.cover_medium,
        route: `/album/${item.id}`,
      })),
      ...local.artists.map((item) => ({
        id: `artist-${item.id}`,
        title: item.name,
        subtitle: `Artista • ${item.genre}`,
        type: 'artist' as const,
        image: item.imageUrl || undefined,
        route: `/artist/${item.id}`,
      })),
      ...local.tracks.map((item) => ({
        id: `track-${item.id}`,
        title: item.title,
        subtitle: `Música • ${item.artist.name}`,
        type: 'track' as const,
        image: item.album.cover_medium,
        route: `/album/${item.album.id}`,
      })),
      ...matchedUsers,
    ];

    setResults(instantResults);
    setIsLoading(instantResults.length === 0);

    const timer = setTimeout(async () => {
      try {
        const [albumRes, artistRes, trackRes] = await Promise.all([
          activeTab === 'all' || activeTab === 'album'
            ? searchAlbumsInMusicBrainz(trimmed, 5, 0)
            : Promise.resolve({ albums: [], total: 0 }),
          activeTab === 'all' || activeTab === 'artist'
            ? searchArtistsInMusicBrainz(trimmed, 4, 0)
            : Promise.resolve({ artists: [], total: 0 }),
          activeTab === 'all' || activeTab === 'track'
            ? searchTracksInMusicBrainz(trimmed, 4)
            : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        const mergedMap = new Map<string, SearchResult>();
        for (const item of instantResults) {
          if (item.type !== 'user') {
            mergedMap.set(item.id, item);
          }
        }

        albumRes.albums.forEach((item) => {
          const typeLabel =
            item.record_type === 'ep'
              ? 'EP'
              : item.record_type === 'single'
                ? 'Single'
                : 'Álbum';
          mergedMap.set(`album-${item.id}`, {
            id: `album-${item.id}`,
            title: item.title,
            subtitle: `${typeLabel} • ${item.artist?.name || 'Artista'}`,
            type: 'album',
            image: item.cover_medium,
            route: `/album/${item.id}`,
          });
        });

        artistRes.artists.forEach((item) => {
          mergedMap.set(`artist-${item.id}`, {
            id: `artist-${item.id}`,
            title: item.name,
            subtitle: `Artista • ${item.genre || 'Catálogo'}`,
            type: 'artist',
            image: item.imageUrl || undefined,
            route: `/artist/${item.id}`,
          });
        });

        trackRes.forEach((item) => {
          mergedMap.set(`track-${item.id}`, {
            id: `track-${item.id}`,
            title: item.title,
            subtitle: `Música • ${item.artist?.name || 'Artista'}`,
            type: 'track',
            image: item.album?.cover_medium,
            route: item.album?.id
              ? `/album/${item.album.id}`
              : `/artist/${item.artist?.id || ''}`,
          });
        });

        setResults([...Array.from(mergedMap.values()), ...matchedUsers]);
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
  }, [query, activeTab]);

  const filteredResults =
    activeTab === 'all' ? results : results.filter((r) => r.type === activeTab);

  const renderTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'album':
        return <Disc size={18} color={colors.primary} />;
      case 'artist':
        return <Mic size={18} color={colors.amber} />;
      case 'track':
        return <Music size={18} color={colors.emerald} />;
      case 'user':
        return <User size={18} color={colors.primary} />;
    }
  };

  return (
    <>
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: Math.max(insets.top, 10),
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.brandRow}
            onPress={() => router.push('/(tabs)/index' as any)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.brandIconBox,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <Music size={18} color={colors.primary} />
            </View>
            <Text style={[styles.brandText, { color: colors.foreground }]}>
              MUSICPOSTR
            </Text>
          </TouchableOpacity>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => setIsSearchOpen(true)}
              style={[
                styles.searchTrigger,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Search size={15} color={colors.mutedForeground} />
              <Text
                style={[
                  styles.searchTriggerText,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                Buscar...
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/favorites' as any)}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.secondary },
              ]}
              accessibilityLabel="Favoritos"
            >
              <Heart size={18} color={colors.foreground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.secondary },
              ]}
              accessibilityLabel="Alternar tema"
            >
              {isDark ? (
                <Moon size={18} color={colors.primary} />
              ) : (
                <Sun size={18} color={colors.amber} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsProfileMenuOpen(true)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: `${colors.primary}22`,
                  borderWidth: 1,
                  borderColor: `${colors.primary}50`,
                },
              ]}
              accessibilityLabel="Menu do Perfil"
            >
              <User size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal de Busca Global */}
      <Modal
        visible={isSearchOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSearchOpen(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0,0,0,0.75)' },
          ]}
        >
          <View
            style={[
              styles.searchModalCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                marginTop: Math.max(insets.top + 8, 24),
              },
            ]}
          >
            <View
              style={[
                styles.searchInputBar,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={18} color={colors.mutedForeground} />
              <TextInput
                autoFocus
                placeholder="Buscar álbum, artista, música ou usuário..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                style={[styles.searchInput, { color: colors.foreground }]}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <X size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setIsSearchOpen(false)}
                style={styles.closeBtn}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.tabsRow,
                { borderBottomColor: colors.border },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}
              >
                {(
                  [
                    { key: 'all', label: 'Tudo' },
                    { key: 'album', label: 'Álbuns' },
                    { key: 'artist', label: 'Artistas' },
                    { key: 'track', label: 'Músicas' },
                    { key: 'user', label: 'Usuários' },
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      style={[
                        styles.tabChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: active ? '#fff' : colors.mutedForeground,
                        }}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {query.trim() === '' ? (
              <View style={styles.emptySearchBox}>
                <Search size={32} color={colors.mutedForeground} />
                <Text
                  style={[
                    styles.emptySearchText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Digite o nome de um álbum, artista, música ou usuário da
                  comunidade.
                </Text>
              </View>
            ) : isLoading && filteredResults.length === 0 ? (
              <View style={styles.emptySearchBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.emptySearchText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Buscando na comunidade e catálogo...
                </Text>
              </View>
            ) : filteredResults.length === 0 ? (
              <View style={styles.emptySearchBox}>
                <Text
                  style={[
                    styles.emptySearchText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {`Nenhum resultado encontrado para "${query}".`}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 12, gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      setIsSearchOpen(false);
                      setQuery('');
                      router.push(item.route as any);
                    }}
                  >
                    {item.image ? (
                      <CoverImage
                        uri={item.image}
                        style={styles.resultThumb}
                        fallbackType={
                          item.type === 'artist' ? 'artist' : 'album'
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.resultIconBox,
                          { backgroundColor: colors.secondary },
                        ]}
                      >
                        {renderTypeIcon(item.type)}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.resultTitle,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.resultSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                      →
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Dropdown de Perfil e Atalhos */}
      <Modal
        visible={isProfileMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsProfileMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setIsProfileMenuOpen(false)}
        >
          <View
            style={[
              styles.profileMenuSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                marginTop: Math.max(insets.top + 54, 64),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/(tabs)/profile');
              }}
            >
              <User size={16} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Meu Perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/my-reviews' as any);
              }}
            >
              <Star size={16} color={colors.amber} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Minhas Avaliações
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/favorites' as any);
              }}
            >
              <Heart size={16} color={colors.rose} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Álbuns Favoritos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/friends' as any);
              }}
            >
              <Users size={16} color="#3b82f6" />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Meus Amigos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/idols' as any);
              }}
            >
              <Award size={16} color="#a855f7" />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Meus Ídolos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/lists' as any);
              }}
            >
              <ListMusic size={16} color={colors.emerald} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Minhas Listas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/settings' as any);
              }}
            >
              <Settings size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Configurações
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.menuDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                toggleTheme();
              }}
            >
              {isDark ? (
                <Moon size={16} color={colors.primary} />
              ) : (
                <Sun size={16} color={colors.amber} />
              )}
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Tema: {isDark ? 'Escuro' : 'Claro'}
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.menuDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsProfileMenuOpen(false);
                router.push('/login' as any);
              }}
            >
              <LogOut size={16} color={colors.destructive} />
              <Text
                style={[styles.menuItemText, { color: colors.destructive }]}
              >
                Entrar / Sair da Conta
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 105,
  },
  searchTriggerText: {
    fontSize: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchModalCard: {
    flex: 1,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  closeBtn: {
    paddingLeft: 6,
  },
  tabsRow: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  emptySearchBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  emptySearchText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  resultIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  profileMenuSheet: {
    width: 225,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});
