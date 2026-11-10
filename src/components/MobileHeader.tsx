import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useAppTheme } from '@/context/ThemeContext';
import { useHeaderVisibility } from '@/context/HeaderVisibilityContext';

export function MobileHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isHeaderVisible } = useHeaderVisibility();

  if (!isHeaderVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 10),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(tabs)/index' as any)}
          activeOpacity={0.8}
        >
          <Image
            source={require('@/assets/icon_transparent_96x96.png')}
            style={styles.brandLogoImg}
            contentFit="contain"
          />
          <Text style={[styles.brandText, { color: colors.foreground }]}>
            MUSICPOSTR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandLogoImg: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
