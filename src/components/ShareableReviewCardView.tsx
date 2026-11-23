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
import { ArrowRight, Download, Share2, Smartphone, Square } from 'lucide-react-native';
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
  activityType?: 'review' | 'favorite' | 'follow_idol' | 'list';
}

type ExportAction = 'stories' | 'save' | 'other' | null;
type ShareCardFormat = 'story' | 'post';

function getScoreColor(rating: number) {
  if (rating >= 8.5) return '#10b981';
  if (rating >= 7.0) return '#84cc16';
  if (rating >= 5.0) return '#eab308';
  if (rating >= 3.0) return '#f97316';
  return '#ef4444';
}

export function ShareableReviewCard({
  albumTitle,
  artistName,
  albumCover,
  rating,
  comment,
  username,
  activityType = 'review',
}: ShareableReviewCardProps) {
  const { colors } = useAppTheme();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [exportingAction, setExportingAction] = useState<ExportAction>(null);
  const [format, setFormat] = useState<ShareCardFormat>('story');

  const formattedRating = formatRating(rating);
  const isReview = activityType === 'review' && rating > 0;
  const isIdol = activityType === 'follow_idol';
  const scoreColor = getScoreColor(rating);
  const isStory = format === 'story';

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
    <View style={{ gap: 14 }}>
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

      {/* Wrapper de preview com recorte visual arredondado (fora da captura PNG) */}
      <View style={styles.previewFrame}>
        {/* Área capturada em PNG: full-bleed com fundo dinâmico da capa do álbum */}
        <View
          ref={cardRef}
          collapsable={false}
          renderToHardwareTextureAndroid
          style={[
            styles.captureCanvas,
            isStory ? styles.captureCanvasStory : styles.captureCanvasPost,
          ]}
        >
          {/* Camada 1: Cor base escura */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0c0c12' }]} />

          {/* Camada 2: Fundo dinâmico gerado diretamente pelas cores da capa do álbum (blur estilo Spotify) */}
          {Boolean(albumCover) && (
            <Image
              source={{ uri: albumCover }}
              style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.25 }] }]}
              contentFit="cover"
              blurRadius={45}
            />
          )}

          {/* Camada 3: Vinheta suave para contraste profissional e legibilidade */}
          <LinearGradient
            colors={[
              'rgba(10, 10, 16, 0.34)',
              'rgba(10, 10, 16, 0.58)',
              'rgba(8, 8, 12, 0.88)',
            ]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.canvasInner,
              isStory ? styles.canvasInnerStory : styles.canvasInnerPost,
            ]}
          >
            {/* Topo: Marca d'água Musicpostr */}
            <View style={styles.topBrandRow}>
              <Image
                source={MUSICPOSTR_LOGO}
                style={styles.watermarkLogo}
                contentFit="contain"
              />
              <Text style={styles.brand}>MUSICPOSTR</Text>
            </View>

            {/* Centro: Capa em destaque com sombra + Nota + Informações */}
            <View style={styles.centerBlock}>
              <View
                style={[
                  styles.coverShadowWrap,
                  isStory ? styles.coverStoryWrap : styles.coverPostWrap,
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
                style={[styles.title, isStory && styles.titleStory]}
                numberOfLines={2}
              >
                {albumTitle}
              </Text>

              {!isIdol && (
                <Text style={styles.artist} numberOfLines={1}>
                  {artistName}
                </Text>
              )}

              {isReview ? (
                <View
                  style={[
                    styles.scoreBox,
                    { borderColor: `${scoreColor}88` },
                  ]}
                >
                  <Text style={[styles.scoreText, { color: scoreColor }]}>
                    ★ {formattedRating}
                  </Text>
                  <Text style={styles.scoreOutOf}>/10</Text>
                </View>
              ) : null}

              {comment ? (
                <Text
                  style={styles.comment}
                  numberOfLines={isStory ? 4 : 2}
                >
                  {comment}
                </Text>
              ) : null}
            </View>

            {/* Rodapé: @usuário */}
            <View style={styles.footerRow}>
              <Text style={styles.author} numberOfLines={1}>
                @{username}
              </Text>
              <Text style={styles.footerTag}>musicpostr.app</Text>
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
  previewFrame: {
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  captureCanvas: {
    backgroundColor: '#09090d',
    overflow: 'hidden',
  },
  captureCanvasStory: {
    width: 240,
    aspectRatio: 9 / 16,
  },
  captureCanvasPost: {
    width: 280,
    aspectRatio: 4 / 5,
  },
  canvasInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  canvasInnerStory: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  canvasInnerPost: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  watermarkLogo: {
    width: 16,
    height: 16,
  },
  brand: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#c084fc',
  },
  centerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  coverShadowWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  coverStoryWrap: {
    width: 176,
    height: 176,
    marginBottom: 8,
  },
  coverPostWrap: {
    width: 152,
    height: 152,
    marginBottom: 6,
  },
  coverFull: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  titleStory: {
    fontSize: 17.5,
  },
  artist: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  scoreText: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  scoreOutOf: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  comment: {
    fontSize: 11.5,
    color: '#e4e4e7',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4d4d8',
    flex: 1,
  },
  footerTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
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
