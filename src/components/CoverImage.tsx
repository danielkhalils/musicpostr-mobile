import { useAppTheme } from '@/context/ThemeContext';
import {
  getCachedArtistImage,
  resolveArtistImage,
} from '@/services/artistImage.service';
import {
  getFallbackImageUrl,
  markCoverAsMissing,
  optimizeCoverUrl,
} from '@/services/coverArt.service';
import { Image } from 'expo-image';
import { Disc } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

const MUSICPOSTR_STAR_ICON = require('../../assets/icon_transparent_256x256.png');

interface CoverImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackType?: 'album' | 'artist';
  contentFit?: 'cover' | 'contain';
  quality?: 'low' | 'medium' | 'high';
  /**
   * Quando informado, a imagem é resolvida pela foto oficial do artista
   * (API do Deezer, com correspondência exata de nome). Sem foto, exibe o
   * ícone de estrela do Musicpostr — nunca uma imagem genérica ou de outro artista.
   */
  artistName?: string | null;
}

export function CoverImage({
  uri,
  style,
  containerStyle,
  fallbackType = 'album',
  contentFit = 'cover',
  quality = 'low',
  artistName,
}: CoverImageProps) {
  const [stage, setStage] = useState<'primary' | 'fallback' | 'icon'>('primary');
  const { colors } = useAppTheme();

  const [artistPhoto, setArtistPhoto] = useState<string | null | undefined>(() =>
    artistName ? getCachedArtistImage(artistName) : undefined
  );

  useEffect(() => {
    if (!artistName) {
      setArtistPhoto(undefined);
      return;
    }
    let alive = true;
    setArtistPhoto(getCachedArtistImage(artistName));
    resolveArtistImage(artistName).then((url) => {
      if (alive) setArtistPhoto(url);
    });
    return () => {
      alive = false;
    };
  }, [artistName]);

  const resolvedUri = artistName
    ? artistPhoto || null
    : optimizeCoverUrl(
        uri,
        quality === 'high' ? '500' : quality === 'medium' ? '500' : '250'
      );
  const fallbackUri = getFallbackImageUrl(resolvedUri || fallbackType, fallbackType);

  useEffect(() => {
    if (artistName || fallbackType === 'artist') {
      setStage(resolvedUri ? 'primary' : 'icon');
    } else {
      setStage(resolvedUri ? 'primary' : 'fallback');
    }
  }, [resolvedUri, artistName, fallbackType]);

  const renderIconBox = (child: ReactNode) => (
    <View
      style={[
        {
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style as StyleProp<ViewStyle>,
        containerStyle,
      ]}
    >
      {child}
    </View>
  );

  // Artista ainda carregando: placeholder neutro (evita piscar imagem errada)
  if (artistName && artistPhoto === undefined) {
    return renderIconBox(null);
  }

  if (stage === 'icon') {
    return renderIconBox(
      fallbackType === 'artist' || artistName ? (
        <Image
          source={MUSICPOSTR_STAR_ICON}
          style={{ width: '60%', height: '60%' }}
          contentFit="contain"
        />
      ) : (
        <Disc size={28} color={colors.primary} />
      )
    );
  }

  const activeUri =
    stage === 'primary' && resolvedUri ? resolvedUri : fallbackUri;

  return (
    <Image
      source={{ uri: activeUri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      allowDownscaling={true}
      recyclingKey={activeUri}
      transition={120}
      onError={() => {
        if (stage === 'primary' && !artistName && fallbackType !== 'artist') {
          if (resolvedUri) markCoverAsMissing(resolvedUri);
          setStage('fallback');
        } else {
          setStage('icon');
        }
      }}
    />
  );
}
