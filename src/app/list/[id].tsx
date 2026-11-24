import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { INFINITE_PAGE_SIZE, isNearScrollBottom } from '@/utils/pagination';
import {
  ListMusic,
  Disc,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/PageHeader';
import { CoverImage } from '@/components/CoverImage';
import { type UserListRecord } from '@/services/musicBrainz.service';
import { supabase } from '@/services/supabase';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [list, setList] = useState<UserListRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INFINITE_PAGE_SIZE);

  useEffect(() => {
    let active = true;
    const loadList = async () => {
      if (!id) return;
      const { data: listData, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !listData) {
        if (active) setList(null);
        return;
      }

      const { data: itemsData } = await supabase
        .from('user_list_items')
        .select(`
          album_id,
          position,
          album:albums(
            id,
            title,
            artist_name,
            cover_medium,
            release_date,
            community_rating
          )
        `)
        .eq('list_id', id)
        .order('position', { ascending: true });

      if (!active) return;

      const albums = (itemsData || []).map((item: any) => ({
        id: item.album?.id || item.album_id,
        title: item.album?.title || 'Álbum',
        artist: item.album?.artist_name || 'Artista',
        cover: item.album?.cover_medium || '',
        year: item.album?.release_date ? String(item.album.release_date).slice(0, 4) : '',
        rating: Number(item.album?.community_rating || 0),
      }));

      setList({
        id: listData.id,
        title: listData.title || 'Lista',
        count: listData.items_count ?? albums.length,
        description: listData.description || '',
        createdAt: listData.created_label || listData.created_at,
        isDefault: Boolean(listData.is_default),
        albums,
      });
      setIsLoading(false);
    };

    loadList();
    return () => {
      active = false;
    };
  }, [id]);

  const isDefaultList = list?.id === 'want-to-listen' || list?.isDefault;
  const albums = list?.albums || [];

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
            setVisibleCount((prev) => Math.min(albums.length, prev + INFINITE_PAGE_SIZE));
          }
        }}
      >
        <PageHeader
          title={list?.title || 'Lista'}
          subtitle={list?.description || undefined}
          onBack={() => safeGoBack('/lists')}
          backLabel="Voltar para Listas"
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
                {list?.count || albums.length} {list?.count === 1 ? 'álbum salvo' : 'álbuns salvos'}
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
        </View>

        {/* Seção de Álbuns na Lista */}
        <View style={styles.sectionHeading}>
          <Disc size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Álbuns nesta Lista ({albums.length})
          </Text>
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
              Navegue pelos álbuns e clique em &quot;Listas&quot; no menu para salvá-los aqui!
            </Text>

            <TouchableOpacity
              style={[
                styles.exploreBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push('/(tabs)/artists')}
              activeOpacity={0.85}
            >
              <Sparkles size={15} color="#fff" />
              <Text style={styles.exploreBtnText}>Explorar Álbuns</Text>
            </TouchableOpacity>
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
                  style={styles.albumRowCover}
                  quality="medium"
                />
                <View style={{ flex: 1, gap: 3 }}>
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
                    Toque para ver faixas e detalhes
                  </Text>
                </View>

                <ChevronRight size={16} color={colors.mutedForeground} />
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
    paddingBottom: 60,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
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
    textAlign: 'center',
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
});
