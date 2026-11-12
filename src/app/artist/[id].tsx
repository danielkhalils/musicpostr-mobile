import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { safeGoBack } from '@/utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Disc,
  Radio,
  ChevronDown,
  Award,
  Globe,
  Check,
  Info,
  Users,
  X,
  Building2,
  Calendar,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { CoverImage } from '@/components/CoverImage';
import {
  type CatalogAlbum,
  type CatalogArtist,
  getInstantArtistPreview,
  fetchArtistDetailsFromMusicBrainz,
  getFollowedArtistIds,
  toggleFollowArtist,
  subscribeAlbumsUpdated,
  getRelatedArtists,
  getArtistBioAndInfo,
} from '@/services/musicBrainz.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.46);

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const initialPreview = id ? getInstantArtistPreview(id) : null;

  const [artistName, setArtistName] = useState(initialPreview?.name || '');
  const [artistBanner, setArtistBanner] = useState(
    initialPreview?.bannerUrl || ''
  );
  const [artistGenre, setArtistGenre] = useState(
    initialPreview?.genre || 'Artista Oficial'
  );
  const [artistCountry, setArtistCountry] = useState(
    initialPreview?.country || ''
  );
  const [artistFans, setArtistFans] = useState(
    initialPreview?.nbFans || 2150
  );
  const [albums, setAlbums] = useState<CatalogAlbum[]>(
    initialPreview?.albums || []
  );
  const [epsAndSingles, setEpsAndSingles] = useState<CatalogAlbum[]>(
    initialPreview?.epsAndSingles || []
  );
  const [isLoading, setIsLoading] = useState(!initialPreview);
  const [isSyncing, setIsSyncing] = useState(false);

  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    getFollowedArtistIds()
  );

  const [visibleAlbumsCount, setVisibleAlbumsCount] = useState(10);
  const [visibleEpsCount, setVisibleEpsCount] = useState(10);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const relatedArtists: CatalogArtist[] = id
    ? getRelatedArtists(id, artistGenre)
    : [];
  const artistInfo = getArtistBioAndInfo(
    artistName,
    artistGenre,
    artistCountry
  );

  useEffect(() => {
    const unsubscribe = subscribeAlbumsUpdated(() => {
      setFollowedIds(getFollowedArtistIds());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setVisibleAlbumsCount(10);
    setVisibleEpsCount(10);

    const preview = getInstantArtistPreview(id);
    if (preview) {
      setArtistName(preview.name);
      setArtistBanner(preview.bannerUrl);
      setArtistGenre(preview.genre);
      setArtistCountry(preview.country);
      setArtistFans(preview.nbFans);
      setAlbums(preview.albums);
      setEpsAndSingles(preview.epsAndSingles);
      setIsLoading(false);
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    fetchArtistDetailsFromMusicBrainz(id)
      .then((details) => {
        if (!isMounted) return;
        setArtistName(details.name);
        setArtistBanner(details.bannerUrl);
        if (details.genre) setArtistGenre(details.genre);
        if (details.country) setArtistCountry(details.country);
        setAlbums(details.albums);
        setEpsAndSingles(details.epsAndSingles);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleGoBack = () => {
    safeGoBack('/(tabs)/artists');
  };

  const isFollowing = Boolean(id && followedIds.includes(id));

  const handleToggleFollow = () => {
    if (!id) return;
    const next = toggleFollowArtist({
      id,
      name: artistName || 'Artista',
      imageUrl: artistBanner,
      genre: artistGenre,
      country: artistCountry,
      nbFans: artistFans,
    });
    setFollowedIds(next);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            styles.floatingTopBar,
            { top: Math.max(insets.top, 10) },
          ]}
        >
          <TouchableOpacity
            style={styles.backFloatingBtn}
            onPress={handleGoBack}
            activeOpacity={0.85}
          >
            <ArrowLeft size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const displayedAlbums = albums.slice(0, visibleAlbumsCount);
  const displayedEps = epsAndSingles.slice(0, visibleEpsCount);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Botões de topo fixos / flutuantes sobre a capa */}
      <View
        style={[
          styles.floatingTopBar,
          { top: Math.max(insets.top, 10) },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.backFloatingBtn}
          onPress={handleGoBack}
          activeOpacity={0.85}
        >
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>

        {isSyncing && (
          <View style={styles.syncPill}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.syncPillText}>Sincronizando...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.infoFloatingBtn}
          onPress={() => setIsInfoModalOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Informações do Artista"
        >
          <Info size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero estilo YouTube Music com capa cheia e blur na parte inferior */}
        <View
          style={[
            styles.heroContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Capa de fundo preenchendo toda a largura do banner na frente com alta resolução */}
          <CoverImage
            uri={artistBanner}
            style={styles.heroBackgroundImage}
            fallbackType="artist"
            quality="high"
          />

          {/* Gradiente sutil superior para legibilidade dos botões */}
          <LinearGradient
            colors={[
              isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',
              'transparent',
            ]}
            style={styles.topVignette}
            pointerEvents="none"
          />

          {/* Transição suave em gradiente na parte debaixo da capa sem cortes/linhas */}
          <View style={styles.bottomBlurWrapper} pointerEvents="none">
            <LinearGradient
              colors={
                isDark
                  ? [
                      'transparent',
                      'rgba(9, 9, 11, 0.15)',
                      'rgba(9, 9, 11, 0.45)',
                      'rgba(9, 9, 11, 0.82)',
                      colors.background,
                    ]
                  : [
                      'transparent',
                      'rgba(255, 255, 255, 0.08)',
                      'rgba(255, 255, 255, 0.38)',
                      'rgba(255, 255, 255, 0.78)',
                      colors.background,
                    ]
              }
              locations={
                isDark
                  ? [0, 0.25, 0.55, 0.82, 1]
                  : [0, 0.25, 0.55, 0.82, 1]
              }
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Título e Badges do Artista integrados na parte inferior da capa */}
          <View style={styles.heroArtistDetails}>
            <View style={styles.artistTitleRow}>
              <Text
                style={[
                  styles.artistHeroTitle,
                  {
                    color: isDark ? '#ffffff' : colors.foreground,
                    textShadowColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
                  },
                ]}
                numberOfLines={2}
              >
                {artistName || 'Detalhes do Artista'}
              </Text>
              <View
                style={styles.verifiedCheckBadge}
                accessibilityLabel="Artista Verificado Oficial"
              >
                <Check size={11} color="#ffffff" strokeWidth={3.5} />
              </View>
            </View>

            <View style={styles.artistMetaRow}>

              {/* Estilo Musical */}
              <View
                style={[
                  styles.genreBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(139, 92, 246, 0.28)'
                      : 'rgba(139, 92, 246, 0.15)',
                    borderColor: isDark
                      ? 'rgba(139, 92, 246, 0.55)'
                      : 'rgba(139, 92, 246, 0.35)',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: isDark ? '#c4b5fd' : '#7c3aed',
                  }}
                >
                  {artistGenre}
                </Text>
              </View>

              {/* Botão de Seguir / Seguindo na mesma linha */}
              <TouchableOpacity
                onPress={handleToggleFollow}
                style={[
                  styles.heroFollowBtn,
                  isFollowing
                    ? {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      }
                    : {
                        backgroundColor: isDark
                          ? 'rgba(0, 0, 0, 0.55)'
                          : 'rgba(0, 0, 0, 0.06)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.35)'
                          : 'rgba(0, 0, 0, 0.12)',
                      },
                ]}
                activeOpacity={0.85}
              >
                {isFollowing ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : (
                  <Award
                    size={12}
                    color={isDark ? '#fff' : colors.foreground}
                  />
                )}
                <Text
                  style={[
                    styles.heroFollowBtnText,
                    !isFollowing && !isDark && { color: colors.foreground },
                  ]}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </Text>
              </TouchableOpacity>

              {Boolean(artistCountry) && (
                <View
                  style={[
                    styles.countryBadge,
                    !isDark && {
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                    },
                  ]}
                >
                  <Globe
                    size={11}
                    color={isDark ? 'rgba(255, 255, 255, 0.85)' : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isDark ? 'rgba(255, 255, 255, 0.9)' : colors.foreground,
                    }}
                  >
                    {artistCountry}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Corpo de Ações e Informações */}
        <View style={styles.bodyContent}>
          {/* Métricas Rápidas da Discografia */}
          <View
            style={[
              styles.statsStrip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: colors.foreground }]}
              >
                {albums.length}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Álbuns
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: colors.foreground }]}
              >
                {epsAndSingles.length}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                EPs & Singles
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: colors.foreground }]}
              >
                {artistFans.toLocaleString('pt-BR')}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                Fãs na Comunidade
              </Text>
            </View>
          </View>

          {/* Seção de Álbuns */}
          {albums.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Disc size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Álbuns de Estúdio ({albums.length})
                </Text>
              </View>

              <View style={styles.grid}>
                {displayedAlbums.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={[
                      styles.releaseCard,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => router.push(`/album/${album.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={album.cover_small || album.cover_medium || album.cover_big}
                      style={styles.releaseCover}
                      quality="low"
                    />
                    <Text
                      style={[
                        styles.releaseTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {album.title}
                    </Text>
                    <View style={styles.releaseFooter}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                        }}
                      >
                        {album.release_date?.substring(0, 4) || '—'}
                      </Text>
                      <View
                        style={[
                          styles.tagPill,
                          { backgroundColor: colors.secondary },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 9.5,
                            fontWeight: '700',
                            color: colors.mutedForeground,
                          }}
                        >
                          Álbum
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {visibleAlbumsCount < albums.length && (
                <TouchableOpacity
                  onPress={() => setVisibleAlbumsCount((prev) => prev + 10)}
                  style={[
                    styles.loadMoreBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Ver mais álbuns
                  </Text>
                  <ChevronDown size={16} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Seção de EPs e Singles */}
          {epsAndSingles.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Radio size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  EPs e Singles ({epsAndSingles.length})
                </Text>
              </View>

              <View style={styles.grid}>
                {displayedEps.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.releaseCard,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => router.push(`/album/${item.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <CoverImage
                      uri={item.cover_small || item.cover_medium || item.cover_big}
                      style={styles.releaseCover}
                      quality="low"
                    />
                    <Text
                      style={[
                        styles.releaseTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.releaseFooter}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                        }}
                      >
                        {item.release_date?.substring(0, 4) || '—'}
                      </Text>
                      <View
                        style={[
                          styles.tagPill,
                          { backgroundColor: colors.secondary },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 9.5,
                            fontWeight: '700',
                            color: colors.mutedForeground,
                          }}
                        >
                          {item.record_type?.toUpperCase() || 'SINGLE'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {visibleEpsCount < epsAndSingles.length && (
                <TouchableOpacity
                  onPress={() => setVisibleEpsCount((prev) => prev + 10)}
                  style={[
                    styles.loadMoreBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.foreground,
                    }}
                  >
                    Ver mais EPs e Singles
                  </Text>
                  <ChevronDown size={16} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Seção de Artistas Relacionados */}
          {relatedArtists.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Users size={20} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Artistas Relacionados
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScrollRow}
              >
                {relatedArtists.map((relArtist) => (
                  <TouchableOpacity
                    key={relArtist.id}
                    style={[
                      styles.relatedArtistCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      router.push(`/artist/${relArtist.id}` as any)
                    }
                    activeOpacity={0.8}
                  >
                    <CoverImage
                      uri={relArtist.imageUrl}
                      style={styles.relatedArtistAvatar}
                      fallbackType="artist"
                      quality="medium"
                    />
                    <Text
                      style={[
                        styles.relatedArtistName,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {relArtist.name}
                    </Text>
                    <Text
                      style={[
                        styles.relatedArtistGenre,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {relArtist.genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Informações Detalhadas do Artista */}
      <Modal
        visible={isInfoModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsInfoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsInfoModalOpen(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <View style={styles.modalDragIndicator} />

            <View style={styles.modalHeader}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                }}
              >
                <CoverImage
                  uri={artistBanner}
                  style={styles.modalArtistThumb}
                  fallbackType="artist"
                  quality="low"
                />
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
                        styles.modalArtistName,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {artistName}
                    </Text>
                    <View style={styles.verifiedCheckBadge}>
                      <Check size={9} color="#fff" strokeWidth={3.5} />
                    </View>
                  </View>
                  <Text
                    style={{ fontSize: 11, color: colors.mutedForeground }}
                  >
                    Perfil Verificado • {artistGenre}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsInfoModalOpen(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <X size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Ficha Técnica Rápida */}
            <View style={styles.quickFactsGrid}>
              <View
                style={[
                  styles.factCard,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Building2 size={15} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.factLabel}>Gravadora Oficial</Text>
                  <Text
                    style={[
                      styles.factValue,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {artistInfo.label}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.factCard,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Globe size={15} color="#38bdf8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.factLabel}>País / Origem</Text>
                  <Text
                    style={[
                      styles.factValue,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {artistCountry || 'Internacional'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.factCard,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Calendar size={15} color="#a855f7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.factLabel}>Período de Atividade</Text>
                  <Text
                    style={[
                      styles.factValue,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    Carreira Ativa
                  </Text>
                </View>
              </View>
            </View>

            {/* Descrição / Biografia */}
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: colors.foreground,
                }}
              >
                Biografia e Trajetória
              </Text>
              <ScrollView
                style={{ maxHeight: 150 }}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.modalBioText,
                    { color: colors.foreground },
                  ]}
                >
                  {artistInfo.bio}
                </Text>
              </ScrollView>
            </View>

            {/* Rodapé com Fonte */}
            <View
              style={[
                styles.modalFooterSource,
                { borderTopColor: colors.border },
              ]}
            >
              <Text
                style={{
                  fontSize: 10.5,
                  color: colors.mutedForeground,
                  fontStyle: 'italic',
                }}
              >
                Informações catalogadas via Wikipedia & MusicBrainz API
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backFloatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  topRightBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 92, 246, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  syncPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
  },
  bottomBlurWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    overflow: 'hidden',
    zIndex: 6,
  },
  heroArtistDetails: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 10,
    gap: 8,
  },
  artistHeroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  artistMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 92, 246, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroFollowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroFollowBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  followArtistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 26,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  releaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
    gap: 6,
    justifyContent: 'space-between',
  },
  releaseCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  releaseTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  releaseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  infoFloatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  artistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  verifiedCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  relatedScrollRow: {
    paddingVertical: 6,
    gap: 12,
  },
  relatedArtistCard: {
    width: 120,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  relatedArtistAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  relatedArtistName: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  relatedArtistGenre: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
    gap: 14,
  },
  modalDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalArtistThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modalArtistName: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFactsGrid: {
    gap: 8,
  },
  factCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'gray',
    textTransform: 'uppercase',
  },
  factValue: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 1,
  },
  modalBioText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },
  modalFooterSource: {
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});
