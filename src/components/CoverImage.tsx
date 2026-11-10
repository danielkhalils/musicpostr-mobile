import React, { useState, useEffect } from 'react';
import { View, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Disc, User } from 'lucide-react-native';
import {
  getFallbackImageUrl,
  markCoverAsMissing,
  optimizeCoverUrl,
} from '@/services/coverArt.service';
import { useAppTheme } from '@/context/ThemeContext';

interface CoverImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackType?: 'album' | 'artist';
  contentFit?: 'cover' | 'contain';
  quality?: 'low' | 'medium';
}

export function CoverImage({
  uri,
  style,
  containerStyle,
  fallbackType = 'album',
  contentFit = 'cover',
  quality = 'low',
}: CoverImageProps) {
  const [stage, setStage] = useState<'primary' | 'fallback' | 'icon'>('primary');
  const { colors } = useAppTheme();

  const resolvedUri = optimizeCoverUrl(
    uri,
    quality === 'medium' ? '500' : '250'
  );
  const fallbackUri = getFallbackImageUrl(resolvedUri || fallbackType, fallbackType);

  useEffect(() => {
    setStage(resolvedUri ? 'primary' : 'fallback');
  }, [resolvedUri]);

  if (stage === 'icon') {
    return (
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
        {fallbackType === 'artist' ? (
          <User size={28} color={colors.mutedForeground} />
        ) : (
          <Disc size={28} color={colors.primary} />
        )}
      </View>
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
        if (stage === 'primary') {
          if (resolvedUri) markCoverAsMissing(resolvedUri);
          setStage('fallback');
        } else {
          setStage('icon');
        }
      }}
    />
  );
}
