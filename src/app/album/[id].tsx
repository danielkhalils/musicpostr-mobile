import { CoverImage } from '@/components/CoverImage';
import { MobileHeader } from '@/components/MobileHeader';
import { StreamingIcon } from '@/components/StreamingIcon';
import { useAppTheme } from '@/context/ThemeContext';
import {
  findAlbumCoverArt,
  type CoverArtResult,
} from '@/services/coverArt.service';
import {
  fetchAlbumDetailsFromMusicBrainz,
  getInstantAlbumPreview,
  submitInternalAlbumReview,
  toggleAlbumListened,
  toggleFavoriteAlbum,
  getUserLists,
  addAlbumToUserList,
  addUserList,
  getCommunityFeedPosts,
  type AlbumUserReview,
  type CatalogAlbum,
  type UserListRecord,
} from '@/services/musicBrainz.service';
import { safeGoBack } from '@/utils/navigation';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Disc,
  Headphones,
  Heart,
  Layers,
  Maximize2,
  MessageSquare,
  Music,
  Star,
  ThumbsUp,
  Users,
  X,
  ListPlus,
  Check,
  Plus,
  ArrowRight,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GEN_Z_PHRASES: Record<number, { text: string; color: string }> = {
  0: { text: 'Dê sua nota para o álbum...', color: '#a1a1aa' },
  1: { text: '💀 Intakável, horrível de ouvir', color: '#ef4444' },
  2: { text: '🗑️ Muito fraco, total decepção', color: '#ef4444' },
  3: { text: '😬 Bem ruinzinho, não curti', color: '#f97316' },
  4: { text: '🥱 Meio sem graça, passa batido', color: '#f97316' },
  5: { text: '😐 Mediano, nada demais', color: '#eab308' },
  6: { text: '🎧 Bonzinho, dá para curtir', color: '#eab308' },
  7: { text: '🔥 Muito bom, curti bastante!', color: '#84cc16' },
  8: { text: '✨ Incrível, viciante demais', color: '#84cc16' },
  9: { text: '🛐 Obra-prima, perfeito do início ao fim', color: '#10b981' },
  10: { text: '🤯 Lendário! Simplesmente impecável!', color: '#10b981' },
};

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [album, setAlbum] = useState<CatalogAlbum | null>(() =>
    id ? getInstantAlbumPreview(id) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    id ? !getInstantAlbumPreview(id) : true
  );
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [postSuccess, setPostSuccess] = useState<boolean>(false);

  const [isCoverViewerOpen, setIsCoverViewerOpen] = useState<boolean>(false);
  const [coverSide, setCoverSide] = useState<'front' | 'back'>('front');
  const [coverArt, setCoverArt] = useState<CoverArtResult | null>(null);
  const [isLoadingCoverArt, setIsLoadingCoverArt] = useState<boolean>(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [userLists, setUserLists] = useState<UserListRecord[]>(() => getUserLists());
  const [listSuccessMessage, setListSuccessMessage] = useState<string | null>(null);
  const [newCustomListTitle, setNewCustomListTitle] = useState<string>('');

  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(0);
  const heroSliderRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;

  const [submittedReviews, setSubmittedReviews] = useState<AlbumUserReview[]>(
    () => (id ? getInstantAlbumPreview(id)?.reviews || [] : [])
  );

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const preview = getInstantAlbumPreview(id);
    setCoverArt(null);

    if (preview) {
      setAlbum(preview);
      setSubmittedReviews(preview.reviews || []);
      setIsLoading(false);
      if (preview.tracks && preview.tracks.data.length > 0) {
        setIsLoadingTracks(false);
        return;
      }
      setIsLoadingTracks(true);
    } else {
      setIsLoading(true);
    }

    fetchAlbumDetailsFromMusicBrainz(id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setAlbum(data);
          setSubmittedReviews(data.reviews || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingTracks(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePostReview = () => {
    if (!album) return;
    if (!reviewText.trim() && rating === 0) return;

    const updatedAlbum = submitInternalAlbumReview(
      album,
      rating || 8,
      reviewText || 'Avaliação sem comentário escrito.'
    );

    setAlbum({
      ...updatedAlbum,
      tracks: album.tracks,
    });
    setSubmittedReviews(updatedAlbum.reviews || []);
    setReviewText('');
    setRating(0);
    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setIsReviewModalOpen(false);
    }, 1500);
  };

  const handleOpenListModal = () => {
    setUserLists(getUserLists());
    setListSuccessMessage(null);
    setIsListModalOpen(true);
  };

  const handleAddToList = (listId: string, listTitle: string) => {
    if (!album) return;
    addAlbumToUserList(listId, album.title);
    setUserLists(getUserLists());
    setListSuccessMessage(`Adicionado à lista "${listTitle}"!`);
    setTimeout(() => {
      setListSuccessMessage(null);
      setIsListModalOpen(false);
    }, 1400);
  };

  const handleCreateAndAddList = () => {
    if (!newCustomListTitle.trim() || !album) return;
    const nextLists = addUserList(newCustomListTitle.trim(), `Lista criada a partir de ${album.title}`, 1);
    setUserLists(nextLists);
    setNewCustomListTitle('');
    setListSuccessMessage(`Lista criada e álbum adicionado!`);
    setTimeout(() => {
      setListSuccessMessage(null);
      setIsListModalOpen(false);
    }, 1400);
  };

  const handleToggleListened = () => {
    if (!album) return;
    const updated = toggleAlbumListened(album);
    setAlbum({
      ...updated,
      tracks: album.tracks,
    });
  };

  const handleToggleFavorite = () => {
    if (!album) return;
    const isFav = toggleFavoriteAlbum(album);
    setAlbum({
      ...album,
      isFavorite: isFav,
    });
  };

  const handleLikeReview = (reviewId: string | number) => {
    setSubmittedReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const liked = !r.likedByMe;
          return {
            ...r,
            likedByMe: liked,
            likes: (r.likes || 0) + (liked ? 1 : -1),
          };
        }
        return r;
      })
    );
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '—:—';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const albumId = album?.id;
  const albumTitle = album?.title;

  // Avaliações de amigos e pessoas que você segue
  const friendReviews = useMemo(() => {
    if (!albumId || !albumTitle) return [];
    const list: (AlbumUserReview & { isFriend?: boolean })[] = [];
    const seenTexts = new Set<string>();

    // Conjunto de identificadores de amigos / seguidos conhecidos no app
    const knownFriendsUsernames = new Set([
      'lucas_snd',
      'beatcritic',
      'anabeat',
      'sofiamel',
      'rodrigo_indie',
    ]);
    const knownFriendsNames = new Set([
      'lucas sound',
      'beat critic',
      'ana beatriz',
      'sofia melodias',
      'rodrigo indie',
      'lucassound',
    ]);

    const isUserFriendOrFollowed = (username?: string, name?: string) => {
      if (username && knownFriendsUsernames.has(username.toLowerCase().trim())) {
        return true;
      }
      if (name && knownFriendsNames.has(name.toLowerCase().trim())) {
        return true;
      }
      return false;
    };

    // 1. Buscar posts do feed geral relacionados a este álbum publicados por amigos
    try {
      const feedPosts = getCommunityFeedPosts();
      const relevantFeedPosts = feedPosts.filter(
        (p) =>
          (!p.activityType || p.activityType === 'review') &&
          ((p.albumId && p.albumId === albumId) ||
            (p.albumTitle &&
              p.albumTitle.toLowerCase() === albumTitle.toLowerCase()))
      );

      for (const p of relevantFeedPosts) {
        const uName = p.friendUsername;
        const fName = p.friendName;
        const key = `${fName || uName}-${p.comment}`;
        if (!seenTexts.has(key)) {
          seenTexts.add(key);
          list.push({
            id: `feed-${p.id}`,
            user: fName || uName || 'Amigo',
            username: uName,
            avatar: p.friendAvatar,
            comment: p.comment,
            rating: p.rating,
            date: p.timeAgo || 'Recente',
            likes: p.likesCount || 0,
            likedByMe: Boolean(p.isLiked),
            commentsCount: p.comments?.length || 0,
            isFriend: isUserFriendOrFollowed(uName, fName),
          });
        }
      }
    } catch {
      // ignore
    }

    // 2. Reviews internas cadastradas no álbum
    for (const rev of submittedReviews) {
      const key = `${rev.user}-${rev.comment}`;
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        list.push({
          ...rev,
          isFriend: isUserFriendOrFollowed(rev.username, rev.user),
        });
      }
    }

    // Priorizar e filtrar avaliações de amigos e quem você segue
    const friendsOnly = list.filter((r) => r.isFriend);
    const pool = friendsOnly.length > 0 ? friendsOnly : list;

    // Ordenar pelas mais relevantes (mais curtidas e mais comentadas)
    return pool.sort((a, b) => {
      const scoreA = (a.likes || 0) + (a.commentsCount || 0) * 2;
      const scoreB = (b.likes || 0) + (b.commentsCount || 0) * 2;
      return scoreB - scoreA;
    });
  }, [submittedReviews, albumId, albumTitle]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MobileHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!album) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MobileHeader />
        <View style={styles.centerBox}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
            Álbum não encontrado.
          </Text>
          <TouchableOpacity
            onPress={() => safeGoBack(artistId ? `/artist/${artistId}` : '/(tabs)/artists')}
            style={[
              styles.backPillBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const coverImage = album.cover_medium || album.cover_big || album.cover_xl;
  const hdCoverImage = album.cover_xl || album.cover_big || album.cover_medium;
  const artistId = album.artist?.id || '';
  const artistName = album.artist?.name || 'Artista';
  const averageRating = album.communityRating.toFixed(1);
  const currentGenZ = GEN_Z_PHRASES[rating] || GEN_Z_PHRASES[0];

  // Exibir as 5 mais relevantes dos amigos
  const displayedReviews = friendReviews.slice(0, 5);

  const recordTypeLabel =
    album.record_type === 'ep'
      ? 'EP Oficial'
      : album.record_type === 'single'
        ? 'Single Oficial'
        : 'Álbum Oficial';

  const handleOpenCoverModal = () => {
    setIsCoverViewerOpen(true);
    setCoverSide('front');
    if (!coverArt && !isLoadingCoverArt) {
      setIsLoadingCoverArt(true);
      findAlbumCoverArt(album.title, artistName, album.id, album.releaseId)
        .then((result) => setCoverArt(result))
        .catch(() => setCoverArt(null))
        .finally(() => setIsLoadingCoverArt(false));
    }
  };

  const activeCoverUrl = coverArt
    ? coverSide === 'front'
      ? coverArt.frontUrl
      : coverArt.backUrl ?? hdCoverImage
    : hdCoverImage;

  const streamingLinks = [
    {
      label: 'Spotify',
      color: '#1db954',
      url: `https://open.spotify.com/search/${encodeURIComponent(`${album.title} ${artistName}`)}`,
    },
    {
      label: 'Apple Music',
      color: '#fa2d4b',
      url: `https://music.apple.com/us/search?term=${encodeURIComponent(`${album.title} ${artistName}`)}`,
    },
    {
      label: 'YouTube Music',
      color: '#ff0000',
      url: `https://music.youtube.com/search?q=${encodeURIComponent(`${album.title} ${artistName}`)}`,
    },
    {
      label: 'Tidal',
      color: '#00bcd4',
      url: `https://tidal.com/search?q=${encodeURIComponent(`${album.title} ${artistName}`)}`,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Botão Voltar Fixo no Topo Flutuando */}
      <View
        style={[
          styles.floatingHeaderBar,
          { top: Math.max(insets.top, 10) },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => safeGoBack(artistId ? `/artist/${artistId}` : '/(tabs)/artists')}
          activeOpacity={0.85}
        >
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero com a Capa em Blur no Fundo */}
        <View style={styles.blurHeroWrapper}>
        {/* Imagem de Capa no Fundo com Blur */}
        <View style={StyleSheet.absoluteFill}>
          <CoverImage
            uri={coverImage}
            style={{ width: '100%', height: '100%' }}
            quality="medium"
          />

          {/* Camada Blur nativa */}
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <BlurView
              intensity={isDark ? 65 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          {/* Gradiente para fundir suavemente com a cor de fundo do tema */}
          <LinearGradient
            colors={[
              isDark ? 'rgba(9, 9, 11, 0.45)' : 'rgba(255, 255, 255, 0.35)',
              isDark ? 'rgba(9, 9, 11, 0.75)' : 'rgba(255, 255, 255, 0.7)',
              colors.background,
            ]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

          {/* Slider Horizontal Deslizante com Capa e Informações do Álbum */}
          <View style={{ paddingTop: Math.max(insets.top + 48, 60) }}>
            <ScrollView
              ref={heroSliderRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const page = Math.round(offsetX / screenWidth);
                setHeroSlideIndex(page);
              }}
              style={{ width: screenWidth }}
            >
              {/* SLIDE 1: Capa do Álbum */}
              <View style={[styles.heroSlidePage, { width: screenWidth }]}>
                <TouchableOpacity
                  onPress={handleOpenCoverModal}
                  style={styles.heroCoverTouch}
                  activeOpacity={0.88}
                >
                  <CoverImage
                    uri={coverImage}
                    style={styles.heroCoverImage}
                    quality="high"
                  />
                  <View style={styles.hdBadgeOverlay}>
                    <Maximize2 size={11} color="#fff" />
                    <Text style={styles.hdBadgeText}>HD</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* SLIDE 2: Informações do Álbum (com fundo translúcido sobre a mesma arte em blur) */}
              <View style={[styles.heroSlidePage, { width: screenWidth }]}>
                <View style={styles.heroInfoSlideCard}>
                  <View style={styles.heroInfoSlideHeader}>
                    <View style={styles.heroInfoSlideIconWrap}>
                      <Disc size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroInfoSlideTitle}>
                        Informações do Álbum
                      </Text>
                      <Text style={styles.heroInfoSlideSubtitle} numberOfLines={1}>
                        Metadados e detalhes técnicos
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroInfoGrid}>
                    <View style={styles.heroInfoGridItem}>
                      <View style={styles.heroInfoItemHeader}>
                        <Layers size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroInfoItemLabel}>Formato</Text>
                      </View>
                      <Text style={styles.heroInfoItemValue} numberOfLines={1}>
                        {recordTypeLabel}
                      </Text>
                    </View>

                    <View style={styles.heroInfoGridItem}>
                      <View style={styles.heroInfoItemHeader}>
                        <Calendar size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroInfoItemLabel}>Lançamento</Text>
                      </View>
                      <Text style={styles.heroInfoItemValue} numberOfLines={1}>
                        {album.release_date?.substring(0, 4) || '—'}
                      </Text>
                    </View>

                    <View style={styles.heroInfoGridItem}>
                      <View style={styles.heroInfoItemHeader}>
                        <Music size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroInfoItemLabel}>Gênero</Text>
                      </View>
                      <Text style={styles.heroInfoItemValue} numberOfLines={1}>
                        {album.genreName || 'Música'}
                      </Text>
                    </View>

                    <View style={styles.heroInfoGridItem}>
                      <View style={styles.heroInfoItemHeader}>
                        <Users size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroInfoItemLabel}>Ouvintes</Text>
                      </View>
                      <Text style={styles.heroInfoItemValue} numberOfLines={1}>
                        {album.listenersCount.toLocaleString('pt-BR')}
                      </Text>
                    </View>
                  </View>

                  {/* Botão de retorno para a Capa */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      heroSliderRef.current?.scrollTo({ x: 0, animated: true });
                      setHeroSlideIndex(0);
                    }}
                    style={styles.swipeBackBadge}
                  >
                    <Text style={styles.swipeHintText}>← Voltar para a capa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Indicador de Paginação / Dots */}
            <View style={styles.heroPaginationDots}>
              <TouchableOpacity
                onPress={() => {
                  heroSliderRef.current?.scrollTo({ x: 0, animated: true });
                  setHeroSlideIndex(0);
                }}
                style={[
                  styles.heroDot,
                  heroSlideIndex === 0 ? styles.heroDotActive : styles.heroDotInactive,
                  { backgroundColor: heroSlideIndex === 0 ? colors.primary : 'rgba(255,255,255,0.35)' },
                ]}
              />
              <TouchableOpacity
                onPress={() => {
                  heroSliderRef.current?.scrollTo({ x: screenWidth, animated: true });
                  setHeroSlideIndex(1);
                }}
                style={[
                  styles.heroDot,
                  heroSlideIndex === 1 ? styles.heroDotActive : styles.heroDotInactive,
                  { backgroundColor: heroSlideIndex === 1 ? colors.primary : 'rgba(255,255,255,0.35)' },
                ]}
              />
            </View>
          </View>

          {/* Conteúdo Central do Hero: Título, Artista e Nota Pitchfork Style */}
          <View style={styles.heroForegroundContent}>
            {/* Título e Artista */}
            <View style={styles.heroTitlesBlock}>
              <Text
                style={[
                  styles.heroAlbumTitle,
                  { color: colors.foreground },
                ]}
                numberOfLines={2}
              >
                {album.title}
              </Text>
              <TouchableOpacity
                disabled={!artistId}
                onPress={() =>
                  artistId && router.push(`/artist/${artistId}` as any)
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.heroArtistName, { color: colors.primary }]}>
                  {artistName}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Círculo de Nota de Destaque Estilo Pitchfork */}
            <View style={styles.pitchforkScoreSection}>
              <View
                style={[
                  styles.pitchforkCircle,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.pitchforkScoreText, { color: colors.foreground }]}>
                  {averageRating}
                </Text>
              </View>
              <View style={styles.pitchforkMetaCol}>
                <Text style={[styles.pitchforkLabel, { color: colors.foreground }]}>
                  NOTA DA COMUNIDADE
                </Text>
                <Text style={[styles.pitchforkSubLabel, { color: colors.mutedForeground }]}>
                  Baseada em {album.totalReviews} avaliações de ouvintes
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Links de Streaming */}
        <View style={styles.albumActionsSection}>
          <View
            style={[
              styles.streamingBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '800',
                color: colors.foreground,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Ouvir no Streaming
            </Text>
            <View style={styles.streamingBtnsWrap}>
              {streamingLinks.map((st) => (
                <TouchableOpacity
                  key={st.label}
                  onPress={() => Linking.openURL(st.url).catch(() => {})}
                  style={[
                    styles.streamingLogoBtn,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel={st.label}
                  accessibilityRole="button"
                >
                  <StreamingIcon name={st.label} size={28} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Sessão: Músicas do Álbum (fora de card, estrutura limpa de lista) */}
        {album.tracks &&
        album.tracks.data &&
        album.tracks.data.length > 0 ? (
          <View style={styles.tracksSection}>
            <View style={styles.sectionHeadingLine}>
              <Clock size={18} color={colors.primary} />
              <Text style={[styles.sectionHeadingTitle, { color: colors.foreground }]}>
                Músicas do Álbum ({album.tracks.data.length})
              </Text>
            </View>

            <View
              style={[
                styles.tracklistContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {album.tracks.data.map((track, index) => (
                <View
                  key={track.id}
                  style={[
                    styles.trackRow,
                    index < album.tracks!.data.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.trackNum,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <Text
                    style={[styles.trackName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text
                    style={[
                      styles.trackDuration,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {formatDuration(track.duration)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : isLoadingTracks ? (
          <View
            style={[
              styles.tracksLoadingBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Carregando lista de faixas...
            </Text>
          </View>
        ) : null}

        {/* Avaliações dos Amigos */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeadingLine}>
            <Users size={18} color={colors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginBottom: 0 },
              ]}
            >
              Avaliações ({friendReviews.length})
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            Principais impressões de amigos e pessoas que você segue.
          </Text>

          {displayedReviews.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 24,
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                Nenhum dos seus amigos avaliou este álbum ainda.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {displayedReviews.map((rev) => {
                const revPhrase =
                  GEN_Z_PHRASES[Math.round(rev.rating)] || GEN_Z_PHRASES[0];
                return (
                  <View
                    key={rev.id}
                    style={[
                      styles.communityReviewItem,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.revHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          const userTag = rev.username || rev.user;
                          if (userTag) {
                            router.push(`/user/${userTag}` as any);
                          }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '800',
                            color: colors.foreground,
                          }}
                        >
                          @{rev.username || rev.user}
                        </Text>
                        <View
                          style={{
                            backgroundColor: `${colors.primary}18`,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9.5,
                              fontWeight: '700',
                              color: colors.primary,
                            }}
                          >
                            Amigo
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.revScorePill,
                          { backgroundColor: `${revPhrase.color}22` },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '900',
                            color: revPhrase.color,
                          }}
                        >
                          {rev.rating}/10
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          color={
                            rev.rating >= s
                              ? colors.amber
                              : colors.mutedForeground
                          }
                          fill={rev.rating >= s ? colors.amber : 'transparent'}
                        />
                      ))}
                    </View>

                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: revPhrase.color,
                        marginTop: 6,
                      }}
                    >
                      {revPhrase.text}
                    </Text>

                    <Text
                      style={{
                        fontSize: 12.5,
                        color: colors.foreground,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {`"${rev.comment}"`}
                    </Text>

                    <View style={styles.revFooterRow}>
                      <TouchableOpacity
                        onPress={() => handleLikeReview(rev.id)}
                        style={styles.revActionBtn}
                      >
                        <ThumbsUp
                          size={12}
                          color={
                            rev.likedByMe
                              ? colors.primary
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: rev.likedByMe
                              ? colors.primary
                              : colors.mutedForeground,
                          }}
                        >
                          Curtir ({rev.likes || 0})
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.revActionBtn}>
                        <MessageSquare size={12} color={colors.mutedForeground} />
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.mutedForeground,
                          }}
                        >
                          {rev.date || 'Recente'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Botão Ver mais avaliações dos amigos */}
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/(tabs)/reviews' as any,
                params: {
                  albumId: album.id,
                  search: album.title,
                },
              });
            }}
            style={[
              styles.moreReviewsBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                marginTop: 14,
              },
            ]}
            activeOpacity={0.8}
          >
            <Users size={14} color={colors.primary} />
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '700',
                color: colors.foreground,
              }}
            >
              Ver mais avaliações dos seus amigos
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Visualizador de Capa em HD */}
      <Modal
        visible={isCoverViewerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCoverViewerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
                <Text
                  style={{ fontSize: 11, color: colors.mutedForeground }}
                >
                  {artistName} • Cover Art Archive HD
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCoverViewerOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.modalImageFrame,
                { backgroundColor: colors.secondary },
              ]}
            >
              {isLoadingCoverArt ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : activeCoverUrl ? (
                <CoverImage
                  uri={activeCoverUrl}
                  style={{ width: '100%', height: 290 }}
                  contentFit="contain"
                  quality="medium"
                />
              ) : (
                <Music size={42} color={colors.mutedForeground} />
              )}
            </View>

            <View style={styles.sideSwitchRow}>
              <TouchableOpacity
                onPress={() => setCoverSide('front')}
                style={[
                  styles.sideSwitchBtn,
                  {
                    backgroundColor:
                      coverSide === 'front'
                        ? colors.primary
                        : colors.secondary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: coverSide === 'front' ? '#fff' : colors.foreground,
                  }}
                >
                  Frente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!coverArt?.backUrl}
                onPress={() => setCoverSide('back')}
                style={[
                  styles.sideSwitchBtn,
                  {
                    backgroundColor:
                      coverSide === 'back' ? colors.primary : colors.secondary,
                    opacity: !coverArt?.backUrl ? 0.45 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: coverSide === 'back' ? '#fff' : colors.foreground,
                  }}
                >
                  Verso
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Inferior Flutuante Estilo Navbar adaptado */}
      <View
        style={[
          styles.floatingBottomBar,
          {
            bottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10),
            backgroundColor: isDark
              ? 'rgba(24, 24, 27, 0.94)'
              : 'rgba(255, 255, 255, 0.94)',
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.4 : 0.12,
          },
        ]}
      >
        {/* Opção Avaliar */}
        <TouchableOpacity
          onPress={() => setIsReviewModalOpen(true)}
          style={styles.floatingBarItem}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.floatingBarIconWrap,
              rating > 0 && {
                backgroundColor: `${colors.amber}22`,
                borderRadius: 999,
              },
            ]}
          >
            <Star
              size={18}
              color={rating > 0 ? colors.amber : colors.primary}
              fill={rating > 0 ? colors.amber : 'transparent'}
            />
          </View>
          <Text
            style={[
              styles.floatingBarLabel,
              { color: rating > 0 ? colors.amber : colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {rating > 0 ? `${rating}/10` : 'Avaliar'}
          </Text>
        </TouchableOpacity>

        {/* Opção Favoritar */}
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.floatingBarItem}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.floatingBarIconWrap,
              album.isFavorite && {
                backgroundColor: `${colors.rose}22`,
                borderRadius: 999,
              },
            ]}
          >
            <Heart
              size={18}
              color={album.isFavorite ? colors.rose : colors.mutedForeground}
              fill={album.isFavorite ? colors.rose : 'transparent'}
            />
          </View>
          <Text
            style={[
              styles.floatingBarLabel,
              { color: album.isFavorite ? colors.rose : colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {album.isFavorite ? 'Favoritado' : 'Favoritar'}
          </Text>
        </TouchableOpacity>

        {/* Opção Marcar como Ouvido */}
        <TouchableOpacity
          onPress={handleToggleListened}
          style={styles.floatingBarItem}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.floatingBarIconWrap,
              album.listenedByMe && {
                backgroundColor: `${colors.primary}22`,
                borderRadius: 999,
              },
            ]}
          >
            <Headphones
              size={18}
              color={album.listenedByMe ? colors.primary : colors.mutedForeground}
            />
          </View>
          <Text
            style={[
              styles.floatingBarLabel,
              { color: album.listenedByMe ? colors.primary : colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {album.listenedByMe ? 'Ouvido ✓' : 'Já ouvi'}
          </Text>
        </TouchableOpacity>

        {/* Opção Adicionar a uma Lista */}
        <TouchableOpacity
          onPress={handleOpenListModal}
          style={styles.floatingBarItem}
          activeOpacity={0.7}
        >
          <View style={styles.floatingBarIconWrap}>
            <ListPlus size={18} color={colors.mutedForeground} />
          </View>
          <Text
            style={[styles.floatingBarLabel, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: Avaliar / Favoritar Álbum */}
      <Modal
        visible={isReviewModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsReviewModalOpen(false)}
      >
        <View style={styles.sheetModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsReviewModalOpen(false)}
          />
          <View
            style={[
              styles.sheetModalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <View style={styles.sheetModalDragIndicator} />

            <View style={styles.sheetModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetModalTitle, { color: colors.foreground }]}>
                  Avaliar Álbum
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {album.title} • {artistName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsReviewModalOpen(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Atalho rápido para Favoritar dentro da Modal */}
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={[
                styles.modalFavoriteQuickRow,
                {
                  backgroundColor: album.isFavorite
                    ? `${colors.rose}18`
                    : colors.secondary,
                  borderColor: album.isFavorite ? `${colors.rose}50` : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Heart
                size={16}
                color={album.isFavorite ? colors.rose : colors.foreground}
                fill={album.isFavorite ? colors.rose : 'transparent'}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: album.isFavorite ? colors.rose : colors.foreground,
                }}
              >
                {album.isFavorite
                  ? 'Álbum favoritado nos seus destaques'
                  : 'Tocar para favoritar este álbum'}
              </Text>
            </TouchableOpacity>

            {/* Frase Gen Z */}
            <View
              style={[
                styles.genZBadge,
                {
                  borderColor: `${currentGenZ.color}50`,
                  backgroundColor: `${currentGenZ.color}15`,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: currentGenZ.color,
                }}
              >
                {currentGenZ.text}
              </Text>
            </View>

            {/* 10 Estrelas Interativas */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const active = rating >= star;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starBtn}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={24}
                      color={active ? colors.amber : colors.mutedForeground}
                      fill={active ? colors.amber : 'transparent'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {postSuccess && (
              <View
                style={[
                  styles.successBanner,
                  {
                    backgroundColor: `${colors.emerald}20`,
                    borderColor: `${colors.emerald}45`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.emerald,
                  }}
                >
                  ✓ Sua avaliação foi publicada com sucesso!
                </Text>
              </View>
            )}

            <TextInput
              multiline
              placeholder="Compartilhe seus pensamentos sobre este álbum..."
              placeholderTextColor={colors.mutedForeground}
              value={reviewText}
              onChangeText={setReviewText}
              style={[
                styles.reviewTextarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handlePostReview}
              style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.submitReviewBtnText}>Publicar Avaliação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Adicionar a uma Lista */}
      <Modal
        visible={isListModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsListModalOpen(false)}
      >
        <View style={styles.sheetModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsListModalOpen(false)}
          />
          <View
            style={[
              styles.sheetModalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <View style={styles.sheetModalDragIndicator} />

            <View style={styles.sheetModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetModalTitle, { color: colors.foreground }]}>
                  Adicionar a uma Lista
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  Escolha uma lista para salvar {album.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsListModalOpen(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {listSuccessMessage && (
              <View
                style={[
                  styles.successBanner,
                  {
                    backgroundColor: `${colors.emerald}20`,
                    borderColor: `${colors.emerald}45`,
                  },
                ]}
              >
                <Check size={14} color={colors.emerald} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.emerald,
                  }}
                >
                  {listSuccessMessage}
                </Text>
              </View>
            )}

            {/* Criar nova lista diretamente */}
            <View style={styles.createListInlineRow}>
              <TextInput
                placeholder="Criar nova lista..."
                placeholderTextColor={colors.mutedForeground}
                value={newCustomListTitle}
                onChangeText={setNewCustomListTitle}
                style={[
                  styles.createListInput,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={handleCreateAndAddList}
                disabled={!newCustomListTitle.trim()}
                style={[
                  styles.createListAddBtn,
                  {
                    backgroundColor: newCustomListTitle.trim()
                      ? colors.primary
                      : colors.secondary,
                  },
                ]}
              >
                <Plus
                  size={16}
                  color={newCustomListTitle.trim() ? '#fff' : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            {/* Listagem das listas do usuário */}
            <ScrollView
              style={{ maxHeight: 250, marginTop: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {userLists.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAddToList(item.id, item.title)}
                  style={[
                    styles.userListItemBtn,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.userListItemTitle, { color: colors.foreground }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.userListItemSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.count} {item.count === 1 ? 'álbum' : 'álbuns'} • {item.description}
                    </Text>
                  </View>
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  backPillBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  floatingHeaderBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  blurHeroWrapper: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroForegroundContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  heroSlidePage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 255,
  },
  heroCoverTouch: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  swipeHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  swipeHintText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  swipeBackBadge: {
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroInfoSlideCard: {
    width: 250,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  heroInfoSlideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.18)',
    paddingBottom: 10,
  },
  heroInfoSlideIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfoSlideTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroInfoSlideSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '600',
  },
  heroInfoGrid: {
    gap: 8,
  },
  heroInfoGridItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroInfoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroInfoItemLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroInfoItemValue: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    maxWidth: 120,
    textAlign: 'right',
  },
  heroPaginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },
  heroDotActive: {
    width: 18,
  },
  heroDotInactive: {
    width: 6,
  },
  albumActionsSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 14,
  },
  sectionHeadingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroCoverImage: {
    width: 210,
    height: 210,
    borderRadius: 18,
  },
  hdBadgeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hdBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitlesBlock: {
    alignItems: 'center',
    gap: 4,
    maxWidth: '90%',
  },
  heroAlbumTitle: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroArtistName: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pitchforkScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pitchforkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  pitchforkScoreText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  pitchforkMetaCol: {
    justifyContent: 'center',
  },
  pitchforkLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pitchforkSubLabel: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 190,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
  },
  streamingBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  streamingBtnsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streamingLogoBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rateCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  rateScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  genZBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  starBtn: {
    padding: 2,
  },
  successBanner: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewTextarea: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  tracksSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tracklistContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tracksLoadingBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  trackNum: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
  },
  trackName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  trackDuration: {
    fontSize: 12,
  },
  communityReviewItem: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  revHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  revFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  revActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  moreReviewsBtn: {
    marginTop: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalImageFrame: {
    height: 300,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  sideSwitchBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 999,
  },
  floatingBottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 12,
    zIndex: 25,
  },
  floatingBarItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  floatingBarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  floatingBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sheetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetModalContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  sheetModalDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalFavoriteQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  createListInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  createListInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  createListAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userListItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  userListItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  userListItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
