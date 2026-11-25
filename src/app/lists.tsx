import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import { Disc, ListMusic, Plus, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverImage } from '@/components/CoverImage';
import { PageHeader } from '@/components/PageHeader';
import {
  notifyCatalogUpdated,
  subscribeAlbumsUpdated,
  type UserListRecord,
} from '@/services/musicBrainz.service';
import { getUserListsFromSupabase } from '@/services/profile.service';
import { supabase } from '@/services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 14;
const GRID_GAP = 12;
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2);

function ListCoverCollage({
  albums,
  isDefault,
  albumCountLabel,
}: {
  albums?: { id: string; title: string; artist?: string; cover: string }[];
  isDefault?: boolean;
  albumCountLabel: string;
}) {
  const { colors } = useAppTheme();
  const listAlbums = albums || [];

  return (
    <View
      style={[
        styles.coverBox,
        {
          backgroundColor: isDefault ? `${colors.primary}18` : colors.secondary,
          borderColor: colors.border,
        },
      ]}
    >
      {listAlbums.length >= 4 ? (
        <View style={styles.collageGrid}>
          {listAlbums.slice(0, 4).map((album, idx) => (
            <View key={`${album.id}-${idx}`} style={styles.collageCell}>
              <CoverImage
                uri={album.cover}
                albumTitle={album.title}
                albumArtist={album.artist}
                style={styles.collageCellImg}
                fallbackType="album"
                quality="medium"
              />
            </View>
          ))}
        </View>
      ) : listAlbums.length >= 1 ? (
        <CoverImage
          uri={listAlbums[0].cover}
          albumTitle={listAlbums[0].title}
          albumArtist={listAlbums[0].artist}
          style={styles.singleCoverImg}
          fallbackType="album"
          quality="medium"
        />
      ) : (
        <View style={styles.emptyCoverCenter}>
          <ListMusic
            size={36}
            color={isDefault ? colors.primary : colors.mutedForeground}
          />
        </View>
      )}

      {/* Badge Padrão no topo esquerdo */}
      {isDefault && (
        <View
          style={[
            styles.coverTopBadge,
            { backgroundColor: 'rgba(9, 9, 11, 0.78)' },
          ]}
        >
          <Text style={styles.coverTopBadgeText}>Padrão</Text>
        </View>
      )}

      {/* Contagem de álbuns no canto inferior direito */}
      <View style={styles.coverCountPill}>
        <Disc size={10} color="#ffffff" />
        <Text style={styles.coverCountText}>{albumCountLabel}</Text>
      </View>
    </View>
  );
}

