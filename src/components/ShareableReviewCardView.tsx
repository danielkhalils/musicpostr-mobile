import React, { ComponentRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  ArrowRight,
  Download,
  Heart,
  Quote,
  Share2,
  Smartphone,
  Sparkles,
  Square,
  Star,
  UserCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { CoverImage } from './CoverImage';
import { SocialIcon } from './SocialIcon';
import { formatRating } from '../utils/rating';

const MUSICPOSTR_LOGO = require('../../assets/icon_transparent_96x96.png');

export interface ShareableReviewCardProps {
  albumTitle: string;
  artistName: string;
  albumCover?: string;
  rating: number;
  comment?: string;
  username: string;
  userName?: string;
  userAvatar?: string;
  activityType?: 'review' | 'favorite' | 'follow_idol' | 'superfan' | 'list';
}

type ExportAction = 'stories' | 'save' | 'other' | null;
type ShareCardFormat = 'story' | 'post';

interface CardBackgroundTheme {
  id: string;
  label: string;
  isBlur?: boolean;
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  divider: string;
  quoteColor: string;
  starEmptyColor: string;
}

const CARD_THEMES: CardBackgroundTheme[] = [
  {
    id: 'obsidian',
    label: 'Grafite',
    bg: '#111118',
    surface: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.68)',
    divider: 'rgba(255, 255, 255, 0.12)',
    quoteColor: '#c084fc',
    starEmptyColor: 'rgba(255, 255, 255, 0.28)',
  },
  {
    id: 'blur',
    label: 'Blur',
    isBlur: true,
    bg: '#0c0c12',
    surface: 'rgba(12, 12, 18, 0.56)',
    border: 'rgba(255, 255, 255, 0.18)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.78)',
    divider: 'rgba(255, 255, 255, 0.16)',
    quoteColor: '#c084fc',
    starEmptyColor: 'rgba(255, 255, 255, 0.34)',
  },
  {
    id: 'purple',
    label: 'Roxo',
    bg: '#4c1d95',
    surface: 'rgba(15, 10, 32, 0.36)',
    border: 'rgba(255, 255, 255, 0.18)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.76)',
    divider: 'rgba(255, 255, 255, 0.16)',
    quoteColor: '#e9d5ff',
    starEmptyColor: 'rgba(255, 255, 255, 0.30)',
  },
  {
    id: 'navy',
    label: 'Azul',
    bg: '#172554',
    surface: 'rgba(9, 14, 34, 0.40)',
    border: 'rgba(255, 255, 255, 0.16)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.74)',
    divider: 'rgba(255, 255, 255, 0.15)',
    quoteColor: '#93c5fd',
    starEmptyColor: 'rgba(255, 255, 255, 0.30)',
  },
  {
    id: 'emerald',
    label: 'Verde',
    bg: '#064e3b',
    surface: 'rgba(4, 28, 22, 0.40)',
    border: 'rgba(255, 255, 255, 0.16)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.74)',
    divider: 'rgba(255, 255, 255, 0.15)',
    quoteColor: '#6ee7b7',
    starEmptyColor: 'rgba(255, 255, 255, 0.30)',
  },
  {
    id: 'crimson',
    label: 'Vinho',
    bg: '#6b1427',
    surface: 'rgba(32, 6, 12, 0.40)',
    border: 'rgba(255, 255, 255, 0.16)',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.74)',
    divider: 'rgba(255, 255, 255, 0.15)',
    quoteColor: '#fda4af',
    starEmptyColor: 'rgba(255, 255, 255, 0.30)',
  },
  {
    id: 'paper',
    label: 'Claro',
    bg: '#f4f4f5',
    surface: '#ffffff',
    border: 'rgba(24, 24, 27, 0.11)',
    text: '#18181b',
    muted: '#52525b',
    divider: 'rgba(24, 24, 27, 0.11)',
    quoteColor: '#7c3aed',
    starEmptyColor: 'rgba(24, 24, 27, 0.22)',
  },
];

