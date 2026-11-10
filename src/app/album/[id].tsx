import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Star,
  Music,
  Clock,
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Maximize2,
  Headphones,
  Heart,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { CoverImage } from '@/components/CoverImage';
import {
  findAlbumCoverArt,
  type CoverArtResult,
} from '@/services/coverArt.service';
import {
  type CatalogAlbum,
  type AlbumUserReview,
  getInstantAlbumPreview,
  fetchAlbumDetailsFromMusicBrainz,
  submitInternalAlbumReview,
  toggleAlbumListened,
  toggleFavoriteAlbum,
} from '@/services/musicBrainz.service';

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
  const { colors } = useAppTheme();

  const [album, setAlbum] = useState<CatalogAlbum | null>(() =>
    id ? getInstantAlbumPreview(id) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    id ? !getInstantAlbumPreview(id) : true
  );
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const [postSuccess, setPostSuccess] = useState<boolean>(false);

  const [isCoverViewerOpen, setIsCoverViewerOpen] = useState<boolean>(false);
  const [coverSide, setCoverSide] = useState<'front' | 'back'>('front');
  const [coverArt, setCoverArt] = useState<CoverArtResult | null>(null);
  const [isLoadingCoverArt, setIsLoadingCoverArt] = useState<boolean>(false);

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
    setTimeout(() => setPostSuccess(false), 2800);
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
            onPress={() => router.back()}
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

  const displayedReviews = showAllReviews
    ? submittedReviews
    : submittedReviews.slice(0, 3);

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
      <MobileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Botão Voltar */}
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else if (artistId) {
              router.replace(`/artist/${artistId}` as any);
            } else {
              router.replace('/(tabs)/artists' as any);
            }
          }}
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

        {/* Hero Card do Álbum */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              onPress={handleOpenCoverModal}
              style={styles.coverContainer}
              activeOpacity={0.85}
            >
              <CoverImage uri={coverImage} style={styles.coverImg} />
              <View style={styles.hdOverlay}>
                <Maximize2 size={11} color="#fff" />
                <Text style={styles.hdOverlayText}>Ver em HD</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.albumTitle, { color: colors.foreground }]}>
                {album.title}
              </Text>
              <TouchableOpacity
                disabled={!artistId}
                onPress={() =>
                  artistId && router.push(`/artist/${artistId}` as any)
                }
              >
                <Text style={[styles.artistName, { color: colors.primary }]}>
                  {artistName}
                </Text>
              </TouchableOpacity>

              <Text
                style={[styles.metaLine, { color: colors.mutedForeground }]}
              >
                {album.release_date?.substring(0, 4) || '2025'} •{' '}
                {recordTypeLabel}
              </Text>
              <Text
                style={[styles.metaLine, { color: colors.mutedForeground }]}
              >
                {album.listenersCount.toLocaleString('pt-BR')} ouvintes •{' '}
                {album.totalReviews} avaliações
              </Text>

              {/* Nota da Comunidade */}
              <View
                style={[
                  styles.scoreBox,
                  {
                    backgroundColor: `${colors.primary}18`,
                    borderColor: `${colors.primary}45`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: colors.mutedForeground,
                  }}
                >
                  Nota da Comunidade
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: colors.primary,
                  }}
                >
                  ★ {averageRating}
                </Text>
              </View>
            </View>
          </View>

          {/* Ações Rápidas (Ouvido / Favorito) */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={handleToggleListened}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: album.listenedByMe
                    ? colors.primary
                    : colors.secondary,
                  borderColor: album.listenedByMe
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              <Headphones
                size={14}
                color={album.listenedByMe ? '#fff' : colors.foreground}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: album.listenedByMe ? '#fff' : colors.foreground,
                }}
              >
                {album.listenedByMe ? 'Já ouvi ✓' : 'Marcar como ouvido'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: album.isFavorite
                    ? `${colors.rose}18`
                    : colors.secondary,
                  borderColor: album.isFavorite
                    ? `${colors.rose}60`
                    : colors.border,
                },
              ]}
            >
              <Heart
                size={14}
                color={album.isFavorite ? colors.rose : colors.foreground}
                fill={album.isFavorite ? colors.rose : 'transparent'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: album.isFavorite ? colors.rose : colors.foreground,
                }}
              >
                {album.isFavorite ? 'Favoritado' : 'Favoritar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Links de Streaming */}
          <View
            style={[
              styles.streamingSection,
              { borderTopColor: colors.border },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Ouvir no Streaming:
            </Text>
            <View style={styles.streamingBtnsWrap}>
              {streamingLinks.map((st) => (
                <TouchableOpacity
                  key={st.label}
                  onPress={() => Linking.openURL(st.url).catch(() => {})}
                  style={[
                    styles.streamingPill,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.streamingDot,
                      { backgroundColor: st.color },
                    ]}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Card de Avaliação (Rate This Album) */}
        <View
          style={[
            styles.rateCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.rateHeaderRow}>
            <Text style={[styles.rateTitle, { color: colors.foreground }]}>
              Avaliar este Álbum
            </Text>
            <View
              style={[
                styles.rateScoreBadge,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '900',
                  color: rating > 0 ? colors.primary : colors.mutedForeground,
                }}
              >
                {rating > 0 ? `${rating}/10` : '—/10'}
              </Text>
            </View>
          </View>

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
                ✓ Sua avaliação foi publicada na comunidade e na Timeline!
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
            style={[
              styles.submitReviewBtn,
              { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.submitReviewBtnText}>Publicar Avaliação</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Faixas (Tracklist) */}
        {album.tracks &&
        album.tracks.data &&
        album.tracks.data.length > 0 ? (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionTitleRow}>
              <Clock size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Músicas do Álbum ({album.tracks.data.length})
              </Text>
            </View>

            <View style={{ marginTop: 8 }}>
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
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Carregando lista de faixas...
            </Text>
          </View>
        ) : null}

        {/* Community Feed do Álbum */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.foreground, marginBottom: 12 },
            ]}
          >
            Avaliações da Comunidade ({submittedReviews.length})
          </Text>

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

          {submittedReviews.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllReviews(!showAllReviews)}
              style={[
                styles.moreReviewsBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              {showAllReviews ? (
                <>
                  <ChevronUp size={15} color={colors.foreground} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Ver menos notas
                  </Text>
                </>
              ) : (
                <>
                  <ChevronDown size={15} color={colors.foreground} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Ver mais notas ({submittedReviews.length - 3} a mais)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 14,
  },
  coverContainer: {
    width: 122,
    height: 122,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  hdOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hdOverlayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  albumTitle: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaLine: {
    fontSize: 11,
  },
  scoreBox: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
  },
  streamingSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  streamingBtnsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  streamingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  rateCard: {
    borderRadius: 20,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
