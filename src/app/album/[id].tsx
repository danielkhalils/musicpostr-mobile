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
  getUserProfile,
  getMyReviews,
  getAlbumAwards,
  getFallbackImageUrl,
  getFollowedArtistIds,
  toggleFollowArtist,
  type AlbumUserReview,
  type CatalogAlbum,
  type CatalogArtist,
  type UserListRecord,
} from '@/services/musicBrainz.service';
import { SocialIcon } from '@/components/SocialIcon';
import { safeGoBack } from '@/utils/navigation';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Headphones,
  Heart,
  Layers,
  Maximize2,
  Music,
  Star,
  Users,
  X,
  ListPlus,
  Check,
  Plus,
  ArrowRight,
  Trophy,
  Quote,
  ExternalLink,
  Award,
  MoreVertical,
  Share2,
  UserPlus,
  UserCheck,
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
  Share,
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
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>(() =>
    getFollowedArtistIds()
  );
  const [userLists, setUserLists] = useState<UserListRecord[]>(() => getUserLists());
  const [listSuccessMessage, setListSuccessMessage] = useState<string | null>(null);
  const [newCustomListTitle, setNewCustomListTitle] = useState<string>('');

  const [scoreSlideIndex, setScoreSlideIndex] = useState<number>(0);
  const scoreSliderRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;
  const scorePagerWidth = screenWidth - 40;

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

    const chosenRating = rating || 8;
    const chosenReview = reviewText || 'Avaliação sem comentário escrito.';

    const updatedAlbum = submitInternalAlbumReview(
      album,
      chosenRating,
      chosenReview
    );

    setAlbum({
      ...updatedAlbum,
      tracks: album.tracks,
    });
    setSubmittedReviews(updatedAlbum.reviews || []);
    setRating(chosenRating);
    setReviewText(chosenReview);
    setPostSuccess(false);
    setIsReviewModalOpen(false);
  };

  const isFollowingArtist = useMemo(() => {
    const aId = album?.artist?.id;
    if (!aId) return false;
    return followedArtistIds.includes(String(aId));
  }, [album?.artist?.id, followedArtistIds]);

  const handleToggleFollowArtist = () => {
    if (!album?.artist) return;
    const nextIds = toggleFollowArtist({
      id: String(album.artist.id),
      name: album.artist.name,
      genre: album.genre,
      imageUrl: album.artist.picture_medium || album.artist.picture,
    } as any);
    setFollowedArtistIds(nextIds);
  };

  const handleShareAlbum = async () => {
    if (!album) return;
    setIsOptionsMenuOpen(false);
    try {
      await Share.share({
        title: `${album.title} - ${album.artist?.name || 'Artista'}`,
        message: `Confira o álbum "${album.title}" de ${album.artist?.name || 'Artista'} no Musicpostr! Avaliação da comunidade: ${album.communityRating.toFixed(1)}/10 ⭐`,
      });
    } catch {}
  };

  const handleShareReviewGeneral = async () => {
    if (!album || !currentUserReview) return;
    setIsShareModalOpen(false);
    try {
      await Share.share({
        title: `Minha avaliação de ${album.title} no Musicpostr`,
        message: `Minha avaliação para "${album.title}" de ${album.artist?.name || 'Artista'} no Musicpostr: ⭐️ ${Number(currentUserReview.rating).toFixed(1)}/10!\n"${currentUserReview.comment}"\n\nConfira no Musicpostr!`,
      });
    } catch {}
  };

  const handleShareReviewInstagramStories = async () => {
    if (!album || !currentUserReview) return;
    setIsShareModalOpen(false);
    const storyText = `Minha nota para "${album.title}" de ${album.artist?.name || 'Artista'} no Musicpostr: ⭐️ ${Number(currentUserReview.rating).toFixed(1)}/10!\n"${currentUserReview.comment}"`;

    const igStoryUrl = 'instagram://story-camera';
    try {
      const canOpen = await Linking.canOpenURL(igStoryUrl);
      if (canOpen) {
        await Linking.openURL(igStoryUrl);
        return;
      }
    } catch {}

    try {
      const igAppUrl = 'instagram://app';
      if (await Linking.canOpenURL(igAppUrl)) {
        await Linking.openURL(igAppUrl);
        return;
      }
    } catch {}

    try {
      await Share.share({
        title: `Minha avaliação de ${album.title}`,
        message: `${storyText}\n\nCompartilhado via Musicpostr`,
      });
    } catch {}
  };

  const handleOpenListModal = () => {
    setUserLists(getUserLists());
    setListSuccessMessage(null);
    setIsListModalOpen(true);
  };

  const handleAddToList = (listId: string, listTitle: string) => {
    if (!album) return;
    addAlbumToUserList(listId, album.title, album.id, album.cover_medium);
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '—:—';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const userProfile = useMemo(() => getUserProfile(), []);

  const currentUserReview = useMemo(() => {
    if (!album) return null;
    const myRevs = getMyReviews();
    const foundInMy = myRevs.find(
      (r) =>
        String(r.albumId) === String(album.id) ||
        (r.albumTitle && r.albumTitle.toLowerCase() === album.title.toLowerCase())
    );
    if (foundInMy) return foundInMy;

    const foundInSubmitted = submittedReviews.find(
      (r) =>
        (r.username && r.username.toLowerCase() === userProfile.username.toLowerCase()) ||
        (r.user && r.user.toLowerCase() === userProfile.name.toLowerCase())
    );
    if (foundInSubmitted) {
      return {
        id: String(foundInSubmitted.id),
        albumId: album.id,
        albumTitle: album.title,
        artistName: album.artist?.name || 'Artista',
        coverUrl: album.cover_medium || album.cover_big,
        rating: foundInSubmitted.rating,
        comment: foundInSubmitted.comment,
        date: foundInSubmitted.date || 'Recente',
      };
    }
    return null;
  }, [album, submittedReviews, userProfile]);

  useEffect(() => {
    if (currentUserReview && rating === 0) {
      setRating(Number(currentUserReview.rating));
      setReviewText(currentUserReview.comment || '');
    }
  }, [currentUserReview]);

  const awards = useMemo(() => {
    if (!album) return [];
    return getAlbumAwards(album.id, album.title, album.artist.name);
  }, [album]);

  const handleStarPress = (starIndex: number) => {
    if (starIndex === 10) {
      setRating(10);
      return;
    }
    const currentBase = Math.floor(rating);
    if (currentBase === starIndex) {
      // Já está nesta estrela: incrementa décimos de 0 a 9 em ciclo
      const currentDec = Math.round((rating - currentBase) * 10);
      const nextDec = (currentDec + 1) % 10;
      const nextVal = Number((starIndex + nextDec * 0.1).toFixed(1));
      setRating(nextVal);
    } else {
      setRating(starIndex);
    }
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
            onPress={() => safeGoBack('/(tabs)/index')}
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
  const currentGenZ = GEN_Z_PHRASES[Math.floor(rating)] || GEN_Z_PHRASES[0];

  const friendsRated = friendReviews.filter((r) => r.isFriend && r.rating > 0);
  const friendsAverage =
    friendsRated.length > 0
      ? friendsRated.reduce((acc, r) => acc + Number(r.rating), 0) / friendsRated.length
      : null;

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
      {/* Botões Voltar e 3 Pontinhos Fixos no Topo Flutuando */}
      <View
        style={[
          styles.floatingHeaderBar,
          { top: Math.max(insets.top, 10) },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => safeGoBack('/(tabs)/index')}
          activeOpacity={0.85}
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => setIsOptionsMenuOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Mais opções"
        >
          <MoreVertical size={18} color="#fff" />
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

          {/* Capa do Álbum */}
          <View style={[styles.heroSlidePage, { paddingTop: Math.max(insets.top + 48, 60) }]}>
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

            {/* Informações do Álbum */}
            <View style={styles.albumInfoRow}>
              {[
                { icon: Layers, label: 'Formato', value: recordTypeLabel },
                { icon: Calendar, label: 'Lançamento', value: album.release_date?.substring(0, 4) || '—' },
                { icon: Music, label: 'Gênero', value: album.genreName || 'Música' },
                { icon: Users, label: 'Ouvintes', value: album.listenersCount.toLocaleString('pt-BR') },
              ].map(({ icon: Icon, label, value }) => (
                <View
                  key={label}
                  style={[
                    styles.albumInfoChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.heroInfoItemHeader}>
                    <Icon size={12} color={colors.mutedForeground} />
                    <Text style={[styles.albumInfoLabel, { color: colors.mutedForeground }]}>
                      {label}
                    </Text>
                  </View>
                  <Text
                    style={[styles.albumInfoValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Notas em swipe: 1) Amigos  2) Comunidade */}
            <View style={{ width: scorePagerWidth, alignSelf: 'center' }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  setScoreSlideIndex(
                    Math.round(e.nativeEvent.contentOffset.x / scorePagerWidth)
                  );
                }}
                ref={scoreSliderRef}
              >
                {[
                  {
                    key: 'friends',
                    score: friendsAverage !== null ? friendsAverage.toFixed(1) : '—',
                    label: 'NOTA DOS AMIGOS',
                    sub:
                      friendsAverage !== null
                        ? `Baseada em ${friendsRated.length} ${friendsRated.length === 1 ? 'avaliação' : 'avaliações'} de amigos`
                        : 'Nenhum amigo avaliou este álbum ainda',
                  },
                  {
                    key: 'community',
                    score: averageRating,
                    label: 'NOTA DA COMUNIDADE',
                    sub: `Baseada em ${album.totalReviews} avaliações da comunidade`,
                  },
                ].map((slide) => (
                  <View
                    key={slide.key}
                    style={[styles.musicpostrScoreSection, { width: scorePagerWidth }]}
                  >
                    <View
                      style={[
                        styles.musicpostrCircle,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.primary,
                          shadowColor: colors.primary,
                        },
                      ]}
                    >
                      <Text style={[styles.musicpostrScoreText, { color: colors.foreground }]}>
                        {slide.score}
                      </Text>
                    </View>
                    <View style={styles.musicpostrMetaCol}>
                      <Text style={[styles.musicpostrLabel, { color: colors.foreground }]}>
                        {slide.label}
                      </Text>
                      <Text style={[styles.musicpostrSubLabel, { color: colors.mutedForeground }]}>
                        {slide.sub}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.heroPaginationDots}>
                {[0, 1].map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      scoreSliderRef.current?.scrollTo({ x: i * scorePagerWidth, animated: true });
                      setScoreSlideIndex(i);
                    }}
                    style={[
                      styles.heroDot,
                      scoreSlideIndex === i ? styles.heroDotActive : styles.heroDotInactive,
                      { backgroundColor: scoreSlideIndex === i ? colors.primary : colors.border },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Avaliação do Usuário Logado (ou CTA de Não Avaliado) */}
            {currentUserReview ? (
              <View
                style={[
                  styles.userReviewQuoteCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: `${colors.primary}45`,
                  },
                ]}
              >
                <View style={styles.userReviewQuoteHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <CoverImage
                      uri={userProfile.avatarUrl || getFallbackImageUrl(userProfile.name)}
                      style={styles.userReviewAvatar}
                      quality="low"
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[styles.userReviewAuthorName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {userProfile.name}
                        </Text>
                        <View style={[styles.myReviewBadge, { backgroundColor: `${colors.primary}22` }]}>
                          <Text style={[styles.myReviewBadgeText, { color: colors.primary }]}>
                            Sua Avaliação
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.userReviewHandle, { color: colors.mutedForeground }]}>
                        @{userProfile.username}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.userReviewScoreBadge, { backgroundColor: `${colors.amber}22` }]}>
                    <Star size={13} color={colors.amber} fill={colors.amber} />
                    <Text style={[styles.userReviewScoreText, { color: colors.amber }]}>
                      {Number(currentUserReview.rating).toFixed(1)}/10
                    </Text>
                  </View>
                </View>

                {/* Comentário estilo citação */}
                <View style={styles.quoteBodyRow}>
                  <Quote size={18} color={colors.primary} style={{ opacity: 0.8, marginRight: 8, marginTop: 2 }} />
                  <Text
                    style={[
                      styles.quoteBodyText,
                      { color: colors.foreground },
                    ]}
                  >
                    {`"${currentUserReview.comment}"`}
                  </Text>
                </View>

                <View style={styles.userReviewFooter}>
                  <Text style={[styles.userReviewDateText, { color: colors.mutedForeground }]}>
                    {currentUserReview.date || 'Recente'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setIsShareModalOpen(true)}
                      style={[
                        styles.shareReviewNoteBtn,
                        { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}35` },
                      ]}
                      activeOpacity={0.75}
                      accessibilityLabel="Compartilhar nota"
                    >
                      <Share2 size={12} color={colors.primary} />
                      <Text style={[styles.shareReviewNoteBtnText, { color: colors.primary }]}>
                        Compartilhar nota
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setRating(Number(currentUserReview.rating) || 8);
                        setReviewText(currentUserReview.comment || '');
                        setIsReviewModalOpen(true);
                      }}
                      style={styles.editReviewLink}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editReviewLinkText, { color: colors.mutedForeground }]}>
                        Editar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.unratedCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.unratedTitle, { color: colors.foreground }]}>
                    Ainda não avaliado
                  </Text>
                  <Text style={[styles.unratedSub, { color: colors.mutedForeground }]}>
                    Dê sua nota e compartilhe suas impressões com os amigos.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsReviewModalOpen(true)}
                  style={[styles.rateNowBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Star size={13} color="#fff" fill="#fff" />
                  <Text style={styles.rateNowBtnText}>Avaliar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Links de Streaming Melhorados */}
        <View style={styles.albumActionsSection}>
          <View
            style={[
              styles.streamingBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.streamingHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Headphones size={15} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  Ouvir no Streaming
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Escolha seu app favorito
              </Text>
            </View>

            <View style={styles.streamingPlatformGrid}>
              {streamingLinks.map((st) => (
                <TouchableOpacity
                  key={st.label}
                  onPress={() => Linking.openURL(st.url).catch(() => {})}
                  style={[
                    styles.streamingPlatformCard,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  accessibilityLabel={st.label}
                  accessibilityRole="button"
                >
                  <View style={[styles.streamingIconWrapper, { backgroundColor: `${st.color}15` }]}>
                    <StreamingIcon name={st.label} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: colors.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {st.label}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: colors.mutedForeground }}>
                      Reproduzir álbum
                    </Text>
                  </View>
                  <ExternalLink size={13} color={colors.mutedForeground} />
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

        {/* Sessão: Indicações e Premiações */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeadingLine}>
            <Trophy size={18} color="#eab308" />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginBottom: 0 },
              ]}
            >
              Indicações e Premiações ({awards.length})
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
            Reconhecimento oficial e cerimônias de premiação da indústria da música.
          </Text>

          {awards.length === 0 ? (
            <View style={styles.emptyAwardsBox}>
              <Award size={26} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: 'center' }}>
                Nenhuma premiação oficial registrada para este álbum até o momento.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {awards.map((aw) => {
                const isWinner = aw.result === 'winner';
                return (
                  <View
                    key={aw.id}
                    style={[
                      styles.awardCardItem,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: isWinner ? 'rgba(234, 179, 8, 0.35)' : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.awardLogoWrapper}>
                      <CoverImage
                        uri={aw.logoUrl}
                        style={styles.awardLogoImage}
                        contentFit="contain"
                        quality="high"
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[styles.awardNameText, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {aw.awardName}
                        </Text>
                        <View
                          style={[
                            styles.awardResultBadge,
                            {
                              backgroundColor: isWinner
                                ? 'rgba(234, 179, 8, 0.2)'
                                : `${colors.mutedForeground}22`,
                              borderColor: isWinner
                                ? 'rgba(234, 179, 8, 0.45)'
                                : 'transparent',
                            },
                          ]}
                        >
                          {isWinner && <Trophy size={10} color="#eab308" />}
                          <Text
                            style={[
                              styles.awardResultBadgeText,
                              { color: isWinner ? '#eab308' : colors.mutedForeground },
                            ]}
                          >
                            {isWinner ? 'Vencedor' : 'Indicado'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.awardCategoryText, { color: colors.primary }]}>
                        {aw.category}
                      </Text>
                      {aw.description ? (
                        <Text
                          style={[styles.awardDescText, { color: colors.mutedForeground }]}
                          numberOfLines={2}
                        >
                          {aw.description}
                        </Text>
                      ) : null}
                      <Text style={{ fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 }}>
                        Ano: {aw.year}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

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
            Principais impressões da comunidade e amigos. Toque no perfil para se conectar.
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
                const authorTag = rev.username || rev.user;
                const authorAvatar = rev.avatar || getFallbackImageUrl(rev.user);
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
                          if (authorTag) {
                            router.push(`/user/${authorTag}` as any);
                          }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                        activeOpacity={0.7}
                      >
                        <CoverImage
                          uri={authorAvatar}
                          style={styles.revUserAvatar}
                          quality="low"
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={{
                                fontSize: 13.5,
                                fontWeight: '800',
                                color: colors.foreground,
                              }}
                              numberOfLines={1}
                            >
                              {rev.user}
                            </Text>
                            {rev.isFriend && (
                              <View
                                style={{
                                  backgroundColor: `${colors.primary}18`,
                                  paddingHorizontal: 6,
                                  paddingVertical: 1.5,
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
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 11.5,
                              color: colors.mutedForeground,
                            }}
                          >
                            @{authorTag}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View
                        style={[
                          styles.revScorePill,
                          { backgroundColor: `${revPhrase.color}22` },
                        ]}
                      >
                        <Star size={11} color={revPhrase.color} fill={revPhrase.color} />
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: '900',
                            color: revPhrase.color,
                          }}
                        >
                          {Number(rev.rating).toFixed(1)}/10
                        </Text>
                      </View>
                    </View>

                    {/* Estrelas */}
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 6 }}>
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
                        fontSize: 12.5,
                        color: colors.foreground,
                        marginTop: 6,
                        lineHeight: 18,
                      }}
                    >
                      {`"${rev.comment}"`}
                    </Text>

                    <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                        {rev.date || 'Recente'}
                      </Text>
                      <Text style={{ fontSize: 11, fontStyle: 'italic', color: revPhrase.color }}>
                        {revPhrase.text}
                      </Text>
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
        statusBarTranslucent
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
          onPress={() => {
            if (currentUserReview) {
              setRating(Number(currentUserReview.rating) || 8);
              setReviewText(currentUserReview.comment || '');
            }
            setIsReviewModalOpen(true);
          }}
          style={styles.floatingBarItem}
          activeOpacity={0.7}
          accessibilityLabel={currentUserReview ? 'Álbum Avaliado' : 'Avaliar Álbum'}
        >
          <View
            style={[
              styles.floatingBarIconWrap,
              Boolean(currentUserReview) && {
                backgroundColor: `${colors.amber}25`,
                borderRadius: 999,
              },
            ]}
          >
            <Star
              size={18}
              color={currentUserReview ? colors.amber : colors.primary}
              fill={currentUserReview ? colors.amber : 'transparent'}
            />
          </View>
          <Text
            style={[
              styles.floatingBarLabel,
              { color: currentUserReview ? colors.amber : colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {currentUserReview ? 'Avaliado' : 'Avaliar'}
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
        statusBarTranslucent
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
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
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

            {/* Destaque da Nota Selecionada */}
            <View style={{ alignItems: 'center', marginVertical: 6 }}>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: rating > 0 ? colors.amber : colors.mutedForeground,
                  letterSpacing: -1,
                }}
              >
                {rating > 0 ? rating.toFixed(1) : '—'}
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.mutedForeground }}>
                  {' '}/ 10
                </Text>
              </Text>
            </View>

            {/* Frase de Feedback de Acordo com a Nota */}
            <View
              style={[
                styles.genZBadge,
                {
                  borderColor: `${currentGenZ.color}50`,
                  backgroundColor: `${currentGenZ.color}15`,
                  alignSelf: 'center',
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

            {/* 10 Estrelas Interativas com Incremento Decimal */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const active = rating >= star;
                const isSelectedBase = Math.floor(rating) === star;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    style={[
                      styles.starBtn,
                      isSelectedBase && {
                        backgroundColor: `${colors.amber}18`,
                        borderRadius: 8,
                      },
                    ]}
                    activeOpacity={0.65}
                    accessibilityLabel={`Nota ${star}`}
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

            {/* Ajuste fino decimal */}
            <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8, gap: 6 }}>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
                Toque na mesma estrela até 9x para ajustar os décimos (ex: 9.1 a 9.9)
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    const next = Math.max(1, Number((rating - 0.1).toFixed(1)));
                    setRating(next);
                  }}
                  style={[
                    styles.decStepBtn,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.foreground }}>
                    -0.1
                  </Text>
                </TouchableOpacity>

                {[0, 2, 5, 8].map((dec) => {
                  const base = Math.max(1, Math.floor(rating) || 8);
                  const candidate = Number((base + dec * 0.1).toFixed(1));
                  const isCurrent = rating === candidate;
                  return (
                    <TouchableOpacity
                      key={dec}
                      onPress={() => setRating(candidate)}
                      style={[
                        styles.decChipBtn,
                        {
                          backgroundColor: isCurrent ? colors.primary : colors.secondary,
                          borderColor: isCurrent ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: isCurrent ? '#fff' : colors.foreground,
                        }}
                      >
                        .{dec}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  onPress={() => {
                    const next = Math.min(10, Number((rating + 0.1).toFixed(1)));
                    setRating(next);
                  }}
                  style={[
                    styles.decStepBtn,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.foreground }}>
                    +0.1
                  </Text>
                </TouchableOpacity>
              </View>
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
        statusBarTranslucent
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
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
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
              {userLists.map((item) => {
                const isDefaultList =
                  item.id === 'want-to-listen' || item.isDefault;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleAddToList(item.id, item.title)}
                    style={[
                      styles.userListItemBtn,
                      {
                        backgroundColor: isDefaultList
                          ? `${colors.primary}12`
                          : colors.secondary,
                        borderColor: isDefaultList
                          ? `${colors.primary}45`
                          : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.userListItemTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {isDefaultList && (
                          <View
                            style={{
                              backgroundColor: `${colors.primary}22`,
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9.5,
                                fontWeight: '900',
                                color: colors.primary,
                              }}
                            >
                              Padrão
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.userListItemSub,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {item.count} {item.count === 1 ? 'álbum' : 'álbuns'} • {item.description}
                      </Text>
                    </View>
                    <Plus
                      size={16}
                      color={
                        isDefaultList
                          ? colors.primary
                          : colors.mutedForeground
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Opções do Álbum (3 pontinhos) */}
      <Modal
        visible={isOptionsMenuOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsOptionsMenuOpen(false)}
      >
        <View style={styles.sheetModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsOptionsMenuOpen(false)}
          />
          <View
            style={[
              styles.sheetModalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
              },
            ]}
          >
            <View style={styles.sheetModalDragIndicator} />

            <View style={styles.sheetModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetModalTitle, { color: colors.foreground }]}>
                  Opções do Álbum
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {album.title} • {artistName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsOptionsMenuOpen(false)}
                style={styles.sheetCloseBtn}
                accessibilityLabel="Fechar"
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              {/* Compartilhar Álbum */}
              <TouchableOpacity
                style={[styles.menuOptionRow, { backgroundColor: colors.secondary }]}
                onPress={handleShareAlbum}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                  <Share2 size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuOptionTitle, { color: colors.foreground }]}>
                    Compartilhar Álbum
                  </Text>
                  <Text style={[styles.menuOptionSubtitle, { color: colors.mutedForeground }]}>
                    Envie para amigos ou outras redes sociais
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Seguir / Deixar de Seguir Artista */}
              <TouchableOpacity
                style={[styles.menuOptionRow, { backgroundColor: colors.secondary }]}
                onPress={handleToggleFollowArtist}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuOptionIconWrap,
                    {
                      backgroundColor: isFollowingArtist
                        ? `${colors.emerald}22`
                        : `${colors.primary}22`,
                    },
                  ]}
                >
                  {isFollowingArtist ? (
                    <UserCheck size={18} color={colors.emerald} />
                  ) : (
                    <UserPlus size={18} color={colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuOptionTitle, { color: colors.foreground }]}>
                    {isFollowingArtist ? `Seguindo ${artistName}` : `Seguir ${artistName}`}
                  </Text>
                  <Text style={[styles.menuOptionSubtitle, { color: colors.mutedForeground }]}>
                    {isFollowingArtist ? 'Você já segue este artista como ídolo' : 'Acompanhe lançamentos e novidades'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Ir para o Artista */}
              {Boolean(artistId) && (
                <TouchableOpacity
                  style={[styles.menuOptionRow, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setIsOptionsMenuOpen(false);
                    router.push(`/artist/${artistId}` as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuOptionIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                    <ExternalLink size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuOptionTitle, { color: colors.foreground }]}>
                      Ir para o Artista
                    </Text>
                    <Text style={[styles.menuOptionSubtitle, { color: colors.mutedForeground }]}>
                      Ver discografia completa de {artistName}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Adicionar a uma Lista */}
              <TouchableOpacity
                style={[styles.menuOptionRow, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  setIsOptionsMenuOpen(false);
                  handleOpenListModal();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                  <ListPlus size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuOptionTitle, { color: colors.foreground }]}>
                    Adicionar a uma Lista
                  </Text>
                  <Text style={[styles.menuOptionSubtitle, { color: colors.mutedForeground }]}>
                    Organize em suas playlists e listas públicas
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Favoritar */}
              <TouchableOpacity
                style={[styles.menuOptionRow, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  handleToggleFavorite();
                  setIsOptionsMenuOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuOptionIconWrap,
                    {
                      backgroundColor: album.isFavorite
                        ? `${colors.rose}22`
                        : `${colors.primary}22`,
                    },
                  ]}
                >
                  <Heart
                    size={18}
                    color={album.isFavorite ? colors.rose : colors.primary}
                    fill={album.isFavorite ? colors.rose : 'transparent'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuOptionTitle, { color: colors.foreground }]}>
                    {album.isFavorite ? 'Remover dos Favoritos' : 'Favoritar Álbum'}
                  </Text>
                  <Text style={[styles.menuOptionSubtitle, { color: colors.mutedForeground }]}>
                    {album.isFavorite ? 'Está salvo no seu perfil' : 'Destaque este álbum na sua coleção'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Compartilhar Nota / Stories do Instagram */}
      <Modal
        visible={isShareModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsShareModalOpen(false)}
      >
        <View style={styles.sheetModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsShareModalOpen(false)}
          />
          <View
            style={[
              styles.sheetModalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
              },
            ]}
          >
            <View style={styles.sheetModalDragIndicator} />

            <View style={styles.sheetModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetModalTitle, { color: colors.foreground }]}>
                  Compartilhar Nota
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {album.title} • {artistName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsShareModalOpen(false)}
                style={styles.sheetCloseBtn}
                accessibilityLabel="Fechar"
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Preview do Card para Compartilhamento */}
            {Boolean(currentUserReview) && (
              <View
                style={[
                  styles.sharePreviewCard,
                  { backgroundColor: colors.secondary, borderColor: `${colors.primary}40` },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CoverImage
                    uri={activeCoverUrl}
                    style={{ width: 56, height: 56, borderRadius: 10 }}
                    quality="medium"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.foreground }} numberOfLines={1}>
                      {album.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
                      {artistName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Star size={13} color={colors.amber} fill={colors.amber} />
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.amber }}>
                        {Number(currentUserReview?.rating).toFixed(1)}/10
                      </Text>
                    </View>
                  </View>
                </View>
                {Boolean(currentUserReview?.comment) && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.foreground,
                      fontStyle: 'italic',
                      opacity: 0.9,
                      marginTop: 8,
                      lineHeight: 16,
                    }}
                    numberOfLines={2}
                  >
                    "{currentUserReview?.comment}"
                  </Text>
                )}
              </View>
            )}

            <View style={{ gap: 10, marginTop: 4 }}>
              {/* Botão Compartilhar nos Stories do Instagram */}
              <TouchableOpacity
                style={styles.instagramStoryBtn}
                onPress={handleShareReviewInstagramStories}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#833ab4', '#fd1d1d', '#fcb045']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.instagramStoryGradient}
                >
                  <SocialIcon name="instagram" size={20} color="#fff" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.instagramStoryTitle}>
                      Compartilhar nos Stories
                    </Text>
                    <Text style={styles.instagramStorySubtitle}>
                      Instagram Stories
                    </Text>
                  </View>
                  <ArrowRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Botão Compartilhar em Outros Aplicativos */}
              <TouchableOpacity
                style={[
                  styles.generalShareBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
                onPress={handleShareReviewGeneral}
                activeOpacity={0.8}
              >
                <Share2 size={18} color={colors.foreground} />
                <Text style={[styles.generalShareBtnText, { color: colors.foreground }]}>
                  Outras opções de compartilhamento
                </Text>
              </TouchableOpacity>
            </View>
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
  albumInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  albumInfoChip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  albumInfoLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  albumInfoValue: {
    fontSize: 12.5,
    fontWeight: '800',
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
  musicpostrScoreSection: {
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
  musicpostrCircle: {
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
  musicpostrScoreText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  musicpostrMetaCol: {
    justifyContent: 'center',
  },
  musicpostrLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  musicpostrSubLabel: {
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
  userReviewQuoteCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  userReviewQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userReviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userReviewAuthorName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  myReviewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  myReviewBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  userReviewHandle: {
    fontSize: 11.5,
  },
  userReviewScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  userReviewScoreText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  quoteBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  quoteBodyText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  userReviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userReviewDateText: {
    fontSize: 11,
  },
  editReviewLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editReviewLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  unratedCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
  },
  unratedTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  unratedSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  rateNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rateNowBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  streamingBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  streamingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streamingPlatformGrid: {
    gap: 8,
  },
  streamingPlatformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  streamingIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAwardsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  awardCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  awardLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  awardLogoImage: {
    width: '100%',
    height: '100%',
  },
  awardNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
  },
  awardResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  awardResultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  awardCategoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  awardDescText: {
    fontSize: 11,
    lineHeight: 15,
  },
  revUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  decStepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  decChipBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    marginBottom: 0,
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
  shareReviewNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  shareReviewNoteBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  menuOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuOptionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sharePreviewCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  instagramStoryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  instagramStoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  instagramStoryTitle: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
  instagramStorySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  generalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  generalShareBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
