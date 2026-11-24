import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAppTheme } from '@/context/ThemeContext';
import {
  getCachedRecordLabelLogo,
  resolveOfficialRecordLabelLogo,
} from '@/services/recordLabel.service';

interface RecordLabelLogoProps {
  name: string;
  size?: number;
}

/**
 * Exibe SOMENTE a logo oficial da gravadora obtida via Wikidata (P154) / Wikimedia Commons.
 * Quando a gravadora não possuir logo oficial disponível, exibe uma imagem/badge
 * com apenas a letra inicial do nome da gravadora.
 */
export function RecordLabelLogo({ name, size = 30 }: RecordLabelLogoProps) {
  const { colors, isDark } = useAppTheme();
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(() =>
    getCachedRecordLabelLogo(name)
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);
    const cached = getCachedRecordLabelLogo(name);
    setLogoUrl(cached);

    if (cached === undefined) {
      resolveOfficialRecordLabelLogo(name).then((url) => {
        if (active) setLogoUrl(url);
      });
    }

    return () => {
      active = false;
    };
  }, [name]);

  const cleanName = (name || '').trim();
  const initialLetter = (cleanName.charAt(0) || 'G').toUpperCase();
  const radius = Math.round(size * 0.26);
  const padding = Math.max(3, Math.round(size * 0.12));

  if (logoUrl && !hasError) {
    return (
      <View
        style={[
          styles.logoBox,
          {
            width: size,
            height: size,
            borderRadius: radius,
            padding,
            backgroundColor: '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
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
        styles.initialBox,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: isDark ? `${colors.primary}26` : `${colors.primary}18`,
          borderColor: `${colors.primary}55`,
        },
      ]}
    >
      <Text
        style={[
          styles.initialText,
          {
            color: colors.primary,
            fontSize: Math.max(11, Math.round(size * 0.46)),
          },
        ]}
        numberOfLines={1}
      >
        {initialLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  initialBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  initialText: {
    fontWeight: '900',
  },
});
