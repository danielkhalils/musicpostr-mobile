import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Award } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import {
  getCachedAwardLogo,
  resolveOfficialAwardLogo,
} from '@/services/awards.service';

interface AwardLogoProps {
  ceremonyName: string;
  logoUrl?: string;
  size?: number;
  isWinner?: boolean;
}

/**
 * Exibe a logo oficial da premiação (Grammy, BRITs, VMAs, Billboard, Grammy Latino, Multishow, etc.)
 * em um ícone de formato redondo (circular).
 */
export function AwardLogo({
  ceremonyName,
  logoUrl: propLogoUrl,
  size = 42,
  isWinner = false,
}: AwardLogoProps) {
  const { colors } = useAppTheme();
  const [resolvedUrl, setResolvedUrl] = useState<string | null | undefined>(() =>
    propLogoUrl || getCachedAwardLogo(ceremonyName)
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (propLogoUrl) {
      setResolvedUrl(propLogoUrl);
      return;
    }

    const cached = getCachedAwardLogo(ceremonyName);
    setResolvedUrl(cached);

    if (cached === undefined) {
      resolveOfficialAwardLogo(ceremonyName).then((url) => {
        if (active) setResolvedUrl(url);
      });
    }

    return () => {
      active = false;
    };
  }, [ceremonyName, propLogoUrl]);

  const borderColor = isWinner ? `${colors.amber}66` : colors.border;

  if (resolvedUrl && !hasError) {
    return (
      <View
        style={[
          styles.circleBox,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#FFFFFF',
            borderColor,
            padding: Math.max(4, Math.round(size * 0.14)),
          },
        ]}
      >
        <Image
          source={{ uri: resolvedUrl }}
          style={styles.logoImage}
          contentFit="contain"
          cachePolicy="memory-disk"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circleBox,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isWinner ? `${colors.amber}20` : colors.secondary,
          borderColor,
        },
      ]}
    >
      <Award
        size={Math.round(size * 0.48)}
        color={isWinner ? colors.amber : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circleBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
