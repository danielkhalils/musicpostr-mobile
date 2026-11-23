import { useAppTheme } from '@/context/ThemeContext';
import {
  getCachedArtistImage,
  resolveArtistImage,
} from '@/services/artistImage.service';
import {
  getCachedResolvedAlbumCover,
  isFallbackPlaceholderUrl,
  markCoverAsMissing,
  optimizeCoverUrl,
  resolveAlbumCoverUrl,
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
  /**
   * Quando informado em capas de álbum/EP/single, permite buscar automaticamente
   * a capa oficial via Deezer/iTunes caso a URL primária (ex.: Cover Art Archive) falhe.
   */
  albumTitle?: string | null;
  albumArtist?: string | null;
}

export function CoverImage({
  uri,
  style,
  containerStyle,
  fallbackType = 'album',
  contentFit = 'cover',
  quality = 'low',
  artistName,
  albumTitle,
  albumArtist,
}: CoverImageProps) {
  const [stage, setStage] = useState<'primary' | 'resolved' | 'icon'>('primary');
  const { colors } = useAppTheme();

  const [artistPhoto, setArtistPhoto] = useState<string | null | undefined>(() =>
    artistName ? getCachedArtistImage(artistName) : undefined
  );

  const [resolvedAlbumCover, setResolvedAlbumCover] = useState<string | null | undefined>(() =>
    !artistName && fallbackType === 'album' && albumTitle
      ? getCachedResolvedAlbumCover(albumTitle, albumArtist)
      : undefined
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

  const targetSize = quality === 'high' ? '1200' : quality === 'medium' ? '500' : '250';

  const primaryUri = artistName
    ? artistPhoto || null
    : optimizeCoverUrl(uri, targetSize);

  const primaryIsPlaceholder = !artistName && isFallbackPlaceholderUrl(primaryUri);

  // Se a URL primária do álbum já é ausente ou placeholder (ex.: CAA marcado como 404),
  // tenta resolver automaticamente a capa oficial via Deezer/iTunes
  useEffect(() => {
    if (artistName || fallbackType !== 'album' || !albumTitle) {
      setResolvedAlbumCover(undefined);
      return;
    }

    const cached = getCachedResolvedAlbumCover(albumTitle, albumArtist);
    setResolvedAlbumCover(cached);

    if (primaryIsPlaceholder && cached === undefined) {
      let alive = true;
      resolveAlbumCoverUrl(albumTitle, albumArtist).then((url) => {
        if (alive) setResolvedAlbumCover(url);
      });
      return () => {
        alive = false;
      };
    }
  }, [artistName, fallbackType, albumTitle, albumArtist, primaryIsPlaceholder]);

  const optimizedResolvedAlbumCover = resolvedAlbumCover
    ? optimizeCoverUrl(resolvedAlbumCover, targetSize)
    : null;

  useEffect(() => {
    if (artistName || fallbackType === 'artist') {
      setStage(primaryUri ? 'primary' : 'icon');
    } else if (!primaryIsPlaceholder && primaryUri) {
      setStage('primary');
    } else if (optimizedResolvedAlbumCover) {
      setStage('resolved');
    } else {
      setStage('icon');
    }
  }, [primaryUri, primaryIsPlaceholder, optimizedResolvedAlbumCover, artistName, fallbackType]);

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
    stage === 'primary' && primaryUri
      ? primaryUri
      : stage === 'resolved' && optimizedResolvedAlbumCover
        ? optimizedResolvedAlbumCover
        : null;

  if (!activeUri) {
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

  return (
    <Image
      source={{ uri: activeUri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      allowDownscaling={quality === 'low'}
      recyclingKey={activeUri}
      transition={140}
      placeholder={{ blurhash: 'L15#?{of00ay00ay00ay00ay00ay' }}
      onError={() => {
        if (stage === 'primary' && !artistName && fallbackType !== 'artist') {
          if (primaryUri) markCoverAsMissing(primaryUri);
          if (albumTitle) {
            if (optimizedResolvedAlbumCover) {
              setStage('resolved');
              return;
            }
            resolveAlbumCoverUrl(albumTitle, albumArtist).then((found) => {
              if (found) {
                setResolvedAlbumCover(found);
                setStage('resolved');
              } else {
                setStage('icon');
              }
            });
            return;
          }
          setStage('icon');
        } else {
          setStage('icon');
        }
      }}
    />
  );
}
