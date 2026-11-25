import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import {
  Check,
  ChevronRight,
  Disc,
  ListMusic,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverImage } from '@/components/CoverImage';
import { KeyboardAwareSheetModal } from '@/components/KeyboardAwareSheetModal';
import { PageHeader } from '@/components/PageHeader';
import {
  searchAlbumsInMusicBrainz,
  type CatalogAlbum,
  type UserListRecord,
} from '@/services/musicBrainz.service';
import {
  addAlbumToUserListInSupabase,
  deleteUserListInSupabase,
  getPopularAlbumsFromSupabase,
  removeAlbumFromUserListInSupabase,
  searchAlbumsInSupabase,
  updateUserListInSupabase,
} from '@/services/catalog.service';
import { supabase } from '@/services/supabase';

interface ListAlbumEntry {
  id: string;
  title: string;
  artist?: string;
  cover: string;
  year?: string;
  rating?: number;
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [list, setList] = useState<
    (Omit<UserListRecord, 'albums'> & { userId?: string; albums?: ListAlbumEntry[] }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INFINITE_PAGE_SIZE);

  // Modal de busca e adição de álbuns
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogAlbum[]>([]);
  const [suggestedAlbums, setSuggestedAlbums] = useState<CatalogAlbum[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingAlbumId, setAddingAlbumId] = useState<string | null>(null);
  const [removingAlbumId, setRemovingAlbumId] = useState<string | null>(null);