export default function ListsScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const isVisiting = Boolean(username);
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [lists, setLists] = useState<UserListRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSavingList, setIsSavingList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INFINITE_PAGE_SIZE);

  const loadLists = useCallback(async () => {
    try {
      if (isVisiting && username) {
        const data = await getUserListsFromSupabase({ username });
        setLists(data);
      } else if (user) {
        const data = await getUserListsFromSupabase({ userId: user.id });
        setLists(data);
      } else {
        setLists([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isVisiting, username, user]);

  useEffect(() => {
    loadLists();
    const unsubscribe = subscribeAlbumsUpdated(() => {
      loadLists();
    });
    return unsubscribe;
  }, [loadLists]);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists])
  );

  const totalAlbumsCount = useMemo(
    () => lists.reduce((acc, item) => acc + (item.count || 0), 0),
    [lists]
  );

  const handleCreateList = async () => {
    if (!newTitle.trim() || !user || isSavingList) return;
    setIsSavingList(true);
    try {
      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          description: newDesc.trim() || 'Nova coleção musical.',
          items_count: 0,
          is_default: false,
          created_label: 'Agora mesmo',
        })
        .select('*')
        .single();

      if (!error && data) {
        setLists((prev) => [
          {
            id: String(data.id),
            title: data.title,
            count: data.items_count || 0,
            description: data.description || '',
            createdAt: data.created_label || 'Agora mesmo',
            isDefault: Boolean(data.is_default),
            albums: [],
          },
          ...prev,
        ]);
        notifyCatalogUpdated();
      }
      setNewTitle('');
      setNewDesc('');
      setIsModalOpen(false);
    } finally {
      setIsSavingList(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => {
          if (visibleCount < lists.length && isNearScrollBottom(e)) {
            setVisibleCount((prev) =>
              Math.min(lists.length, prev + INFINITE_PAGE_SIZE)
            );
          }
        }}
      >
        <PageHeader
          title={isVisiting ? `Listas de @${username}` : 'Listas'}
          subtitle="Coletâneas temáticas de álbuns organizadas."
          onBack={() => safeGoBack('/(tabs)/profile')}
          backLabel="Voltar ao Perfil"
          rightAction={
            !isVisiting ? (
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                style={[styles.newBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Plus size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                  Nova Lista
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Barra de resumo */}
        {!isLoading && lists.length > 0 && (
          <View
            style={[
              styles.summaryBar,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryItem}>
              <ListMusic size={14} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>
                {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
              </Text>
            </View>
            <View
              style={[styles.summaryDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.summaryItem}>
              <Disc size={14} color={colors.emerald} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>
                {totalAlbumsCount}{' '}
                {totalAlbumsCount === 1 ? 'álbum salvo' : 'álbuns salvos'}
              </Text>
            </View>
          </View>
        )}

        {isLoading && lists.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : lists.length === 0 ? (
          <View
            style={[
              styles.emptyStateBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <ListMusic size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma lista criada ainda
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Organize seus álbuns favoritos em coleções personalizadas por humor, ano ou estilo.
            </Text>
            {!isVisiting && (
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Plus size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>
                  Criar minha primeira lista
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.squareGrid}>
            {lists.slice(0, visibleCount).map((list) => {
              const isDefaultList =
                list.id === 'want-to-listen' || Boolean(list.isDefault);
              const albumLabel =
                list.count === 1 ? '1 álbum' : `${list.count} álbuns`;

              return (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.squareCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/list/${list.id}` as any)}
                  activeOpacity={0.85}
                >
                  {/* Capa quadrada em colagem (4 primeiros) ou 1º álbum */}
                  <ListCoverCollage
                    albums={list.albums}
                    isDefault={isDefaultList}
                    albumCountLabel={albumLabel}
                  />

                  {/* Informações compactas abaixo da capa */}
                  <View style={styles.squareCardBody}>
                    <Text
                      style={[styles.listTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {list.title}
                    </Text>

                    {Boolean(list.description) && (
                      <Text
                        style={[
                          styles.listDesc,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {list.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: colors.foreground,
                }}
              >
                Criar Nova Lista
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Título da lista (ex: Melhores de 2026)"
              placeholderTextColor={colors.mutedForeground}
              value={newTitle}
              onChangeText={setNewTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TextInput
              multiline
              placeholder="Descrição da coletânea..."
              placeholderTextColor={colors.mutedForeground}
              value={newDesc}
              onChangeText={setNewDesc}
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleCreateList}
              disabled={!newTitle.trim() || isSavingList}
              style={[
                styles.createBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !newTitle.trim() || isSavingList ? 0.7 : 1,
                },
              ]}
            >
              {isSavingList && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                {isSavingList ? 'Salvando...' : 'Salvar Lista'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: GRID_PADDING,
    paddingBottom: 42,
    gap: 14,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 16,
  },
  loadingBox: {
    flex: 1,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCtaBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 999,
  },
  squareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  squareCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverBox: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  collageGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collageCell: {
    width: '50%',
    height: '50%',
  },
  collageCellImg: {
    width: '100%',
    height: '100%',
  },
  singleCoverImg: {
    width: '100%',
    height: '100%',
  },
  emptyCoverCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverTopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  coverTopBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  coverCountPill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9, 9, 11, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  coverCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  squareCardBody: {
    padding: 10,
    gap: 3,
  },
  listTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  listDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  textarea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  createBtn: {
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
