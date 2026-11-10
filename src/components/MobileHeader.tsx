import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useAppTheme } from '@/context/ThemeContext';

export function MobileHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 10),
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
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
    borderBottomWidth: 1,
    paddingBottom: 10,
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