function getScoreColor(rating: number) {
  if (rating >= 8.5) return '#10b981';
  if (rating >= 7.0) return '#84cc16';
  if (rating >= 5.0) return '#eab308';
  if (rating >= 3.0) return '#f97316';
  return '#ef4444';
}

function RatingStarsRow({
  rating,
  color,
  emptyColor,
  size = 9.5,
}: {
  rating: number;
  color: string;
  emptyColor: string;
  size?: number;
}) {
  const starScale = Math.max(0, Math.min(5, rating / 2));

  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fillAmount = Math.max(0, Math.min(1, starScale - index));
        if (fillAmount >= 0.75) {
          return <Star key={index} size={size} color={color} fill={color} />;
        }
        if (fillAmount >= 0.25) {
          return (
            <View key={index} style={{ width: size, height: size, position: 'relative' }}>
              <Star size={size} color={emptyColor} fill="transparent" />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: size / 2,
                  height: size,
                  overflow: 'hidden',
                }}
              >
                <Star size={size} color={color} fill={color} />
              </View>
            </View>
          );
        }
        return <Star key={index} size={size} color={emptyColor} fill="transparent" />;
      })}
    </View>
  );
}

export function ShareableReviewCard({
  albumTitle,
  artistName,
  albumCover,
  rating,
  comment,
  username,
  userName,
  userAvatar,
  activityType = 'review',
}: ShareableReviewCardProps) {
  const { colors } = useAppTheme();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [exportingAction, setExportingAction] = useState<ExportAction>(null);
  const [format, setFormat] = useState<ShareCardFormat>('story');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('obsidian');

  const cardTheme =
    CARD_THEMES.find((t) => t.id === selectedThemeId) || CARD_THEMES[0];

  const formattedRating = formatRating(rating);
  const isReview = activityType === 'review' && rating > 0;
  const isFavorite = activityType === 'favorite';
  const isSuperfan = activityType === 'superfan';
  const isIdol = activityType === 'follow_idol' || isSuperfan;
  const scoreColor = getScoreColor(rating);
  const isStory = format === 'story';
  const cleanComment = comment?.trim() || '';
  const displayAuthorName = userName?.trim() || username;

  const handleExportCard = async (action: Exclude<ExportAction, null>) => {
    if (!cardRef.current || exportingAction) return;
    setExportingAction(action);

    try {
      const uri = await captureRef(cardRef as any, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        const dialogTitle =
          action === 'save'
            ? 'Salvar imagem do Musicpostr'
            : action === 'stories'
              ? 'Compartilhar nos Stories'
              : 'Compartilhar card do Musicpostr';

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle,
        });
      } else {
        await Share.share({
          message: isReview
            ? `Avaliei "${albumTitle}" (${artistName}) com nota ${formattedRating}/10 no Musicpostr!`
            : `Confira "${albumTitle}" no Musicpostr!`,
        });
      }
    } catch (err) {
      console.warn('[ShareableReviewCard] Erro ao gerar/compartilhar imagem:', err);
      Alert.alert(
        'Não foi possível gerar a imagem',
        'Tente novamente em instantes.'
      );
    } finally {
      setExportingAction(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Seletor de Formato: Story (9:16) vs Publicação (4:5) */}
      <View
        style={[
          styles.formatSwitchRow,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setFormat('story')}
          activeOpacity={0.85}
          style={[
            styles.formatSwitchBtn,
            isStory && { backgroundColor: colors.primary },
          ]}
        >
          <Smartphone size={14} color={isStory ? '#ffffff' : colors.mutedForeground} />
          <Text
            style={[
              styles.formatSwitchText,
              { color: isStory ? '#ffffff' : colors.mutedForeground },
            ]}
          >
            Story (9:16)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFormat('post')}
          activeOpacity={0.85}
          style={[
            styles.formatSwitchBtn,
            !isStory && { backgroundColor: colors.primary },
          ]}
        >
          <Square size={13} color={!isStory ? '#ffffff' : colors.mutedForeground} />
          <Text
            style={[
              styles.formatSwitchText,
              { color: !isStory ? '#ffffff' : colors.mutedForeground },
            ]}
          >
            Publicação (4:5)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Seletor de Fundo: Cores Estáticas + Blur */}
      <View style={styles.colorSwatchesRow}>
        {CARD_THEMES.map((themeItem) => {
          const isSelected = themeItem.id === cardTheme.id;
          return (
            <TouchableOpacity
              key={themeItem.id}
              onPress={() => setSelectedThemeId(themeItem.id)}
              activeOpacity={0.85}
              accessibilityLabel={`Fundo ${themeItem.label}`}
              style={[
                styles.colorSwatchRing,
                {
                  borderColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
            >
              {themeItem.isBlur ? (
                <View style={styles.blurSwatchDot}>
                  {Boolean(albumCover) && (
                    <Image
                      source={{ uri: albumCover }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      blurRadius={12}
                    />
                  )}
                  <View style={styles.blurSwatchOverlay}>
                    <Sparkles size={11} color="#ffffff" />
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.colorSwatchDot,
                    {
                      backgroundColor: themeItem.bg,
                      borderColor:
                        themeItem.id === 'paper'
                          ? 'rgba(0,0,0,0.22)'
                          : 'rgba(255,255,255,0.25)',
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wrapper de preview com recorte visual arredondado (fora da captura PNG) */}
      <View style={styles.previewFrame}>
        {/* Área capturada em PNG: cor estática ou blur completo */}
        <View
          ref={cardRef}
          collapsable={false}
          renderToHardwareTextureAndroid
          style={[
            styles.captureCanvas,
            isStory ? styles.captureCanvasStory : styles.captureCanvasPost,
            { backgroundColor: cardTheme.bg },
          ]}
        >
          {/* Fundo Blur (quando selecionado) */}
          {cardTheme.isBlur && Boolean(albumCover) && (
            <>
              <Image
                source={{ uri: albumCover }}
                style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.3 }] }]}
                contentFit="cover"
                blurRadius={45}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(8, 8, 14, 0.48)' },
                ]}
              />
            </>
          )}

          <View
            style={[
              styles.canvasInner,
              isStory ? styles.canvasInnerStory : styles.canvasInnerPost,
            ]}
          >
            {/* 1. Topo: Selo de destaque do app (sempre legível em qualquer fundo) */}
            <View style={styles.topBrandWrap}>
              <View style={styles.topBrandPill}>
                <Image
                  source={MUSICPOSTR_LOGO}
                  style={styles.watermarkLogo}
                  contentFit="contain"
                />
                <Text style={styles.brand}>MUSICPOSTR</Text>
              </View>
            </View>

            {/* 2. Centro: Capa + Título + Artista + Estrelas/Nota + Card de Avaliação */}
            <View style={[styles.centerSection, !isStory && styles.centerSectionPost]}>
              {/* Bloco do Álbum/Artista centralizado */}
              <View style={styles.albumCenterBlock}>
                <View
                  style={[
                    styles.coverWrap,
                    isStory ? styles.coverStoryWrap : styles.coverPostWrap,
                    isIdol && styles.coverIdolWrap,
                    { borderColor: cardTheme.border },
                  ]}
                >
                  <CoverImage
                    uri={albumCover}
                    artistName={isIdol ? albumTitle : undefined}
                    albumTitle={!isIdol ? albumTitle : undefined}
                    albumArtist={!isIdol ? artistName : undefined}
                    style={styles.coverFull}
                    fallbackType={isIdol ? 'artist' : 'album'}
                    quality="high"
                  />
                </View>

                <Text
                  style={[styles.title, { color: cardTheme.text }]}
                  numberOfLines={2}
                >
                  {albumTitle}
                </Text>

                {!isIdol && (
                  <Text
                    style={[styles.artist, { color: cardTheme.muted }]}
                    numberOfLines={1}
                  >
                    {artistName}
                  </Text>
                )}

                {/* Nota com estrelas + formato X/10 ao lado */}
                {isReview ? (
                  <View
                    style={[
                      styles.ratingBarPill,
                      {
                        backgroundColor: cardTheme.surface,
                        borderColor: cardTheme.border,
                      },
                    ]}
                  >
                    <RatingStarsRow
                      rating={rating}
                      color={scoreColor}
                      emptyColor={cardTheme.starEmptyColor}
                      size={9.5}
                    />
                    <Text style={[styles.ratingScoreText, { color: cardTheme.text }]}>
                      {formattedRating}
                      <Text style={{ color: cardTheme.muted, fontWeight: '600' }}>/10</Text>
                    </Text>
                  </View>
                ) : isFavorite ? (
                  <View
                    style={[
                      styles.activityTagPill,
                      {
                        backgroundColor: 'rgba(244, 63, 94, 0.16)',
                        borderColor: 'rgba(244, 63, 94, 0.45)',
                      },
                    ]}
                  >
                    <Heart size={8.5} color="#f43f5e" fill="#f43f5e" />
                    <Text style={[styles.activityTagText, { color: '#f43f5e' }]}>
                      Álbum Favoritado
                    </Text>
                  </View>
                ) : isSuperfan ? (
                  <View
                    style={[
                      styles.activityTagPill,
                      {
                        backgroundColor: 'rgba(245, 158, 11, 0.20)',
                        borderColor: 'rgba(245, 158, 11, 0.55)',
                      },
                    ]}
                  >
                    <Star size={8.5} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.activityTagText, { color: '#fbbf24' }]}>
                      Superfã
                    </Text>
                  </View>
                ) : isIdol ? (
                  <View
                    style={[
                      styles.activityTagPill,
                      {
                        backgroundColor: 'rgba(168, 85, 247, 0.18)',
                        borderColor: 'rgba(168, 85, 247, 0.45)',
                      },
                    ]}
                  >
                    <UserCheck size={8.5} color="#c084fc" />
                    <Text style={[styles.activityTagText, { color: '#c084fc' }]}>
                      Artista Seguido
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Card de Comentário do Usuário (padrão da avaliação na tela do álbum) */}
              {Boolean(cleanComment) && (
                <View
                  style={[
                    styles.userQuoteCard,
                    {
                      backgroundColor: cardTheme.surface,
                      borderColor: cardTheme.border,
                    },
                  ]}
                >
                  <View style={styles.userQuoteHeader}>
                    <CoverImage
                      uri={userAvatar}
                      style={styles.userQuoteAvatar}
                      fallbackType="artist"
                      quality="low"
                    />
                    <View style={styles.userQuoteIdentity}>
                      <Text
                        style={[styles.userQuoteName, { color: cardTheme.text }]}
                        numberOfLines={1}
                      >
                        {displayAuthorName}
                      </Text>
                      <Text
                        style={[styles.userQuoteHandle, { color: cardTheme.muted }]}
                        numberOfLines={1}
                      >
                        @{username}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quoteBodyRow}>
                    <Quote
                      size={11}
                      color={cardTheme.quoteColor}
                      style={styles.quoteIcon}
                    />
                    <Text
                      style={[styles.quoteBodyText, { color: cardTheme.text }]}
                      numberOfLines={isStory ? 4 : 3}
                    >
                      {cleanComment}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 3. Rodapé: @usuário e domínio alinhados */}
            <View
              style={[
                styles.footerRow,
                { borderTopColor: cardTheme.divider },
              ]}
            >
              <Text
                style={[styles.author, { color: cardTheme.text }]}
                numberOfLines={1}
              >
                @{username}
              </Text>
              <Text style={[styles.footerTag, { color: cardTheme.muted }]}>
                musicpostr.app
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Botões no padrão do modal de compartilhamento do álbum */}
      <View style={{ gap: 10 }}>
        {/* 1. Compartilhar nos Stories (gradiente colorido Instagram) */}
        <TouchableOpacity
          style={[
            styles.instagramStoryBtn,
            { opacity: exportingAction && exportingAction !== 'stories' ? 0.65 : 1 },
          ]}
          onPress={() => handleExportCard('stories')}
          disabled={Boolean(exportingAction)}
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
                {exportingAction === 'stories'
                  ? 'Gerando card...'
                  : 'Compartilhar nos Stories'}
              </Text>
              <Text style={styles.instagramStorySubtitle}>
                Instagram Stories ({isStory ? '9:16' : '4:5'})
              </Text>
            </View>
            {exportingAction === 'stories' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ArrowRight size={16} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 2. Salvar como imagem */}
        <TouchableOpacity
          style={[
            styles.secondaryShareBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: exportingAction && exportingAction !== 'save' ? 0.65 : 1,
            },
          ]}
          onPress={() => handleExportCard('save')}
          disabled={Boolean(exportingAction)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.secondaryShareIconBox,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Download size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.secondaryShareTitle, { color: colors.foreground }]}>
              {exportingAction === 'save'
                ? 'Gerando imagem...'
                : 'Salvar como imagem'}
            </Text>
            <Text style={[styles.secondaryShareSubtitle, { color: colors.mutedForeground }]}>
              Baixar PNG sem bordas ({isStory ? 'Story 9:16' : 'Publicação 4:5'})
            </Text>
          </View>
          {exportingAction === 'save' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ArrowRight size={16} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>

        {/* 3. Compartilhar em outros aplicativos */}
        <TouchableOpacity
          style={[
            styles.secondaryShareBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: exportingAction && exportingAction !== 'other' ? 0.65 : 1,
            },
          ]}
          onPress={() => handleExportCard('other')}
          disabled={Boolean(exportingAction)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.secondaryShareIconBox,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Share2 size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.secondaryShareTitle, { color: colors.foreground }]}>
              {exportingAction === 'other'
                ? 'Gerando card...'
                : 'Outros Aplicativos'}
            </Text>
            <Text style={[styles.secondaryShareSubtitle, { color: colors.mutedForeground }]}>
              WhatsApp, X, Telegram e mais
            </Text>
          </View>
          {exportingAction === 'other' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ArrowRight size={16} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formatSwitchRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  formatSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  formatSwitchText: {
    fontSize: 12,
    fontWeight: '800',
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  colorSwatchRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
  },
  colorSwatchDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
  },
  blurSwatchDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurSwatchOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 10, 18, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFrame: {
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  captureCanvas: {
    overflow: 'hidden',
  },
  captureCanvasStory: {
    width: 224,
    aspectRatio: 9 / 16,
  },
  captureCanvasPost: {
    width: 256,
    aspectRatio: 4 / 5,
  },
  canvasInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  canvasInnerStory: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  canvasInnerPost: {
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  topBrandWrap: {
    alignItems: 'center',
  },
  topBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#09090d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  watermarkLogo: {
    width: 11,
    height: 11,
  },
  brand: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  centerSectionPost: {
    gap: 8,
  },
  albumCenterBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 3.5,
  },
  coverWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  coverStoryWrap: {
    width: 106,
    height: 106,
  },
  coverPostWrap: {
    width: 88,
    height: 88,
  },
  coverIdolWrap: {
    borderRadius: 999,
  },
  coverFull: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  artist: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
    textAlign: 'center',
  },
  ratingBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
  },
  ratingScoreText: {
    fontSize: 9,
    fontWeight: '900',
  },
  activityTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  activityTagText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  userQuoteCard: {
    width: '100%',
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 6,
  },
  userQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userQuoteAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  userQuoteIdentity: {
    flex: 1,
    gap: 0.5,
  },
  userQuoteName: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  userQuoteHandle: {
    fontSize: 7.5,
    fontWeight: '600',
    lineHeight: 9.5,
  },
  quoteBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  quoteIcon: {
    opacity: 0.85,
    marginTop: 1,
  },
  quoteBodyText: {
    flex: 1,
    fontSize: 8.5,
    fontStyle: 'italic',
    lineHeight: 12,
    opacity: 0.94,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  author: {
    fontSize: 8.5,
    fontWeight: '700',
    flex: 1,
  },
  footerTag: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  instagramStoryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  instagramStoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  instagramStoryTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  instagramStorySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  secondaryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryShareIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryShareTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  secondaryShareSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
});