  // Edição e exclusão da lista
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);

  const loadList = useCallback(async () => {
    if (!id) return;
    try {
      const { data: listData, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !listData) {
        setList(null);
        return;
      }

      const { data: itemsData } = await supabase
        .from('user_list_items')
        .select(`
          album_id,
          album_title,
          album_cover,
          position,
          added_at,
          album:albums(
            id,
            title,
            artist_name,
            cover_medium,
            cover_big,
            cover_xl,
            release_date,
            community_rating
          )
        `)
        .eq('list_id', id)
        .order('position', { ascending: true })
        .order('added_at', { ascending: true });

      const albums: ListAlbumEntry[] = (itemsData || []).map((item: any) => {
        const albumObj = Array.isArray(item.album) ? item.album[0] : item.album;
        return {
          id: String(albumObj?.id || item.album_id),
          title: albumObj?.title || item.album_title || 'Álbum',
          artist: albumObj?.artist_name || 'Artista',
          cover:
            albumObj?.cover_big ||
            albumObj?.cover_medium ||
            albumObj?.cover_xl ||
            item.album_cover ||
            '',
          year: albumObj?.release_date
            ? String(albumObj.release_date).slice(0, 4)
            : '',
          rating: Number(albumObj?.community_rating || 0),
        };
      });

      setList({
        id: String(listData.id),
        userId: listData.user_id ? String(listData.user_id) : undefined,
        title: listData.title || 'Lista',
        count: albums.length,
        description: listData.description || '',
        createdAt: listData.created_label || listData.created_at,
        isDefault: Boolean(listData.is_default),
        albums,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Carrega sugestões populares ao abrir a modal pela primeira vez
  useEffect(() => {
    if (!isAddModalOpen || suggestedAlbums.length > 0) return;
    let active = true;
    getPopularAlbumsFromSupabase(16)
      .then((popular) => {
        if (active) setSuggestedAlbums(popular);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAddModalOpen, suggestedAlbums.length]);

  // Busca com debounce (Supabase + MusicBrainz)
  useEffect(() => {
    if (!isAddModalOpen) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [dbMatches, mbResult] = await Promise.all([
          searchAlbumsInSupabase(trimmed, 12),
          searchAlbumsInMusicBrainz(trimmed, 12, 0).catch(() => ({ albums: [], total: 0 })),
        ]);
        if (!active) return;

        const seen = new Set<string>();
        const merged: CatalogAlbum[] = [];
        for (const alb of [...dbMatches, ...(mbResult?.albums || [])]) {
          if (!alb?.id || seen.has(alb.id)) continue;
          seen.add(alb.id);
          merged.push(alb);
        }
        setSearchResults(merged);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAddModalOpen, searchQuery]);

  const isDefaultList = list?.id === 'want-to-listen' || list?.isDefault;
  const isOwner = Boolean(user && (!list?.userId || list.userId === user.id));
  const albums = useMemo(() => list?.albums || [], [list?.albums]);

  const existingAlbumIds = useMemo(
    () => new Set(albums.map((a) => a.id)),
    [albums]
  );

  const displayedSearchList = searchQuery.trim()
    ? searchResults
    : suggestedAlbums;

  const handleAddAlbum = async (album: CatalogAlbum) => {
    if (!id || !isOwner || addingAlbumId || existingAlbumIds.has(album.id)) return;
    setAddingAlbumId(album.id);
    try {
      const ok = await addAlbumToUserListInSupabase(id, album);
      if (ok) {
        const newEntry: ListAlbumEntry = {
          id: album.id,
          title: album.title,
          artist: album.artist?.name || 'Artista',
          cover: album.cover_big || album.cover_medium || album.cover_xl || '',
          year: album.release_date ? String(album.release_date).slice(0, 4) : '',
          rating: Number(album.communityRating || 0),
        };
        setList((prev) =>
          prev
            ? {
                ...prev,
                count: (prev.albums?.length || 0) + 1,
                albums: [...(prev.albums || []), newEntry],
              }
            : prev
        );
      } else {
        Alert.alert(
          'Erro ao adicionar',
          'Não foi possível adicionar este álbum à lista. Tente novamente.'
        );
      }
    } finally {
      setAddingAlbumId(null);
    }
  };

  const handleRemoveAlbum = async (albumId: string) => {
    if (!id || !isOwner || removingAlbumId) return;
    setRemovingAlbumId(albumId);
    try {
      const ok = await removeAlbumFromUserListInSupabase(id, albumId);
      if (ok) {
        setList((prev) => {
          if (!prev) return prev;
          const nextAlbums = (prev.albums || []).filter((a) => a.id !== albumId);
          return {
            ...prev,
            count: nextAlbums.length,
            albums: nextAlbums,
          };
        });
      }
    } finally {
      setRemovingAlbumId(null);
    }
  };

  const handleOpenEditModal = () => {
    if (!list || !isOwner) return;
    setEditTitle(list.title || '');
    setEditDesc(list.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditList = async () => {
    if (!id || !user || !editTitle.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const ok = await updateUserListInSupabase(id, user.id, {
        title: editTitle,
        description: editDesc,
      });
      if (ok) {
        setList((prev) =>
          prev
            ? {
                ...prev,
                title: editTitle.trim(),
                description:
                  editDesc.trim() || 'Coleção de álbuns organizados por você.',
              }
            : prev
        );
        setIsEditModalOpen(false);
      } else {
        Alert.alert(
          'Erro ao editar lista',
          'Não foi possível salvar as alterações. Tente novamente.'
        );
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const executeDeleteList = async () => {
    if (!id || !user || isDeletingList) return;
    setIsDeletingList(true);
    try {
      const ok = await deleteUserListInSupabase(id, user.id);
      if (ok) {
        safeGoBack('/lists');
      } else {
        Alert.alert(
          'Erro ao excluir lista',
          'Não foi possível excluir esta lista. Tente novamente.'
        );
      }
    } finally {
      setIsDeletingList(false);
    }
  };

  const handleDeleteList = () => {
    if (!list || !isOwner || isDeletingList) return;
    const message = `Tem certeza que deseja excluir a lista "${list.title}"? Todos os álbuns salvos nela serão removidos desta coletânea.`;

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(message);
      if (confirmed) {
        executeDeleteList();
      }
      return;
    }

    Alert.alert('Excluir lista', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => executeDeleteList(),
      },
    ]);
  };

  if (isLoading && !list) {
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
          if (visibleCount < albums.length && isNearScrollBottom(e)) {
            setVisibleCount((prev) =>
              Math.min(albums.length, prev + INFINITE_PAGE_SIZE)
            );
          }
        }}
      >
        <PageHeader
          title={list?.title || 'Lista'}
          subtitle={list?.description || undefined}
          onBack={() => safeGoBack('/lists')}
          backLabel="Voltar para Listas"
          rightAction={
            isOwner ? (
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(true)}
                style={[styles.addHeaderBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Plus size={15} color="#fff" />
                <Text style={styles.addHeaderBtnText}>Adicionar Álbum</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Cabeçalho da Lista */}
        <View
          style={[
            styles.listHeaderBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.listHeaderTopRow}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDefaultList
                    ? `${colors.primary}18`
                    : `${colors.emerald}18`,
                  borderColor: isDefaultList
                    ? `${colors.primary}35`
                    : `${colors.emerald}35`,
                },
              ]}
            >
              <ListMusic
                size={24}
                color={isDefaultList ? colors.primary : colors.emerald}
              />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={[styles.listHeaderTitle, { color: colors.foreground }]}
                >
                  {list?.title || 'Lista Musical'}
                </Text>
                {isDefaultList && (
                  <View
                    style={[
                      styles.defaultBadge,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.defaultBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      Padrão
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: isDefaultList ? colors.primary : colors.emerald,
                }}
              >
                {albums.length}{' '}
                {albums.length === 1 ? 'álbum salvo' : 'álbuns salvos'}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.listHeaderDesc,
              { color: colors.mutedForeground },
            ]}
          >
            {list?.description || 'Coleção de álbuns organizados por você.'}
          </Text>

          {isOwner && (
            <View
              style={[
                styles.ownerActionsRow,
                { borderTopColor: colors.border },
              ]}
            >
              <TouchableOpacity
                onPress={handleOpenEditModal}
                style={[
                  styles.ownerActionBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Pencil size={13} color={colors.foreground} />
                <Text
                  style={[
                    styles.ownerActionBtnText,
                    { color: colors.foreground },
                  ]}
                >
                  Editar lista
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteList}
                disabled={isDeletingList}
                style={[
                  styles.ownerActionBtn,
                  {
                    backgroundColor: `${colors.destructive}14`,
                    borderColor: `${colors.destructive}38`,
                    opacity: isDeletingList ? 0.6 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {isDeletingList ? (
                  <ActivityIndicator size="small" color={colors.destructive} />
                ) : (
                  <Trash2 size={13} color={colors.destructive} />
                )}
                <Text
                  style={[
                    styles.ownerActionBtnText,
                    { color: colors.destructive },
                  ]}
                >
                  {isDeletingList ? 'Excluindo...' : 'Excluir lista'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção de Álbuns na Lista */}
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeading}>
            <Disc size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Álbuns nesta Lista ({albums.length})
            </Text>
          </View>
        </View>

        {albums.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Disc size={36} color={colors.primary} />
            </View>
            <Text
              style={[styles.emptyTitle, { color: colors.foreground }]}
            >
              Nenhum álbum adicionado ainda
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Busque seus álbuns favoritos e adicione-os diretamente nesta lista!
            </Text>

            {isOwner && (
              <TouchableOpacity
                style={[
                  styles.exploreBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.85}
              >
                <Plus size={15} color="#fff" />
                <Text style={styles.exploreBtnText}>Adicionar Álbum</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.albumsList}>
            {albums.slice(0, visibleCount).map((alb) => (
              <TouchableOpacity
                key={alb.id}
                style={[
                  styles.albumRowCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/album/${alb.id}` as any)}
                activeOpacity={0.8}
              >
                <CoverImage
                  uri={alb.cover}
                  albumTitle={alb.title}
                  albumArtist={alb.artist}
                  style={styles.albumRowCover}
                  fallbackType="album"
                  quality="medium"
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[styles.albumRowTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {alb.title}
                  </Text>
                  <Text
                    style={{ fontSize: 11.5, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {alb.artist || 'Artista'}
                    {alb.year ? ` • ${alb.year}` : ''}
                  </Text>
                </View>

                {isOwner && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveAlbum(alb.id);
                    }}
                    disabled={removingAlbumId === alb.id}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 6, opacity: removingAlbumId === alb.id ? 0.5 : 1 }}
                    accessibilityLabel="Remover álbum da lista"
                  >
                    {removingAlbumId === alb.id ? (
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                      <Trash2 size={15} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                )}

                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet para buscar e adicionar álbuns */}
      <KeyboardAwareSheetModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSearchQuery('');
        }}
        backgroundColor={colors.card}
        borderColor={colors.border}
        maxHeightRatio={0.88}
      >
        {({ maxSheetHeight }) => (
          <View style={{ gap: 12 }}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Adicionar Álbum
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  Busque por nome do álbum ou artista para salvar em &ldquo;{list?.title}&rdquo;
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalOpen(false);
                  setSearchQuery('');
                }}
                style={[styles.sheetCloseBtn, { backgroundColor: colors.secondary }]}
                accessibilityLabel="Fechar"
              >
                <X size={17} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Campo de busca de álbuns */}
            <View
              style={[
                styles.searchInputBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={17} color={colors.mutedForeground} />
              <TextInput
                placeholder="Buscar álbum ou artista..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.foreground }]}
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.searchSectionLabel, { color: colors.mutedForeground }]}>
              {searchQuery.trim()
                ? isSearching
                  ? 'Buscando álbuns...'
                  : `Resultados (${searchResults.length})`
                : 'Álbuns populares para adicionar'}
            </Text>

            <ScrollView
              style={{ maxHeight: Math.max(180, maxSheetHeight - 170) }}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isSearching ? (
                <View style={styles.searchEmptyBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Procurando álbuns no catálogo...
                  </Text>
                </View>
              ) : displayedSearchList.length === 0 ? (
                <View style={styles.searchEmptyBox}>
                  <Disc size={26} color={colors.mutedForeground} style={{ opacity: 0.6 }} />
                  <Text style={{ fontSize: 12.5, color: colors.mutedForeground, textAlign: 'center' }}>
                    {searchQuery.trim()
                      ? 'Nenhum álbum encontrado para essa busca.'
                      : 'Digite o nome de um álbum ou artista acima.'}
                  </Text>
                </View>
              ) : (
                displayedSearchList.map((album) => {
                  const alreadyAdded = existingAlbumIds.has(album.id);
                  const isAddingThis = addingAlbumId === album.id;
                  const year = album.release_date
                    ? String(album.release_date).slice(0, 4)
                    : '';

                  return (
                    <View
                      key={album.id}
                      style={[
                        styles.searchResultRow,
                        {
                          backgroundColor: colors.secondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <CoverImage
                        uri={album.cover_medium || album.cover_big || album.cover_xl}
                        albumTitle={album.title}
                        albumArtist={album.artist?.name}
                        style={styles.searchResultCover}
                        fallbackType="album"
                        quality="low"
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.searchResultTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {album.title}
                        </Text>
                        <Text
                          style={{ fontSize: 11.5, color: colors.mutedForeground }}
                          numberOfLines={1}
                        >
                          {album.artist?.name || 'Artista'}
                          {year ? ` • ${year}` : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleAddAlbum(album)}
                        disabled={alreadyAdded || isAddingThis}
                        activeOpacity={0.8}
                        style={[
                          styles.addResultBtn,
                          alreadyAdded
                            ? {
                                backgroundColor: `${colors.emerald}20`,
                                borderColor: `${colors.emerald}50`,
                              }
                            : {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                              },
                        ]}
                      >
                        {isAddingThis ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : alreadyAdded ? (
                          <>
                            <Check size={12} color={colors.emerald} />
                            <Text
                              style={[
                                styles.addResultBtnText,
                                { color: colors.emerald },
                              ]}
                            >
                              Na lista
                            </Text>
                          </>
                        ) : (
                          <>
                            <Plus size={12} color="#ffffff" />
                            <Text style={styles.addResultBtnText}>Adicionar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </KeyboardAwareSheetModal>

      {/* Modal de Edição da Lista */}
      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalBackdrop}
        >
          <View
            style={[
              styles.editModalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Editar Lista
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={[styles.sheetCloseBtn, { backgroundColor: colors.secondary }]}
              >
                <X size={17} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Título da lista"
              placeholderTextColor={colors.mutedForeground}
              value={editTitle}
              onChangeText={setEditTitle}
              style={[
                styles.editInput,
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
              value={editDesc}
              onChangeText={setEditDesc}
              style={[
                styles.editTextarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleSaveEditList}
              disabled={!editTitle.trim() || isSavingEdit}
              style={[
                styles.editSaveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !editTitle.trim() || isSavingEdit ? 0.7 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              {isSavingEdit && <ActivityIndicator size="small" color="#ffffff" />}
              <Text style={{ color: '#ffffff', fontSize: 13.5, fontWeight: '800' }}>
                {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
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
    padding: 14,
    paddingBottom: 60,
    gap: 14,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 12,
  },
  addHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  listHeaderBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  listHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  listHeaderDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ownerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownerActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  editModalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  editInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  editTextarea: {
    minHeight: 82,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  editSaveBtn: {
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 260,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  albumsList: {
    gap: 10,
  },
  albumRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  albumRowCover: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  albumRowTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  searchSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  searchEmptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchResultCover: {
    width: 46,
    height: 46,
    borderRadius: 9,
  },
  searchResultTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  addResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
  },
  addResultBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
