import React, { useState } from 'react';
import { View, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Disc, User } from 'lucide-react-native';
import { markCoverAsMissing } from '@/services/coverArt.service';
import { useAppTheme } from '@/context/ThemeContext';

interface CoverImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackType?: 'album' | 'artist';
  contentFit?: 'cover' | 'contain';
}

export function CoverImage({
  uri,
  style,
  containerStyle,
  fallbackType = 'album',
  contentFit = 'cover',
}: CoverImageProps) {
  const [hasError, setHasError] = useState(false);
  const { colors } = useAppTheme();

  if (!uri || hasError) {
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

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={180}
      onError={() => {
        if (uri) markCoverAsMissing(uri);
        setHasError(true);
      }}
    />
  );
}
